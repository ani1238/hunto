package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func (a *App) listLocations(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	var locations []UserLocation
	if err := a.db.Where("user_id = ?", userID).Order("updated_at DESC").Find(&locations).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Locations fetched", "data": locations})
}

func (a *App) createLocation(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	body, ok := validateLocationPayload(c)
	if !ok {
		return
	}

	location := UserLocation{
		UserID:      userID,
		Label:       body.Label,
		AddressLine: body.AddressLine,
		City:        body.City,
		State:       body.State,
		PostalCode:  body.PostalCode,
		Country:     body.Country,
		Latitude:    body.Latitude,
		Longitude:   body.Longitude,
		IsCurrent:   body.IsCurrent,
	}

	if err := a.db.Transaction(func(tx *gorm.DB) error {
		if location.IsCurrent {
			if err := tx.Model(&UserLocation{}).Where("user_id = ?", userID).Update("is_current", false).Error; err != nil {
				return err
			}
		}
		return tx.Create(&location).Error
	}); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Location created", "data": location})
}

func (a *App) updateLocation(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	locationID, ok := parseUintPathParam(c, "locationId")
	if !ok {
		return
	}

	body, valid := validateLocationPayload(c)
	if !valid {
		return
	}

	var location UserLocation
	if err := a.db.Where("id = ? AND user_id = ?", locationID, userID).First(&location).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Location not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	location.Label = body.Label
	location.AddressLine = body.AddressLine
	location.City = body.City
	location.State = body.State
	location.PostalCode = body.PostalCode
	location.Country = body.Country
	location.Latitude = body.Latitude
	location.Longitude = body.Longitude
	location.IsCurrent = body.IsCurrent

	if err := a.db.Transaction(func(tx *gorm.DB) error {
		if location.IsCurrent {
			if err := tx.Model(&UserLocation{}).Where("user_id = ?", userID).Update("is_current", false).Error; err != nil {
				return err
			}
		}
		return tx.Save(&location).Error
	}); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Location updated", "data": location})
}

func (a *App) selectCurrentLocation(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	locationID, ok := parseUintPathParam(c, "locationId")
	if !ok {
		return
	}

	var location UserLocation
	if err := a.db.Where("id = ? AND user_id = ?", locationID, userID).First(&location).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "Location not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	if err := a.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&UserLocation{}).Where("user_id = ?", userID).Update("is_current", false).Error; err != nil {
			return err
		}
		location.IsCurrent = true
		return tx.Save(&location).Error
	}); err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Current location selected", "data": location})
}

func (a *App) deleteLocation(c *gin.Context) {
	userID := c.GetUint(authUserKey)
	locationID, ok := parseUintPathParam(c, "locationId")
	if !ok {
		return
	}

	res := a.db.Where("id = ? AND user_id = ?", locationID, userID).Delete(&UserLocation{})
	if res.Error != nil {
		writeError(c, http.StatusInternalServerError, "DB error", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		writeError(c, http.StatusNotFound, "Location not found", nil)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Location deleted"})
}

type locationPayload struct {
	Label       string  `json:"label" binding:"required"`
	AddressLine string  `json:"addressLine" binding:"required"`
	City        string  `json:"city" binding:"required"`
	State       string  `json:"state" binding:"required"`
	PostalCode  string  `json:"postalCode" binding:"required"`
	Country     string  `json:"country" binding:"required"`
	Latitude    float64 `json:"latitude" binding:"required"`
	Longitude   float64 `json:"longitude" binding:"required"`
	IsCurrent   bool    `json:"isCurrent"`
}

func validateLocationPayload(c *gin.Context) (locationPayload, bool) {
	var body locationPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return body, false
	}

	body.Label = strings.TrimSpace(body.Label)
	body.AddressLine = strings.TrimSpace(body.AddressLine)
	body.City = strings.TrimSpace(body.City)
	body.State = strings.TrimSpace(body.State)
	body.PostalCode = strings.TrimSpace(body.PostalCode)
	body.Country = strings.TrimSpace(body.Country)

	if body.Label == "" || body.AddressLine == "" || body.City == "" || body.State == "" || body.PostalCode == "" || body.Country == "" {
		writeError(c, http.StatusBadRequest, "All address fields are required", nil)
		return body, false
	}
	if body.Latitude < -90 || body.Latitude > 90 || body.Longitude < -180 || body.Longitude > 180 {
		writeError(c, http.StatusBadRequest, "Latitude/longitude are out of range", nil)
		return body, false
	}

	return body, true
}

func parseUintPathParam(c *gin.Context, name string) (uint, bool) {
	value := strings.TrimSpace(c.Param(name))
	parsed, err := strconv.ParseUint(value, 10, 32)
	if err != nil {
		writeError(c, http.StatusBadRequest, "Invalid path parameter: "+name, err)
		return 0, false
	}
	return uint(parsed), true
}
