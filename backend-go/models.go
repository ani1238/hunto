package main

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	Email     *string   `json:"email,omitempty" gorm:"uniqueIndex"`
	Phone     string    `json:"phone" gorm:"uniqueIndex;not null"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type OTPCode struct {
	Phone     string    `json:"phone" gorm:"primaryKey"`
	Code      string    `json:"code" gorm:"not null"`
	ExpiresAt time.Time `json:"expiresAt" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RestaurantPartner struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	RestaurantID uint       `json:"restaurantId" gorm:"uniqueIndex;not null"`
	KeyHash      string     `json:"-" gorm:"not null"`
	IsActive     bool       `json:"isActive" gorm:"not null;default:true"`
	LastUsedAt   *time.Time `json:"lastUsedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type Cart struct {
	ID                  uint       `json:"id" gorm:"primaryKey"`
	UserID              uint       `json:"userId" gorm:"uniqueIndex;not null"`
	AppliedDiscountCode *string    `json:"appliedDiscountCode,omitempty"`
	Items               []CartItem `json:"items" gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt           time.Time  `json:"createdAt"`
	UpdatedAt           time.Time  `json:"updatedAt"`
}

type Restaurant struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	Name         string     `json:"name" gorm:"not null"`
	Tagline      string     `json:"tagline" gorm:"not null"`
	Phone        string     `json:"phone" gorm:"not null;default:''"`
	Image        string     `json:"image" gorm:"not null"`
	Rating       float64    `json:"rating" gorm:"not null;default:0"`
	ReviewCount  int        `json:"reviewCount" gorm:"not null;default:0"`
	DeliveryTime string     `json:"deliveryTime" gorm:"not null"`
	DeliveryFee  string     `json:"deliveryFee" gorm:"not null"`
	OpeningTime  string     `json:"openingTime" gorm:"not null;default:'09:00'"`
	ClosingTime  string     `json:"closingTime" gorm:"not null;default:'23:00'"`
	Distance     string     `json:"distance" gorm:"not null"`
	Latitude     float64    `json:"latitude" gorm:"not null"`
	Longitude    float64    `json:"longitude" gorm:"not null"`
	IsOpen       bool       `json:"isOpen" gorm:"not null;default:true"`
	IsPromoted   bool       `json:"isPromoted" gorm:"not null;default:false"`
	Discount     *string    `json:"discount,omitempty"`
	TagsCSV      string     `json:"-" gorm:"column:tags;not null;default:''"`
	MenuItems    []MenuItem `json:"menu" gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type MenuItem struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	RestaurantID uint      `json:"restaurantId" gorm:"index;not null"`
	Name         string    `json:"name" gorm:"not null"`
	Description  string    `json:"description" gorm:"not null"`
	Price        float64   `json:"price" gorm:"not null"`
	Image        string    `json:"image" gorm:"not null"`
	IsVeg        bool      `json:"isVeg" gorm:"not null;default:false"`
	IsBestseller bool      `json:"isBestseller" gorm:"not null;default:false"`
	IsAvailable  bool      `json:"isAvailable" gorm:"not null;default:true"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type CartItem struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	CartID         uint      `json:"cartId" gorm:"index;not null"`
	MenuItemID     uint      `json:"menuItemId" gorm:"index;not null"`
	RestaurantID   uint      `json:"restaurantId" gorm:"index;not null"`
	MenuItemName   string    `json:"menuItemName" gorm:"not null"`
	RestaurantName string    `json:"restaurantName" gorm:"not null"`
	UnitPrice      float64   `json:"unitPrice" gorm:"not null"`
	Quantity       int       `json:"quantity" gorm:"not null"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type UserLocation struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"userId" gorm:"index;not null"`
	Label       string    `json:"label" gorm:"not null"`
	AddressLine string    `json:"addressLine" gorm:"not null"`
	City        string    `json:"city" gorm:"not null"`
	State       string    `json:"state" gorm:"not null"`
	PostalCode  string    `json:"postalCode" gorm:"not null"`
	Country     string    `json:"country" gorm:"not null"`
	Latitude    float64   `json:"latitude" gorm:"not null"`
	Longitude   float64   `json:"longitude" gorm:"not null"`
	IsCurrent   bool      `json:"isCurrent" gorm:"not null;default:false"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Discount struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	Code         string     `json:"code" gorm:"uniqueIndex;not null"`
	Title        string     `json:"title" gorm:"not null"`
	Description  string     `json:"description" gorm:"not null"`
	Type         string     `json:"type" gorm:"not null"` // "flat" or "percent"
	Value        float64    `json:"value" gorm:"not null"`
	MaxDiscount  *float64   `json:"maxDiscount,omitempty"`
	MinOrder     float64    `json:"minOrder" gorm:"not null;default:0"`
	RestaurantID *uint      `json:"restaurantId,omitempty" gorm:"index"`
	IsActive     bool       `json:"isActive" gorm:"not null;default:true"`
	StartAt      *time.Time `json:"startAt,omitempty"`
	EndAt        *time.Time `json:"endAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type Order struct {
	ID                    uint        `json:"id" gorm:"primaryKey"`
	UserID                uint        `json:"userId" gorm:"index;not null"`
	RestaurantID          uint        `json:"restaurantId" gorm:"index;not null"`
	RestaurantName        string      `json:"restaurantName" gorm:"not null"`
	RestaurantPhone       string      `json:"restaurantPhone" gorm:"not null;default:''"`
	Status                string      `json:"status" gorm:"not null;default:'placed'"`
	Subtotal              float64     `json:"subtotal" gorm:"not null"`
	DiscountAmount        float64     `json:"discountAmount" gorm:"not null;default:0"`
	DeliveryFee           float64     `json:"deliveryFee" gorm:"not null;default:0"`
	Taxes                 float64     `json:"taxes" gorm:"not null;default:0"`
	GrandTotal            float64     `json:"grandTotal" gorm:"not null"`
	AppliedDiscountCode   *string     `json:"appliedDiscountCode,omitempty"`
	DeliveryLocationID    uint        `json:"deliveryLocationId" gorm:"not null"`
	DeliveryLocationLabel string      `json:"deliveryLocationLabel" gorm:"not null"`
	DeliveryAddressLine   string      `json:"deliveryAddressLine" gorm:"not null"`
	DeliveryCity          string      `json:"deliveryCity" gorm:"not null"`
	DeliveryState         string      `json:"deliveryState" gorm:"not null"`
	DeliveryPostalCode    string      `json:"deliveryPostalCode" gorm:"not null"`
	DeliveryCountry       string      `json:"deliveryCountry" gorm:"not null"`
	DeliveryLatitude      float64     `json:"deliveryLatitude" gorm:"not null"`
	DeliveryLongitude     float64     `json:"deliveryLongitude" gorm:"not null"`
	Items                 []OrderItem `json:"items" gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt             time.Time   `json:"createdAt"`
	UpdatedAt             time.Time   `json:"updatedAt"`
}

type OrderItem struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	OrderID        uint      `json:"orderId" gorm:"index;not null"`
	MenuItemID     uint      `json:"menuItemId" gorm:"index;not null"`
	MenuItemName   string    `json:"menuItemName" gorm:"not null"`
	RestaurantID   uint      `json:"restaurantId" gorm:"index;not null"`
	RestaurantName string    `json:"restaurantName" gorm:"not null"`
	UnitPrice      float64   `json:"unitPrice" gorm:"not null"`
	Quantity       int       `json:"quantity" gorm:"not null"`
	LineTotal      float64   `json:"lineTotal" gorm:"not null"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
