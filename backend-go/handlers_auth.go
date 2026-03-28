package main

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthResponse struct {
	Message          string `json:"message"`
	Token            string `json:"token"`
	User             *User  `json:"user,omitempty"`
	ProfileCompleted bool   `json:"profileCompleted"`
}

func (a *App) requestOTP(c *gin.Context) {
	var body struct {
		Phone string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	phone := strings.TrimSpace(body.Phone)
	if len(phone) != 10 {
		writeError(c, http.StatusBadRequest, "Enter a valid 10-digit phone number.", nil)
		return
	}

	code, err := generateOTPCode()
	if err != nil {
		writeError(c, http.StatusInternalServerError, "Could not generate OTP", err)
		return
	}

	expiresAt := time.Now().Add(10 * time.Minute)
	var otp OTPCode
	findErr := a.db.Where("phone = ?", phone).First(&otp).Error
	if findErr != nil && findErr != gorm.ErrRecordNotFound {
		writeError(c, http.StatusInternalServerError, "DB error", findErr)
		return
	}

	if findErr == gorm.ErrRecordNotFound {
		otp = OTPCode{
			Phone:     phone,
			Code:      code,
			ExpiresAt: expiresAt,
		}
		if err := a.db.Create(&otp).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	} else {
		otp.Code = code
		otp.ExpiresAt = expiresAt
		if err := a.db.Save(&otp).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	}

	response := gin.H{"message": "OTP sent"}
	if a.otpDebug {
		response["debugOtp"] = code
	}
	c.JSON(http.StatusOK, response)
}

func (a *App) verifyOTP(c *gin.Context) {
	var body struct {
		Phone string `json:"phone" binding:"required"`
		OTP   string `json:"otp" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	phone := strings.TrimSpace(body.Phone)
	code := strings.TrimSpace(body.OTP)
	if len(phone) != 10 || len(code) != 4 {
		writeError(c, http.StatusBadRequest, "Invalid phone or OTP format", nil)
		return
	}

	var otp OTPCode
	if err := a.db.Where("phone = ?", phone).First(&otp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusUnauthorized, "OTP not requested", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	if time.Now().After(otp.ExpiresAt) {
		writeError(c, http.StatusUnauthorized, "OTP expired", nil)
		return
	}

	if otp.Code != code {
		writeError(c, http.StatusUnauthorized, "Invalid OTP", nil)
		return
	}

	var user User
	if err := a.db.Where("phone = ?", phone).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			user = User{Phone: phone}
			if err := a.db.Create(&user).Error; err != nil {
				writeError(c, http.StatusInternalServerError, "DB error", err)
				return
			}
		} else {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
	}

	c.JSON(http.StatusOK, AuthResponse{
		Message:          "OTP verified",
		Token:            tokenForUser(user.ID),
		User:             &user,
		ProfileCompleted: isProfileCompleted(user),
	})
}

func (a *App) register(c *gin.Context) {
	var body struct {
		Name  string `json:"name" binding:"required"`
		Email string `json:"email" binding:"required,email"`
		Phone string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	body.Phone = strings.TrimSpace(body.Phone)
	body.Email = strings.TrimSpace(body.Email)
	body.Name = strings.TrimSpace(body.Name)

	if len(body.Phone) != 10 {
		writeError(c, http.StatusBadRequest, "Phone must be valid.", nil)
		return
	}

	var user User
	if err := a.db.Where("phone = ?", body.Phone).First(&user).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}

		var emailOwner User
		if err := a.db.Where("email = ?", body.Email).First(&emailOwner).Error; err == nil {
			writeError(c, http.StatusConflict, "Email already registered.", nil)
			return
		} else if err != gorm.ErrRecordNotFound {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}

		email := body.Email
		user = User{Name: body.Name, Email: &email, Phone: body.Phone}
		if err := a.db.Create(&user).Error; err != nil {
			writeError(c, http.StatusInternalServerError, "DB error", err)
			return
		}
		c.JSON(http.StatusCreated, AuthResponse{
			Message:          "User registered",
			Token:            tokenForUser(user.ID),
			User:             &user,
			ProfileCompleted: isProfileCompleted(user),
		})
		return
	}

	var emailOwner User
	if err := a.db.Where("email = ? AND id <> ?", body.Email, user.ID).First(&emailOwner).Error; err == nil {
		writeError(c, http.StatusConflict, "Email already registered.", nil)
		return
	} else if err != gorm.ErrRecordNotFound {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	email := body.Email
	user.Name = body.Name
	user.Email = &email
	if err := a.db.Save(&user).Error; err != nil {
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Message:          "Profile updated",
		Token:            tokenForUser(user.ID),
		User:             &user,
		ProfileCompleted: isProfileCompleted(user),
	})
}

func (a *App) login(c *gin.Context) {
	var body struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		writeValidationError(c, err)
		return
	}

	var user User
	if err := a.db.Where("email = ?", strings.TrimSpace(body.Email)).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "User not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Message:          "Login successful",
		Token:            tokenForUser(user.ID),
		User:             &user,
		ProfileCompleted: isProfileCompleted(user),
	})
}

func (a *App) me(c *gin.Context) {
	userID := c.GetUint(authUserKey)

	var user User
	if err := a.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			writeError(c, http.StatusNotFound, "User not found", nil)
			return
		}
		writeError(c, http.StatusInternalServerError, "DB error", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User profile", "data": user})
}
