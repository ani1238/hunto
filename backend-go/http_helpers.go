package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIError struct {
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func writeError(c *gin.Context, status int, message string, err error) {
	if err != nil {
		c.JSON(status, APIError{
			Message: message,
			Details: err.Error(),
		})
		return
	}
	c.JSON(status, APIError{Message: message})
}

func writeValidationError(c *gin.Context, err error) {
	writeError(c, http.StatusBadRequest, "Invalid request", err)
}
