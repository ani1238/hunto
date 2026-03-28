package main

import (
	"errors"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func (a *App) listApplicableDiscounts(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	total := cartSubtotal(cart)
	restaurantID := cartRestaurantID(cart)
	discounts, err := a.fetchActiveDiscounts(restaurantID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	result := make([]gin.H, 0, len(discounts))
	for _, d := range discounts {
		if total < d.MinOrder {
			continue
		}
		amount := calculateDiscountAmount(d, total)
		result = append(result, gin.H{
			"code":        d.Code,
			"title":       d.Title,
			"description": d.Description,
			"type":        d.Type,
			"value":       d.Value,
			"maxDiscount": d.MaxDiscount,
			"minOrder":    d.MinOrder,
			"savings":     math.Round(amount*100) / 100,
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Discounts fetched", "data": result})
}

func (a *App) applyDiscountToCart(c *gin.Context) {
	userID := c.GetUint(authUserKey)

	var body struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	code := strings.ToUpper(strings.TrimSpace(body.Code))
	if code == "" {
		writeError(c, http.StatusBadRequest, "Discount code is required", nil)
		return
	}

	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if len(cart.Items) == 0 {
		writeError(c, http.StatusBadRequest, "Cart is empty", nil)
		return
	}

	var discount Discount
	if err := a.db.Where("code = ?", code).First(&discount).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Discount not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	subtotal := cartSubtotal(cart)
	if err := validateDiscountEligibility(discount, subtotal, cartRestaurantID(cart)); err != nil {
		writeError(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	cart.AppliedDiscountCode = &discount.Code
	if err := a.db.Save(cart).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	updated, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Discount applied", "data": serializeCart(updated, &discount)})
}

func (a *App) removeDiscountFromCart(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	cart.AppliedDiscountCode = nil
	if err := a.db.Save(cart).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	updated, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Discount removed", "data": serializeCart(updated, nil)})
}

func (a *App) fetchActiveDiscounts(restaurantID uint) ([]Discount, error) {
	var discounts []Discount
	if err := a.db.Where("is_active = ?", true).Order("updated_at DESC").Find(&discounts).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	filtered := make([]Discount, 0, len(discounts))
	for _, d := range discounts {
		if d.StartAt != nil && now.Before(*d.StartAt) {
			continue
		}
		if d.EndAt != nil && now.After(*d.EndAt) {
			continue
		}
		if d.RestaurantID != nil && *d.RestaurantID != restaurantID {
			continue
		}
		filtered = append(filtered, d)
	}
	return filtered, nil
}

func validateDiscountEligibility(discount Discount, subtotal float64, restaurantID uint) error {
	now := time.Now()
	if !discount.IsActive {
		return errors.New("Discount is inactive")
	}
	if discount.StartAt != nil && now.Before(*discount.StartAt) {
		return errors.New("Discount is not active yet")
	}
	if discount.EndAt != nil && now.After(*discount.EndAt) {
		return errors.New("Discount has expired")
	}
	if subtotal < discount.MinOrder {
		return errors.New("Cart total does not meet minimum order for this discount")
	}
	if discount.RestaurantID != nil && *discount.RestaurantID != restaurantID {
		return errors.New("Discount is not valid for this restaurant")
	}
	return nil
}

func calculateDiscountAmount(discount Discount, subtotal float64) float64 {
	amount := 0.0
	if discount.Type == "flat" {
		amount = discount.Value
	} else {
		amount = subtotal * (discount.Value / 100)
	}
	if discount.MaxDiscount != nil && amount > *discount.MaxDiscount {
		amount = *discount.MaxDiscount
	}
	if amount > subtotal {
		amount = subtotal
	}
	return amount
}

func cartSubtotal(cart *Cart) float64 {
	total := 0.0
	for _, item := range cart.Items {
		total += item.UnitPrice * float64(item.Quantity)
	}
	return total
}

func cartRestaurantID(cart *Cart) uint {
	if len(cart.Items) == 0 {
		return 0
	}
	return cart.Items[0].RestaurantID
}
