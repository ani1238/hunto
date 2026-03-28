package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (a *App) adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := strings.TrimSpace(c.GetHeader("X-Admin-Key"))
		if key == "" {
			writeError(c, http.StatusUnauthorized, "Admin key missing", nil)
			c.Abort()
			return
		}
		if key != a.adminAPIKey {
			writeError(c, http.StatusUnauthorized, "Invalid admin key", nil)
			c.Abort()
			return
		}
		c.Next()
	}
}
