package main

import "github.com/gin-gonic/gin"

func registerRoutes(r *gin.Engine, app *App) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/request-otp", app.requestOTP)
			auth.POST("/verify-otp", app.verifyOTP)
			auth.POST("/register", app.register)
			auth.POST("/login", app.login)
			auth.GET("/me", authMiddleware(), app.me)
		}

		restaurants := api.Group("/restaurants")
		{
			restaurants.GET("", app.listRestaurants)
			restaurants.GET("/:restaurantId", app.getRestaurantByID)
		}

		cart := api.Group("/cart")
		cart.Use(authMiddleware())
		{
			cart.GET("", app.getCart)
			cart.GET("/discounts", app.listApplicableDiscounts)
			cart.POST("/discounts/apply", app.applyDiscountToCart)
			cart.POST("/replace-item", app.replaceCartWithItem)
			cart.DELETE("/discounts", app.removeDiscountFromCart)
			cart.POST("/items", app.addOrUpdateCartItem)
			cart.DELETE("/items/:itemId", app.removeCartItem)
			cart.DELETE("", app.clearCart)
		}

		orders := api.Group("/orders")
		orders.Use(authMiddleware())
		{
			orders.POST("", app.placeOrder)
			orders.GET("", app.listOrders)
			orders.GET("/:orderId", app.getOrder)
			orders.GET("/:orderId/track", app.trackOrder)
		}

		locations := api.Group("/users/me/locations")
		locations.Use(authMiddleware())
		{
			locations.GET("", app.listLocations)
			locations.POST("", app.createLocation)
			locations.PUT("/:locationId", app.updateLocation)
			locations.POST("/:locationId/select", app.selectCurrentLocation)
			locations.DELETE("/:locationId", app.deleteLocation)
		}

		admin := api.Group("/admin")
		admin.Use(app.adminMiddleware())
		{
			admin.GET("/dashboard", app.adminDashboard)

			admin.GET("/restaurants", app.adminListRestaurants)
			admin.POST("/restaurants", app.adminCreateRestaurant)
			admin.PUT("/restaurants/:restaurantId", app.adminUpdateRestaurant)
			admin.DELETE("/restaurants/:restaurantId", app.adminDeleteRestaurant)

			admin.POST("/restaurants/:restaurantId/menu-items", app.adminCreateMenuItem)
			admin.PUT("/menu-items/:menuItemId", app.adminUpdateMenuItem)
			admin.DELETE("/menu-items/:menuItemId", app.adminDeleteMenuItem)

			admin.GET("/discounts", app.adminListDiscounts)
			admin.POST("/discounts", app.adminCreateDiscount)
			admin.PUT("/discounts/:discountId", app.adminUpdateDiscount)
			admin.DELETE("/discounts/:discountId", app.adminDeleteDiscount)

			admin.GET("/orders", app.adminListOrders)
			admin.PUT("/orders/:orderId/status", app.adminUpdateOrderStatus)
		}

		partner := api.Group("/partner")
		partner.Use(app.partnerMiddleware())
		{
			partner.GET("/me", app.partnerMe)
			partner.PUT("/availability", app.partnerUpdateAvailability)
			partner.GET("/menu-items", app.partnerListMenu)
			partner.POST("/menu-items/upload-url", app.partnerCreateMenuItemUpload)
			partner.POST("/menu-items", app.partnerCreateMenuItem)
			partner.PUT("/menu-items/:menuItemId", app.partnerUpdateMenuItem)
			partner.DELETE("/menu-items/:menuItemId", app.partnerDeleteMenuItem)
			partner.GET("/orders", app.partnerListOrders)
			partner.PUT("/orders/:orderId/status", app.partnerUpdateOrderStatus)
		}
	}
}
