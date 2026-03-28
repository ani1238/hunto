package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			writeError(c, http.StatusUnauthorized, "Authorization header missing", nil)
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			writeError(c, http.StatusUnauthorized, "Invalid Authorization format", nil)
			c.Abort()
			return
		}

		userID, err := parseMockToken(parts[1])
		if err != nil {
			writeError(c, http.StatusUnauthorized, "Invalid token", err)
			c.Abort()
			return
		}

		c.Set(authUserKey, userID)
		c.Next()
	}
}
