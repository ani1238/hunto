package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func (a *App) listRestaurants(c *gin.Context) {
	search := strings.TrimSpace(strings.ToLower(c.Query("search")))
	var restaurants []Restaurant
	if err := a.db.Preload("MenuItems").Order("rating DESC").Find(&restaurants).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	result := make([]gin.H, 0, len(restaurants))
	for _, r := range restaurants {
		tags := splitTags(r.TagsCSV)
		hasMenuSearchMatch := false
		if search != "" {
			restaurantMatch := strings.Contains(strings.ToLower(r.Name), search) || strings.Contains(strings.ToLower(r.Tagline), search)
			for _, m := range r.MenuItems {
				if !m.IsAvailable {
					continue
				}
				if strings.Contains(strings.ToLower(m.Name), search) || strings.Contains(strings.ToLower(m.Description), search) {
					hasMenuSearchMatch = true
					break
				}
			}
			if !restaurantMatch && !hasMenuSearchMatch {
				continue
			}
		}

		menu := make([]gin.H, 0, len(r.MenuItems))
		for _, m := range r.MenuItems {
			if !m.IsAvailable {
				continue
			}
			menu = append(menu, gin.H{
				"id":           strconv.FormatUint(uint64(m.ID), 10),
				"name":         m.Name,
				"description":  m.Description,
				"price":        m.Price,
				"image":        m.Image,
				"isVeg":        m.IsVeg,
				"isBestseller": m.IsBestseller,
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
			"openingTime":  r.OpeningTime,
			"closingTime":  r.ClosingTime,
			"distance":     r.Distance,
			"latitude":     r.Latitude,
			"longitude":    r.Longitude,
			"isOpen":       r.IsOpen,
			"isPromoted":   r.IsPromoted,
			"discount":     r.Discount,
			"tags":         tags,
			"menu":         menu,
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Restaurants fetched", "data": result})
}

func (a *App) getRestaurantByID(c *gin.Context) {
	id, ok := parseUintPathParam(c, "restaurantId")
	if !ok {
		return
	}

	var r Restaurant
	if err := a.db.Preload("MenuItems").First(&r, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Restaurant not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	menu := make([]gin.H, 0, len(r.MenuItems))
	for _, m := range r.MenuItems {
		if !m.IsAvailable {
			continue
		}
		menu = append(menu, gin.H{
			"id":           strconv.FormatUint(uint64(m.ID), 10),
			"name":         m.Name,
			"description":  m.Description,
			"price":        m.Price,
			"image":        m.Image,
			"isVeg":        m.IsVeg,
			"isBestseller": m.IsBestseller,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Restaurant fetched",
		"data": gin.H{
			"id":           strconv.FormatUint(uint64(r.ID), 10),
			"name":         r.Name,
			"tagline":      r.Tagline,
			"phone":        r.Phone,
			"image":        r.Image,
			"rating":       r.Rating,
			"reviewCount":  r.ReviewCount,
			"deliveryTime": r.DeliveryTime,
			"deliveryFee":  r.DeliveryFee,
			"openingTime":  r.OpeningTime,
			"closingTime":  r.ClosingTime,
			"distance":     r.Distance,
			"latitude":     r.Latitude,
			"longitude":    r.Longitude,
			"isOpen":       r.IsOpen,
			"isPromoted":   r.IsPromoted,
			"discount":     r.Discount,
			"tags":         splitTags(r.TagsCSV),
			"menu":         menu,
		},
	})
}
