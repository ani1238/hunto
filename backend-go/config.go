package main

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port               string
	DatabaseURL        string
	OTPDebug           bool
	AdminAPIKey        string
	PartnerKeys        map[uint]string
	CORSAllowedOrigins []string
	Storage            StorageConfig
}

type StorageConfig struct {
	Enabled        bool
	Bucket         string
	Region         string
	Endpoint       string
	AccessKeyID    string
	SecretKey      string
	PublicBaseURL  string
	UploadPrefix   string
	ForcePathStyle bool
	MaxUploadBytes int64
}

func loadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/hunto?sslmode=disable"
	}

	otpDebug := os.Getenv("OTP_DEBUG_MODE") == "true"
	adminAPIKey := os.Getenv("ADMIN_API_KEY")
	if adminAPIKey == "" {
		adminAPIKey = "admin123"
	}
	partnerKeys := parsePartnerKeys(os.Getenv("PARTNER_KEYS"))

	originsRaw := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	corsAllowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:5174",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5174",
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://192.168.1.24:5173",
		"http://192.168.1.24:5174",
	}
	if originsRaw != "" {
		corsAllowedOrigins = make([]string, 0)
		for _, value := range strings.Split(originsRaw, ",") {
			trimmed := strings.TrimSpace(value)
			if trimmed != "" {
				corsAllowedOrigins = append(corsAllowedOrigins, trimmed)
			}
		}
	}

	return Config{
		Port:               port,
		DatabaseURL:        dsn,
		OTPDebug:           otpDebug,
		AdminAPIKey:        adminAPIKey,
		PartnerKeys:        partnerKeys,
		CORSAllowedOrigins: corsAllowedOrigins,
		Storage:            loadStorageConfig(),
	}
}

func loadStorageConfig() StorageConfig {
	bucket := strings.TrimSpace(os.Getenv("STORAGE_BUCKET"))
	region := strings.TrimSpace(os.Getenv("STORAGE_REGION"))
	if region == "" {
		region = "auto"
	}
	uploadPrefix := strings.TrimSpace(os.Getenv("STORAGE_UPLOAD_PREFIX"))
	if uploadPrefix == "" {
		uploadPrefix = "menu-items"
	}
	maxUploadMB := int64(5)
	if raw := strings.TrimSpace(os.Getenv("STORAGE_MAX_UPLOAD_MB")); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil && parsed > 0 {
			maxUploadMB = parsed
		}
	}

	cfg := StorageConfig{
		Bucket:         bucket,
		Region:         region,
		Endpoint:       strings.TrimSpace(os.Getenv("STORAGE_ENDPOINT")),
		AccessKeyID:    strings.TrimSpace(os.Getenv("STORAGE_ACCESS_KEY_ID")),
		SecretKey:      strings.TrimSpace(os.Getenv("STORAGE_SECRET_ACCESS_KEY")),
		PublicBaseURL:  strings.TrimRight(strings.TrimSpace(os.Getenv("STORAGE_PUBLIC_BASE_URL")), "/"),
		UploadPrefix:   strings.Trim(strings.TrimSpace(uploadPrefix), "/"),
		ForcePathStyle: os.Getenv("STORAGE_FORCE_PATH_STYLE") == "true",
		MaxUploadBytes: maxUploadMB * 1024 * 1024,
	}
	cfg.Enabled = cfg.Bucket != "" && cfg.AccessKeyID != "" && cfg.SecretKey != ""
	return cfg
}

func parsePartnerKeys(raw string) map[uint]string {
	result := map[uint]string{
		1: "partner-1",
		2: "partner-2",
		3: "partner-3",
		4: "partner-4",
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return result
	}

	result = make(map[uint]string)
	pairs := strings.Split(raw, ",")
	for _, pair := range pairs {
		parts := strings.SplitN(strings.TrimSpace(pair), ":", 2)
		if len(parts) != 2 {
			continue
		}
		idText := strings.TrimSpace(parts[0])
		key := strings.TrimSpace(parts[1])
		if idText == "" || key == "" {
			continue
		}
		id64, err := strconv.ParseUint(idText, 10, 32)
		if err != nil {
			continue
		}
		result[uint(id64)] = key
	}
	if len(result) == 0 {
		return map[uint]string{
			1: "partner-1",
			2: "partner-2",
			3: "partner-3",
			4: "partner-4",
		}
	}
	return result
}
