package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const partnerRestaurantIDKey = "partnerRestaurantID"

func (a *App) partnerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		restaurantHeader := strings.TrimSpace(c.GetHeader("X-Restaurant-Id"))
		partnerKey := strings.TrimSpace(c.GetHeader("X-Partner-Key"))
		if restaurantHeader == "" || partnerKey == "" {
			writeError(c, http.StatusUnauthorized, "Partner credentials missing", nil)
			c.Abort()
			return
		}

		restaurantID64, err := strconv.ParseUint(restaurantHeader, 10, 32)
		if err != nil {
			writeError(c, http.StatusUnauthorized, "Invalid restaurant identifier", err)
			c.Abort()
			return
		}
		restaurantID := uint(restaurantID64)
		var partner RestaurantPartner
		if err := a.db.Where("restaurant_id = ?", restaurantID).First(&partner).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				writeError(c, http.StatusUnauthorized, "Invalid partner credentials", nil)
			} else {
				writeError(c, http.StatusInternalServerError, "DB error", err)
			}
			c.Abort()
			return
		}
		if !partner.IsActive || partner.KeyHash != hashPartnerKey(partnerKey) {
			writeError(c, http.StatusUnauthorized, "Invalid partner credentials", nil)
			c.Abort()
			return
		}
		now := time.Now()
		partner.LastUsedAt = &now
		_ = a.db.Model(&RestaurantPartner{}).Where("id = ?", partner.ID).Update("last_used_at", now).Error
		c.Set(partnerRestaurantIDKey, restaurantID)
		c.Next()
	}
}
