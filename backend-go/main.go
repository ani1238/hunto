package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	cfg := loadConfig()

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(
		&User{},
		&OTPCode{},
		&RestaurantPartner{},
		&Cart{},
		&Restaurant{},
		&MenuItem{},
		&CartItem{},
		&UserLocation{},
		&Discount{},
		&Order{},
		&OrderItem{},
	); err != nil {
		log.Fatalf("auto-migrate failed: %v", err)
	}

	app := &App{
		db:          db,
		otpDebug:    cfg.OTPDebug,
		adminAPIKey: cfg.AdminAPIKey,
	}
	if cfg.Storage.Enabled {
		storage, storageErr := newObjectStorage(cfg.Storage)
		if storageErr != nil {
			log.Fatalf("storage init failed: %v", storageErr)
		}
		app.storage = storage
		app.storageConfig = cfg.Storage
	}
	if err := app.seedRestaurantsIfEmpty(); err != nil {
		log.Fatalf("seed failed: %v", err)
	}
	if err := app.seedDiscountsIfEmpty(); err != nil {
		log.Fatalf("discount seed failed: %v", err)
	}
	if err := app.seedRestaurantPartners(cfg.PartnerKeys); err != nil {
		log.Fatalf("partner seed failed: %v", err)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSAllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Admin-Key", "X-Restaurant-Id", "X-Partner-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Fatalf("failed to set trusted proxies: %v", err)
	}

	registerRoutes(r, app)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

type App struct {
	db            *gorm.DB
	otpDebug      bool
	adminAPIKey   string
	storage       *ObjectStorage
	storageConfig StorageConfig
}
