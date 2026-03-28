package main

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func (a *App) getCart(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	discount, _ := a.findAppliedDiscount(cart)
	c.JSON(http.StatusOK, gin.H{"message": "Cart fetched", "data": serializeCart(cart, discount)})
}

func (a *App) addOrUpdateCartItem(c *gin.Context) {
	userID := c.GetUint(authUserKey)

	var body struct {
		MenuItemID uint `json:"menuItemId" binding:"required"`
		Quantity   int  `json:"quantity" binding:"required"`
		ForceSwap  bool `json:"forceSwap"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	if body.Quantity <= 0 {
		writeError(c, http.StatusBadRequest, "Quantity must be greater than 0", nil)
		return
	}

	var menuItem MenuItem
	if err := a.db.First(&menuItem, body.MenuItemID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Menu item not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if !menuItem.IsAvailable {
		writeError(c, http.StatusBadRequest, "Menu item unavailable", nil)
		return
	}

	var restaurant Restaurant
	if err := a.db.First(&restaurant, menuItem.RestaurantID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if !restaurant.IsOpen {
		writeError(c, http.StatusBadRequest, "Restaurant is currently closed", nil)
		return
	}

	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	restaurantIDs := make([]uint, 0, 2)
	if err := a.db.Model(&CartItem{}).
		Where("cart_id = ?", cart.ID).
		Distinct("restaurant_id").
		Pluck("restaurant_id", &restaurantIDs).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	crossRestaurantConflict := false
	if len(restaurantIDs) > 1 {
		crossRestaurantConflict = true
	}
	if len(restaurantIDs) == 1 && restaurantIDs[0] != menuItem.RestaurantID {
		crossRestaurantConflict = true
	}

	if crossRestaurantConflict {
		if !body.ForceSwap {
			writeError(c, http.StatusConflict, "Cart can only contain items from one restaurant", nil)
			return
		}
		if err := a.db.Where("cart_id = ?", cart.ID).Delete(&CartItem{}).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
		cart.AppliedDiscountCode = nil
		if err := a.db.Save(cart).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	}

	var existing CartItem
	err = a.db.Where("cart_id = ? AND menu_item_id = ?", cart.ID, body.MenuItemID).First(&existing).Error
	if err == nil {
		existing.Quantity = body.Quantity
		existing.UnitPrice = menuItem.Price
		existing.MenuItemName = menuItem.Name
		existing.RestaurantName = restaurant.Name
		if err := a.db.Save(&existing).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	} else if err == gorm.ErrRecordNotFound {
		item := CartItem{
			CartID:         cart.ID,
			MenuItemID:     menuItem.ID,
			RestaurantID:   menuItem.RestaurantID,
			MenuItemName:   menuItem.Name,
			RestaurantName: restaurant.Name,
			UnitPrice:      menuItem.Price,
			Quantity:       body.Quantity,
		}
		if err := a.db.Create(&item).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	} else {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	updatedCart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	discount, _ := a.findAppliedDiscount(updatedCart)
	c.JSON(http.StatusOK, gin.H{"message": "Cart item upserted", "data": serializeCart(updatedCart, discount)})
}

func (a *App) replaceCartWithItem(c *gin.Context) {
	userID := c.GetUint(authUserKey)

	var body struct {
		MenuItemID uint `json:"menuItemId" binding:"required"`
		Quantity   int  `json:"quantity" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	if body.Quantity <= 0 {
		writeError(c, http.StatusBadRequest, "Quantity must be  greater than 0", nil)
		return
	}

	// Fetch menu item
	var menuItem MenuItem
	if err := a.db.First(&menuItem, body.MenuItemID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Menu item not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if !menuItem.IsAvailable {
		writeError(c, http.StatusBadRequest, "Menu item unavailable", nil)
		return
	}

	// Fetch restaurant
	var restaurant Restaurant
	if err := a.db.First(&restaurant, menuItem.RestaurantID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if !restaurant.IsOpen {
		writeError(c, http.StatusBadRequest, "Restaurant is currently closed", nil)
		return
	}

	// 🔥 IMPORTANT: fetch cart WITHOUT preloading items
	var cart Cart
	if err := a.db.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			cart = Cart{UserID: userID}
			if err := a.db.Create(&cart).Error; err != nil {
				writeError(c, http.StatusInternalServerError, "DB error", err)
				return
			}
		} else {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	}

	if err := a.db.Session(&gorm.Session{
		FullSaveAssociations: false,
	}).Transaction(func(tx *gorm.DB) error {

		fmt.Println("Replacing cart items for user", userID, "cart", cart.ID)

		// 1. Delete all existing items
		if err := tx.Where("cart_id = ?", cart.ID).Delete(&CartItem{}).Error; err != nil {
			return err
		}

		// 2. Reset discount (safe update)
		if err := tx.Model(&Cart{}).
			Where("id = ?", cart.ID).
			Update("applied_discount_code", nil).Error; err != nil {
			return err
		}

		// 3. Insert new item
		newItem := CartItem{
			CartID:         cart.ID,
			MenuItemID:     menuItem.ID,
			RestaurantID:   menuItem.RestaurantID,
			MenuItemName:   menuItem.Name,
			RestaurantName: restaurant.Name,
			UnitPrice:      menuItem.Price,
			Quantity:       body.Quantity,
		}

		if err := tx.Create(&newItem).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	// Fetch updated cart (safe to preload here)
	var updatedCart Cart
	if err := a.db.Preload("Items").Where("user_id = ?", userID).First(&updatedCart).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cart replaced",
		"data":    serializeCart(&updatedCart, nil),
	})
}

func (a *App) removeCartItem(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	itemIDParam := strings.TrimSpace(c.Param("itemId"))
	itemID, err := strconv.ParseUint(itemIDParam, 10, 32)
	if err != nil {
		writeError(c, http.StatusBadRequest, "Invalid cart item ID", err)
		return
	}

	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	res := a.db.Where("id = ? AND cart_id = ?", uint(itemID), cart.ID).Delete(&CartItem{})
	if res.Error != nil {
		writeError(c, http.StatusInternalServerError, "DB error", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		writeError(c, http.StatusNotFound, "Cart item not found", nil)
		return
	}

	updatedCart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	discount, _ := a.findAppliedDiscount(updatedCart)
	c.JSON(http.StatusOK, gin.H{"message": "Cart item removed", "data": serializeCart(updatedCart, discount)})
}

func (a *App) clearCart(c *gin.Context) {
	userID := c.GetUint(authUserKey)

	cart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	if err := a.db.Where("cart_id = ?", cart.ID).Delete(&CartItem{}).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	cart.AppliedDiscountCode = nil
	if err := a.db.Save(cart).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	updatedCart, err := a.getOrCreateCartForUser(userID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared", "data": serializeCart(updatedCart, nil)})
}

func (a *App) getOrCreateCartForUser(userID uint) (*Cart, error) {
	var cart Cart
	err := a.db.Preload("Items").Where("user_id = ?", userID).First(&cart).Error
	if err == nil {
		return &cart, nil
	}

	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	cart = Cart{UserID: userID}
	if err := a.db.Create(&cart).Error; err != nil {
		return nil, err
	}
	if err := a.db.Preload("Items").First(&cart, cart.ID).Error; err != nil {
		return nil, err
	}
	return &cart, nil
}

func (a *App) findAppliedDiscount(cart *Cart) (*Discount, error) {
	if cart.AppliedDiscountCode == nil {
		return nil, nil
	}
	var discount Discount
	if err := a.db.Where("code = ?", *cart.AppliedDiscountCode).First(&discount).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &discount, nil
}

func serializeCart(cart *Cart, discount *Discount) gin.H {
	itemData := make([]gin.H, 0, len(cart.Items))
	totalItems := 0
	subtotal := 0.0
	var restaurantID uint
	restaurantName := ""

	for _, item := range cart.Items {
		itemTotal := item.UnitPrice * float64(item.Quantity)
		totalItems += item.Quantity
		subtotal += itemTotal
		if restaurantID == 0 {
			restaurantID = item.RestaurantID
			restaurantName = item.RestaurantName
		} else if restaurantID != item.RestaurantID {
			restaurantID = 0
			restaurantName = ""
		}

		itemData = append(itemData, gin.H{
			"id":             strconv.FormatUint(uint64(item.ID), 10),
			"menuItemId":     strconv.FormatUint(uint64(item.MenuItemID), 10),
			"restaurantId":   strconv.FormatUint(uint64(item.RestaurantID), 10),
			"menuItemName":   item.MenuItemName,
			"restaurantName": item.RestaurantName,
			"unitPrice":      item.UnitPrice,
			"quantity":       item.Quantity,
			"lineTotal":      math.Round(itemTotal*100) / 100,
		})
	}

	discountAmount := 0.0
	var discountData gin.H
	if discount != nil {
		discountAmount = calculateDiscountAmount(*discount, subtotal)
		discountData = gin.H{
			"code":        discount.Code,
			"title":       discount.Title,
			"description": discount.Description,
			"type":        discount.Type,
			"value":       discount.Value,
			"maxDiscount": discount.MaxDiscount,
			"amount":      math.Round(discountAmount*100) / 100,
		}
	}
	totalPrice := subtotal - discountAmount
	if totalPrice < 0 {
		totalPrice = 0
	}

	result := gin.H{
		"id":              strconv.FormatUint(uint64(cart.ID), 10),
		"userId":          strconv.FormatUint(uint64(cart.UserID), 10),
		"items":           itemData,
		"totalItems":      totalItems,
		"subtotal":        math.Round(subtotal*100) / 100,
		"discountAmount":  math.Round(discountAmount*100) / 100,
		"totalPrice":      math.Round(totalPrice*100) / 100,
		"appliedDiscount": discountData,
	}

	if restaurantID != 0 {
		result["restaurantId"] = strconv.FormatUint(uint64(restaurantID), 10)
		result["restaurantName"] = restaurantName
	}

	return result
}
