package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var allowedImageContentTypes = map[string]struct{}{
	"image/jpeg": {},
	"image/png":  {},
	"image/webp": {},
	"image/gif":  {},
}

var imageExtByContentType = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

type ObjectStorage struct {
	cfg           StorageConfig
	presignClient *s3.PresignClient
}

type PresignedImageUpload struct {
	ObjectKey   string
	UploadURL   string
	PublicURL   string
	ContentType string
	ExpiresIn   int64
}

func newObjectStorage(cfg StorageConfig) (*ObjectStorage, error) {
	awsCfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion(cfg.Region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretKey, "")),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.ForcePathStyle
		if cfg.Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		}
	})

	return &ObjectStorage{
		cfg:           cfg,
		presignClient: s3.NewPresignClient(client),
	}, nil
}

func (s *ObjectStorage) CreateMenuItemUpload(restaurantID uint, originalFilename string, contentType string) (PresignedImageUpload, error) {
	contentType = strings.TrimSpace(strings.ToLower(contentType))
	if _, ok := allowedImageContentTypes[contentType]; !ok {
		return PresignedImageUpload{}, fmt.Errorf("unsupported contentType: %s", contentType)
	}

	ext := strings.ToLower(path.Ext(strings.TrimSpace(originalFilename)))
	if ext == "" {
		ext = imageExtByContentType[contentType]
	}
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if ext != ".jpg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
		return PresignedImageUpload{}, fmt.Errorf("unsupported file extension: %s", ext)
	}

	randomPart := make([]byte, 16)
	if _, err := rand.Read(randomPart); err != nil {
		return PresignedImageUpload{}, err
	}
	idPart := hex.EncodeToString(randomPart)
	prefix := strings.Trim(s.cfg.UploadPrefix, "/")
	objectKey := fmt.Sprintf("%s/r%d/%s%s", prefix, restaurantID, idPart, ext)

	expires := 15 * time.Minute
	req, err := s.presignClient.PresignPutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      aws.String(s.cfg.Bucket),
		Key:         aws.String(objectKey),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expires
	})
	if err != nil {
		return PresignedImageUpload{}, err
	}

	publicURL := s.publicURLForObject(objectKey)
	return PresignedImageUpload{
		ObjectKey:   objectKey,
		UploadURL:   req.URL,
		PublicURL:   publicURL,
		ContentType: contentType,
		ExpiresIn:   int64(expires.Seconds()),
	}, nil
}

func (s *ObjectStorage) publicURLForObject(objectKey string) string {
	if s.cfg.PublicBaseURL != "" {
		return s.cfg.PublicBaseURL + "/" + objectKey
	}
	if s.cfg.Endpoint != "" {
		return strings.TrimRight(s.cfg.Endpoint, "/") + "/" + s.cfg.Bucket + "/" + objectKey
	}
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.cfg.Bucket, s.cfg.Region, objectKey)
}
