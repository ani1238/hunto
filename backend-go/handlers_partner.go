package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func (a *App) partnerMe(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	var restaurant Restaurant
	if err := a.db.First(&restaurant, restaurantID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Partner restaurant fetched",
		"data": gin.H{
			"id":           strconv.FormatUint(uint64(restaurant.ID), 10),
			"name":         restaurant.Name,
			"tagline":      restaurant.Tagline,
			"phone":        restaurant.Phone,
			"image":        restaurant.Image,
			"deliveryTime": restaurant.DeliveryTime,
			"openingTime":  restaurant.OpeningTime,
			"closingTime":  restaurant.ClosingTime,
			"isOpen":       restaurant.IsOpen,
		},
	})
}

func (a *App) partnerUpdateAvailability(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	var restaurant Restaurant
	if err := a.db.First(&restaurant, restaurantID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	var body struct {
		IsOpen      bool   `json:"isOpen"`
		OpeningTime string `json:"openingTime" binding:"required"`
		ClosingTime string `json:"closingTime" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	opening := strings.TrimSpace(body.OpeningTime)
	closing := strings.TrimSpace(body.ClosingTime)
	if !isHHMM(opening) || !isHHMM(closing) {
		writeError(c, http.StatusBadRequest, "Opening/closing time must be HH:MM", nil)
		return
	}

	restaurant.IsOpen = body.IsOpen
	restaurant.OpeningTime = opening
	restaurant.ClosingTime = closing
	if err := a.db.Save(&restaurant).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Availability updated", "data": gin.H{
		"id":           strconv.FormatUint(uint64(restaurant.ID), 10),
		"isOpen":       restaurant.IsOpen,
		"openingTime":  restaurant.OpeningTime,
		"closingTime":  restaurant.ClosingTime,
		"deliveryTime": restaurant.DeliveryTime,
	}})
}

func (a *App) partnerListMenu(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	var items []MenuItem
	if err := a.db.Where("restaurant_id = ?", restaurantID).Order("updated_at DESC").Find(&items).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	result := make([]gin.H, 0, len(items))
	for _, item := range items {
		result = append(result, gin.H{
			"id":           strconv.FormatUint(uint64(item.ID), 10),
			"name":         item.Name,
			"description":  item.Description,
			"price":        item.Price,
			"image":        item.Image,
			"isVeg":        item.IsVeg,
			"isBestseller": item.IsBestseller,
			"isAvailable":  item.IsAvailable,
		})
	}
	c.JSON(http.StatusOK, gin.H{"message": "Partner menu fetched", "data": result})
}

func (a *App) partnerCreateMenuItem(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	var body struct {
		Name         string  `json:"name" binding:"required"`
		Description  string  `json:"description" binding:"required"`
		Price        float64 `json:"price" binding:"required"`
		Image        string  `json:"image" binding:"required"`
		IsVeg        bool    `json:"isVeg"`
		IsBestseller bool    `json:"isBestseller"`
		IsAvailable  *bool   `json:"isAvailable"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	isAvailable := true
	if body.IsAvailable != nil {
		isAvailable = *body.IsAvailable
	}
	item := MenuItem{
		RestaurantID: restaurantID,
		Name:         strings.TrimSpace(body.Name),
		Description:  strings.TrimSpace(body.Description),
		Price:        body.Price,
		Image:        strings.TrimSpace(body.Image),
		IsVeg:        body.IsVeg,
		IsBestseller: body.IsBestseller,
		IsAvailable:  isAvailable,
	}
	if err := a.db.Create(&item).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Menu item created", "data": gin.H{"id": strconv.FormatUint(uint64(item.ID), 10)}})
}

func (a *App) partnerCreateMenuItemUpload(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	if a.storage == nil {
		writeError(c, http.StatusServiceUnavailable, "Image upload not configured", nil)
		return
	}

	var body struct {
		FileName    string `json:"fileName" binding:"required"`
		ContentType string `json:"contentType" binding:"required"`
		SizeBytes   int64  `json:"sizeBytes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	if body.SizeBytes <= 0 {
		writeError(c, http.StatusBadRequest, "File size must be greater than zero", nil)
		return
	}
	if body.SizeBytes > a.storageConfig.MaxUploadBytes {
		writeError(c, http.StatusBadRequest, "File exceeds upload size limit", nil)
		return
	}

	upload, err := a.storage.CreateMenuItemUpload(restaurantID, body.FileName, body.ContentType)
	if err != nil {
		writeError(c, http.StatusBadRequest, "Invalid upload request", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Upload URL created",
		"data": gin.H{
			"uploadUrl":      upload.UploadURL,
			"publicUrl":      upload.PublicURL,
			"objectKey":      upload.ObjectKey,
			"contentType":    upload.ContentType,
			"expiresIn":      upload.ExpiresIn,
			"maxUploadBytes": a.storageConfig.MaxUploadBytes,
		},
	})
}

func (a *App) partnerUpdateMenuItem(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	menuItemID, ok := parseUintPathParam(c, "menuItemId")
	if !ok {
		return
	}
	var item MenuItem
	if err := a.db.Where("id = ? AND restaurant_id = ?", menuItemID, restaurantID).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Menu item not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	var body struct {
		Name         string  `json:"name" binding:"required"`
		Description  string  `json:"description" binding:"required"`
		Price        float64 `json:"price" binding:"required"`
		Image        string  `json:"image" binding:"required"`
		IsVeg        bool    `json:"isVeg"`
		IsBestseller bool    `json:"isBestseller"`
		IsAvailable  *bool   `json:"isAvailable"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	item.Name = strings.TrimSpace(body.Name)
	item.Description = strings.TrimSpace(body.Description)
	item.Price = body.Price
	item.Image = strings.TrimSpace(body.Image)
	item.IsVeg = body.IsVeg
	item.IsBestseller = body.IsBestseller
	if body.IsAvailable != nil {
		item.IsAvailable = *body.IsAvailable
	}

	if err := a.db.Save(&item).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Menu item updated"})
}

func (a *App) partnerDeleteMenuItem(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	menuItemID, ok := parseUintPathParam(c, "menuItemId")
	if !ok {
		return
	}
	res := a.db.Where("id = ? AND restaurant_id = ?", menuItemID, restaurantID).Delete(&MenuItem{})
	if res.Error != nil {
		writeError(c, http.StatusInternalServerError, "DB error", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		writeError(c, http.StatusNotFound, "Menu item not found", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Menu item deleted"})
}

func (a *App) partnerListOrders(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	if err := a.autoCancelExpiredPlacedOrdersForRestaurant(restaurantID); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	var orders []Order
	if err := a.db.Preload("Items").Where("restaurant_id = ?", restaurantID).Order("created_at DESC").Limit(200).Find(&orders).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	result := make([]gin.H, 0, len(orders))
	for _, order := range orders {
		result = append(result, serializeOrder(order))
	}
	c.JSON(http.StatusOK, gin.H{"message": "Partner orders fetched", "data": result})
}

func (a *App) partnerUpdateOrderStatus(c *gin.Context) {
	restaurantID := c.GetUint(partnerRestaurantIDKey)
	orderID, ok := parseUintPathParam(c, "orderId")
	if !ok {
		return
	}
	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	status := strings.TrimSpace(strings.ToLower(body.Status))
	if !isAllowedOrderStatus(status) {
		writeError(c, http.StatusBadRequest, "Invalid order status", nil)
		return
	}
	var order Order
	if err := a.db.Where("id = ? AND restaurant_id = ?", orderID, restaurantID).First(&order).Error; err != nil {
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
		writeError(c, http.StatusBadRequest, "Order auto-cancelled due to no response in 30 seconds", nil)
		return
	}

	if status == "preparing" && order.Status == "placed" {
		// Partner "Accept" action maps directly to preparing.
		order.Status = "preparing"
	} else {
		order.Status = status
	}
	if err := a.db.Save(&order).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Order status updated"})
}

func isHHMM(value string) bool {
	if len(value) != 5 || value[2] != ':' {
		return false
	}
	hours, err := strconv.Atoi(value[:2])
	if err != nil {
		return false
	}
	minutes, err := strconv.Atoi(value[3:])
	if err != nil {
		return false
	}
	return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}
