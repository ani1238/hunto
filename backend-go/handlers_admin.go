package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func (a *App) adminDashboard(c *gin.Context) {
	var restaurantCount int64
	var menuCount int64
	var orderCount int64
	var userCount int64
	var activeDiscountCount int64

	if err := a.db.Model(&Restaurant{}).Count(&restaurantCount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if err := a.db.Model(&MenuItem{}).Count(&menuCount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if err := a.db.Model(&Order{}).Count(&orderCount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if err := a.db.Model(&User{}).Count(&userCount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	if err := a.db.Model(&Discount{}).Where("is_active = ?", true).Count(&activeDiscountCount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin dashboard fetched",
		"data": gin.H{
			"restaurants":     restaurantCount,
			"menuItems":       menuCount,
			"orders":          orderCount,
			"users":           userCount,
			"activeDiscounts": activeDiscountCount,
		},
	})
}

type adminRestaurantPayload struct {
	Name         string   `json:"name" binding:"required"`
	Tagline      string   `json:"tagline" binding:"required"`
	Phone        string   `json:"phone" binding:"required"`
	Image        string   `json:"image" binding:"required"`
	Rating       float64  `json:"rating"`
	ReviewCount  int      `json:"reviewCount"`
	DeliveryTime string   `json:"deliveryTime" binding:"required"`
	DeliveryFee  string   `json:"deliveryFee" binding:"required"`
	Distance     string   `json:"distance" binding:"required"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
	IsOpen       *bool    `json:"isOpen"`
	IsPromoted   *bool    `json:"isPromoted"`
	Discount     *string  `json:"discount"`
	Tags         []string `json:"tags"`
}

func (a *App) adminListRestaurants(c *gin.Context) {
	var restaurants []Restaurant
	if err := a.db.Preload("MenuItems").Order("updated_at DESC").Find(&restaurants).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	result := make([]gin.H, 0, len(restaurants))
	for _, r := range restaurants {
		menu := make([]gin.H, 0, len(r.MenuItems))
		for _, m := range r.MenuItems {
			menu = append(menu, gin.H{
				"id":           strconv.FormatUint(uint64(m.ID), 10),
				"name":         m.Name,
				"description":  m.Description,
				"price":        m.Price,
				"image":        m.Image,
				"isVeg":        m.IsVeg,
				"isBestseller": m.IsBestseller,
				"isAvailable":  m.IsAvailable,
			})
		}
		result = append(result, gin.H{
			"id":           strconv.FormatUint(uint64(r.ID), 10),
			"name":         r.Name,
			"tagline":      r.Tagline,
			"phone":        r.Phone,
			"image":        r.Image,
			"rating":       r.Rating,
			"reviewCount":  r.ReviewCount,
			"deliveryTime": r.DeliveryTime,
			"deliveryFee":  r.DeliveryFee,
			"distance":     r.Distance,
			"latitude":     r.Latitude,
			"longitude":    r.Longitude,
			"isOpen":       r.IsOpen,
			"isPromoted":   r.IsPromoted,
			"discount":     r.Discount,
			"tags":         splitTags(r.TagsCSV),
			"menu":         menu,
		})
	}
	c.JSON(http.StatusOK, gin.H{"message": "Admin restaurants fetched", "data": result})
}

func (a *App) adminCreateRestaurant(c *gin.Context) {
	var body adminRestaurantPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Tagline = strings.TrimSpace(body.Tagline)
	body.Phone = strings.TrimSpace(body.Phone)
	body.Image = strings.TrimSpace(body.Image)
	if body.Phone == "" {
		writeError(c, http.StatusBadRequest, "Phone is required", nil)
		return
	}
	body.DeliveryTime = strings.TrimSpace(body.DeliveryTime)
	body.DeliveryFee = strings.TrimSpace(body.DeliveryFee)
	body.Distance = strings.TrimSpace(body.Distance)

	isOpen := true
	if body.IsOpen != nil {
		isOpen = *body.IsOpen
	}
	isPromoted := false
	if body.IsPromoted != nil {
		isPromoted = *body.IsPromoted
	}
	var discount *string
	if body.Discount != nil {
		trimmed := strings.TrimSpace(*body.Discount)
		if trimmed != "" {
			discount = &trimmed
		}
	}

	restaurant := Restaurant{
		Name:         body.Name,
		Tagline:      body.Tagline,
		Phone:        body.Phone,
		Image:        body.Image,
		Rating:       body.Rating,
		ReviewCount:  body.ReviewCount,
		DeliveryTime: body.DeliveryTime,
		DeliveryFee:  body.DeliveryFee,
		Distance:     body.Distance,
		Latitude:     body.Latitude,
		Longitude:    body.Longitude,
		IsOpen:       isOpen,
		IsPromoted:   isPromoted,
		Discount:     discount,
		TagsCSV:      strings.Join(body.Tags, ","),
	}
	if err := a.db.Create(&restaurant).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Restaurant created", "data": gin.H{
		"id": strconv.FormatUint(uint64(restaurant.ID), 10),
	}})
}

func (a *App) adminUpdateRestaurant(c *gin.Context) {
	restaurantID, ok := parseUintPathParam(c, "restaurantId")
	if !ok {
		return
	}
	var existing Restaurant
	if err := a.db.First(&existing, restaurantID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	var body adminRestaurantPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	existing.Name = strings.TrimSpace(body.Name)
	existing.Tagline = strings.TrimSpace(body.Tagline)
	existing.Phone = strings.TrimSpace(body.Phone)
	existing.Image = strings.TrimSpace(body.Image)
	if existing.Phone == "" {
		writeError(c, http.StatusBadRequest, "Phone is required", nil)
		return
	}
	existing.Rating = body.Rating
	existing.ReviewCount = body.ReviewCount
	existing.DeliveryTime = strings.TrimSpace(body.DeliveryTime)
	existing.DeliveryFee = strings.TrimSpace(body.DeliveryFee)
	existing.Distance = strings.TrimSpace(body.Distance)
	existing.Latitude = body.Latitude
	existing.Longitude = body.Longitude
	if body.IsOpen != nil {
		existing.IsOpen = *body.IsOpen
	}
	if body.IsPromoted != nil {
		existing.IsPromoted = *body.IsPromoted
	}
	if body.Discount != nil {
		trimmed := strings.TrimSpace(*body.Discount)
		if trimmed == "" {
			existing.Discount = nil
		} else {
			existing.Discount = &trimmed
		}
	}
	existing.TagsCSV = strings.Join(body.Tags, ",")

	if err := a.db.Save(&existing).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Restaurant updated"})
}

func (a *App) adminDeleteRestaurant(c *gin.Context) {
	restaurantID, ok := parseUintPathParam(c, "restaurantId")
	if !ok {
		return
	}
	res := a.db.Delete(&Restaurant{}, restaurantID)
	if res.Error != nil {
		writeError(c, http.StatusInternalServerError, "DB error", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		writeError(c, http.StatusNotFound, "Restaurant not found", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Restaurant deleted"})
}

type adminMenuPayload struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description" binding:"required"`
	Price        float64 `json:"price" binding:"required"`
	Image        string  `json:"image" binding:"required"`
	IsVeg        bool    `json:"isVeg"`
	IsBestseller bool    `json:"isBestseller"`
	IsAvailable  *bool   `json:"isAvailable"`
}

func (a *App) adminCreateMenuItem(c *gin.Context) {
	restaurantID, ok := parseUintPathParam(c, "restaurantId")
	if !ok {
		return
	}
	var restaurant Restaurant
	if err := a.db.First(&restaurant, restaurantID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	var body adminMenuPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	isAvailable := true
	if body.IsAvailable != nil {
		isAvailable = *body.IsAvailable
	}
	item := MenuItem{
		RestaurantID: restaurant.ID,
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
	c.JSON(http.StatusCreated, gin.H{"message": "Menu item created", "data": gin.H{
		"id": strconv.FormatUint(uint64(item.ID), 10),
	}})
}

func (a *App) adminUpdateMenuItem(c *gin.Context) {
	itemID, ok := parseUintPathParam(c, "menuItemId")
	if !ok {
		return
	}
	var item MenuItem
	if err := a.db.First(&item, itemID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Menu item not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	var body adminMenuPayload
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

func (a *App) adminDeleteMenuItem(c *gin.Context) {
	itemID, ok := parseUintPathParam(c, "menuItemId")
	if !ok {
		return
	}
	res := a.db.Delete(&MenuItem{}, itemID)
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

type adminDiscountPayload struct {
	Code         string   `json:"code" binding:"required"`
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description" binding:"required"`
	Type         string   `json:"type" binding:"required"`
	Value        float64  `json:"value" binding:"required"`
	MaxDiscount  *float64 `json:"maxDiscount"`
	MinOrder     float64  `json:"minOrder"`
	RestaurantID *uint    `json:"restaurantId"`
	IsActive     *bool    `json:"isActive"`
}

func (a *App) adminListDiscounts(c *gin.Context) {
	var discounts []Discount
	if err := a.db.Order("updated_at DESC").Find(&discounts).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Admin discounts fetched", "data": discounts})
}

func (a *App) adminCreateDiscount(c *gin.Context) {
	var body adminDiscountPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	isActive := true
	if body.IsActive != nil {
		isActive = *body.IsActive
	}
	discount := Discount{
		Code:         strings.ToUpper(strings.TrimSpace(body.Code)),
		Title:        strings.TrimSpace(body.Title),
		Description:  strings.TrimSpace(body.Description),
		Type:         strings.TrimSpace(body.Type),
		Value:        body.Value,
		MaxDiscount:  body.MaxDiscount,
		MinOrder:     body.MinOrder,
		RestaurantID: body.RestaurantID,
		IsActive:     isActive,
	}
	if err := a.db.Create(&discount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Discount created", "data": gin.H{
		"id": strconv.FormatUint(uint64(discount.ID), 10),
	}})
}

func (a *App) adminUpdateDiscount(c *gin.Context) {
	discountID, ok := parseUintPathParam(c, "discountId")
	if !ok {
		return
	}
	var discount Discount
	if err := a.db.First(&discount, discountID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Discount not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	var body adminDiscountPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}
	discount.Code = strings.ToUpper(strings.TrimSpace(body.Code))
	discount.Title = strings.TrimSpace(body.Title)
	discount.Description = strings.TrimSpace(body.Description)
	discount.Type = strings.TrimSpace(body.Type)
	discount.Value = body.Value
	discount.MaxDiscount = body.MaxDiscount
	discount.MinOrder = body.MinOrder
	discount.RestaurantID = body.RestaurantID
	if body.IsActive != nil {
		discount.IsActive = *body.IsActive
	}
	if err := a.db.Save(&discount).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Discount updated"})
}

func (a *App) adminDeleteDiscount(c *gin.Context) {
	discountID, ok := parseUintPathParam(c, "discountId")
	if !ok {
		return
	}
	res := a.db.Delete(&Discount{}, discountID)
	if res.Error != nil {
		writeError(c, http.StatusInternalServerError, "DB error", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		writeError(c, http.StatusNotFound, "Discount not found", nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Discount deleted"})
}

func (a *App) adminListOrders(c *gin.Context) {
	var orders []Order
	if err := a.db.Preload("Items").Order("created_at DESC").Limit(200).Find(&orders).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	result := make([]gin.H, 0, len(orders))
	for i := range orders {
		result = append(result, serializeOrder(orders[i]))
	}
	c.JSON(http.StatusOK, gin.H{"message": "Admin orders fetched", "data": result})
}

func (a *App) adminUpdateOrderStatus(c *gin.Context) {
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
	if err := a.db.First(&order, orderID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Order not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	order.Status = status
	order.UpdatedAt = time.Now()
	if err := a.db.Save(&order).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Order status updated"})
}

func isAllowedOrderStatus(status string) bool {
	switch status {
	case "placed", "accepted", "preparing", "out_for_delivery", "delivered", "cancelled":
		return true
	default:
		return false
	}
}
