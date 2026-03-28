package main

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const partnerOrderDecisionWindow = 30 * time.Second

func (a *App) placeOrder(c *gin.Context) {
	userID := c.GetUint(authUserKey)

	var body struct {
		DeliveryLocationID uint `json:"deliveryLocationId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
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

	var location UserLocation
	if err := a.db.Where("id = ? AND user_id = ?", body.DeliveryLocationID, userID).First(&location).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Delivery location not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	restaurantID := cart.Items[0].RestaurantID
	restaurantName := cart.Items[0].RestaurantName
	var restaurant Restaurant
	if err := a.db.First(&restaurant, restaurantID).Error; err != nil {
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
	subtotal := cartSubtotal(cart)
	deliveryFee := 0.0
	if subtotal < 199 {
		deliveryFee = 20
	}

	discountAmount := 0.0
	var appliedCode *string
	if discount, _ := a.findAppliedDiscount(cart); discount != nil {
		discountAmount = calculateDiscountAmount(*discount, subtotal)
		appliedCode = &discount.Code
	}
	totalAfterDiscount := subtotal - discountAmount
	if totalAfterDiscount < 0 {
		totalAfterDiscount = 0
	}
	taxes := math.Round(totalAfterDiscount*0.05*100) / 100
	grandTotal := math.Round((totalAfterDiscount+deliveryFee+taxes)*100) / 100

	order := Order{
		UserID:                userID,
		RestaurantID:          restaurantID,
		RestaurantName:        restaurantName,
		RestaurantPhone:       restaurant.Phone,
		Status:                "placed",
		Subtotal:              math.Round(subtotal*100) / 100,
		DiscountAmount:        math.Round(discountAmount*100) / 100,
		DeliveryFee:           deliveryFee,
		Taxes:                 taxes,
		GrandTotal:            grandTotal,
		AppliedDiscountCode:   appliedCode,
		DeliveryLocationID:    location.ID,
		DeliveryLocationLabel: location.Label,
		DeliveryAddressLine:   location.AddressLine,
		DeliveryCity:          location.City,
		DeliveryState:         location.State,
		DeliveryPostalCode:    location.PostalCode,
		DeliveryCountry:       location.Country,
		DeliveryLatitude:      location.Latitude,
		DeliveryLongitude:     location.Longitude,
		Items:                 make([]OrderItem, 0, len(cart.Items)),
	}

	for _, item := range cart.Items {
		lineTotal := math.Round(item.UnitPrice*float64(item.Quantity)*100) / 100
		order.Items = append(order.Items, OrderItem{
			MenuItemID:     item.MenuItemID,
			MenuItemName:   item.MenuItemName,
			RestaurantID:   item.RestaurantID,
			RestaurantName: item.RestaurantName,
			UnitPrice:      item.UnitPrice,
			Quantity:       item.Quantity,
			LineTotal:      lineTotal,
		})
	}

	if err := a.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&order).Error; err != nil {
			return err
		}
		if err := tx.Where("cart_id = ?", cart.ID).Delete(&CartItem{}).Error; err != nil {
			return err
		}
		return tx.Model(&Cart{}).
			Where("id = ?", cart.ID).
			Update("applied_discount_code", nil).
			Error
	}); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Order placed", "data": serializeOrder(order)})
}

func (a *App) listOrders(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	if err := a.autoCancelExpiredPlacedOrdersForUser(userID); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	var orders []Order
	if err := a.db.Preload("Items").Where("user_id = ?", userID).Order("created_at DESC").Find(&orders).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	resp := make([]gin.H, 0, len(orders))
	for i := range orders {
		resp = append(resp, serializeOrder(orders[i]))
	}
	c.JSON(http.StatusOK, gin.H{"message": "Orders fetched", "data": resp})
}

func (a *App) getOrder(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	orderID, ok := parseUintPathParam(c, "orderId")
	if !ok {
		return
	}

	var order Order
	if err := a.db.Preload("Items").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Order not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if expired, err := a.cancelOrderIfPlacedExpired(&order); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	} else if expired {
		order.Status = "cancelled"
	}
	c.JSON(http.StatusOK, gin.H{"message": "Order fetched", "data": serializeOrder(order)})
}

func (a *App) trackOrder(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	orderID, ok := parseUintPathParam(c, "orderId")
	if !ok {
		return
	}

	var order Order
	if err := a.db.Preload("Items").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Order not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if expired, err := a.cancelOrderIfPlacedExpired(&order); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	} else if expired {
		order.Status = "cancelled"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order tracking fetched",
		"data": gin.H{
			"orderId": strconv.FormatUint(uint64(order.ID), 10),
			"status":  order.Status,
			"timeline": []gin.H{
				{"status": "placed", "done": true},
				{"status": "accepted", "done": statusReached(order.Status, "accepted")},
				{"status": "preparing", "done": statusReached(order.Status, "preparing")},
				{"status": "out_for_delivery", "done": statusReached(order.Status, "out_for_delivery")},
				{"status": "delivered", "done": statusReached(order.Status, "delivered")},
			},
			"order": serializeOrder(order),
		},
	})
}

func statusReached(current, step string) bool {
	order := map[string]int{
		"placed":           1,
		"accepted":         2,
		"preparing":        3,
		"out_for_delivery": 4,
		"delivered":        5,
	}
	return order[current] >= order[step]
}

func serializeOrder(order Order) gin.H {
	items := make([]gin.H, 0, len(order.Items))
	for _, i := range order.Items {
		items = append(items, gin.H{
			"id":             strconv.FormatUint(uint64(i.ID), 10),
			"menuItemId":     strconv.FormatUint(uint64(i.MenuItemID), 10),
			"menuItemName":   i.MenuItemName,
			"restaurantId":   strconv.FormatUint(uint64(i.RestaurantID), 10),
			"restaurantName": i.RestaurantName,
			"unitPrice":      i.UnitPrice,
			"quantity":       i.Quantity,
			"lineTotal":      i.LineTotal,
		})
	}

	return gin.H{
		"id":                  strconv.FormatUint(uint64(order.ID), 10),
		"userId":              strconv.FormatUint(uint64(order.UserID), 10),
		"restaurantId":        strconv.FormatUint(uint64(order.RestaurantID), 10),
		"restaurantName":      order.RestaurantName,
		"restaurantPhone":     order.RestaurantPhone,
		"status":              order.Status,
		"subtotal":            order.Subtotal,
		"discountAmount":      order.DiscountAmount,
		"deliveryFee":         order.DeliveryFee,
		"taxes":               order.Taxes,
		"grandTotal":          order.GrandTotal,
		"appliedDiscountCode": order.AppliedDiscountCode,
		"deliveryLocation": gin.H{
			"id":          strconv.FormatUint(uint64(order.DeliveryLocationID), 10),
			"label":       order.DeliveryLocationLabel,
			"addressLine": order.DeliveryAddressLine,
			"city":        order.DeliveryCity,
			"state":       order.DeliveryState,
			"postalCode":  order.DeliveryPostalCode,
			"country":     order.DeliveryCountry,
			"latitude":    order.DeliveryLatitude,
			"longitude":   order.DeliveryLongitude,
		},
		"items":                      items,
		"acceptBy":                   order.CreatedAt.Add(partnerOrderDecisionWindow),
		"acceptanceSecondsRemaining": orderAcceptanceSecondsRemaining(order, time.Now()),
		"createdAt":                  order.CreatedAt,
		"updatedAt":                  order.UpdatedAt,
	}
}

func orderAcceptanceSecondsRemaining(order Order, now time.Time) int64 {
	if order.Status != "placed" {
		return 0
	}
	remaining := order.CreatedAt.Add(partnerOrderDecisionWindow).Sub(now)
	if remaining <= 0 {
		return 0
	}
	return int64(remaining.Seconds())
}

func (a *App) autoCancelExpiredPlacedOrdersForUser(userID uint) error {
	deadline := time.Now().Add(-partnerOrderDecisionWindow)
	return a.db.Model(&Order{}).
		Where("user_id = ? AND status = ? AND created_at <= ?", userID, "placed", deadline).
		Updates(map[string]interface{}{"status": "cancelled", "updated_at": time.Now()}).
		Error
}

func (a *App) autoCancelExpiredPlacedOrdersForRestaurant(restaurantID uint) error {
	deadline := time.Now().Add(-partnerOrderDecisionWindow)
	return a.db.Model(&Order{}).
		Where("restaurant_id = ? AND status = ? AND created_at <= ?", restaurantID, "placed", deadline).
		Updates(map[string]interface{}{"status": "cancelled", "updated_at": time.Now()}).
		Error
}

func (a *App) cancelOrderIfPlacedExpired(order *Order) (bool, error) {
	if order.Status != "placed" {
		return false, nil
	}
	if time.Now().Before(order.CreatedAt.Add(partnerOrderDecisionWindow)) {
		return false, nil
	}
	if err := a.db.Model(order).Updates(map[string]interface{}{
		"status":     "cancelled",
		"updated_at": time.Now(),
	}).Error; err != nil {
		return false, err
	}
	order.Status = "cancelled"
	order.UpdatedAt = time.Now()
	return true, nil
}
