package main

import (
	"strings"

	"gorm.io/gorm"
)

type demoRestaurantSeed struct {
	Name         string
	Tagline      string
	Phone        string
	Image        string
	Rating       float64
	ReviewCount  int
	DeliveryTime string
	DeliveryFee  string
	OpeningTime  string
	ClosingTime  string
	Distance     string
	Latitude     float64
	Longitude    float64
	IsOpen       bool
	IsPromoted   bool
	Discount     *string
	Tags         []string
	MenuItems    []MenuItem
}

func (a *App) seedRestaurantsIfEmpty() error {
	demoData := buildDemoRestaurants()

	return a.db.Transaction(func(tx *gorm.DB) error {
		for _, seed := range demoData {
			var existing Restaurant
			err := tx.Where("name = ?", seed.Name).First(&existing).Error
			if err == nil {
				if strings.TrimSpace(existing.Phone) == "" && strings.TrimSpace(seed.Phone) != "" {
					existing.Phone = seed.Phone
					if saveErr := tx.Save(&existing).Error; saveErr != nil {
						return saveErr
					}
				}
				continue
			}
			if err != gorm.ErrRecordNotFound {
				return err
			}

			restaurant := Restaurant{
				Name:         seed.Name,
				Tagline:      seed.Tagline,
				Phone:        seed.Phone,
				Image:        seed.Image,
				Rating:       seed.Rating,
				ReviewCount:  seed.ReviewCount,
				DeliveryTime: seed.DeliveryTime,
				DeliveryFee:  seed.DeliveryFee,
				OpeningTime:  seed.OpeningTime,
				ClosingTime:  seed.ClosingTime,
				Distance:     seed.Distance,
				Latitude:     seed.Latitude,
				Longitude:    seed.Longitude,
				IsOpen:       seed.IsOpen,
				IsPromoted:   seed.IsPromoted,
				Discount:     seed.Discount,
				TagsCSV:      strings.Join(seed.Tags, ","),
				MenuItems:    seed.MenuItems,
			}
			if err := tx.Create(&restaurant).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func buildDemoRestaurants() []demoRestaurantSeed {
	disc1 := "30% off up to ₹75"
	disc2 := "20% off up to ₹60"
	disc3 := "Buy 2 Get 1 Treat"
	disc4 := "Flat ₹40 off above ₹249"

	return []demoRestaurantSeed{
		{
			Name:         "Pawsome Kitchen",
			Tagline:      "Fresh homemade meals only for dogs",
			Phone:        "+919876543210",
			Image:        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
			Rating:       4.8,
			ReviewCount:  320,
			DeliveryTime: "25–35 min",
			DeliveryFee:  "Free delivery",
			OpeningTime:  "09:00",
			ClosingTime:  "23:00",
			Distance:     "1.2 km",
			Latitude:     17.3130,
			Longitude:    78.4327,
			IsOpen:       true,
			IsPromoted:   true,
			Discount:     &disc1,
			Tags:         []string{"Dogs", "Fresh", "Protein-rich"},
			MenuItems: []MenuItem{
				{Name: "Chicken & Rice Bowl", Description: "Boiled chicken breast with brown rice and veggies", Price: 149, Image: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400", IsVeg: false, IsBestseller: true, IsAvailable: true},
				{Name: "Mutton Power Bowl", Description: "Tender mutton with millet, pumpkin and minerals", Price: 179, Image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400", IsVeg: false, IsBestseller: true, IsAvailable: true},
				{Name: "Peanut Butter Dog Cookies", Description: "Baked crunchy treats with oats and peanut butter", Price: 99, Image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", IsVeg: true, IsBestseller: true, IsAvailable: true},
			},
		},
		{
			Name:         "Whisker Feast",
			Tagline:      "Nutritious gourmet bowls for cats",
			Phone:        "+919876543211",
			Image:        "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=600",
			Rating:       4.6,
			ReviewCount:  210,
			DeliveryTime: "20–30 min",
			DeliveryFee:  "₹15",
			OpeningTime:  "10:00",
			ClosingTime:  "22:30",
			Distance:     "2.1 km",
			Latitude:     17.4257,
			Longitude:    78.4292,
			IsOpen:       true,
			IsPromoted:   false,
			Discount:     &disc2,
			Tags:         []string{"Cats", "Seafood", "Vet-approved"},
			MenuItems: []MenuItem{
				{Name: "Tuna Delight Bowl", Description: "High-protein tuna with pumpkin mash", Price: 169, Image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", IsVeg: false, IsBestseller: true, IsAvailable: true},
				{Name: "Salmon Soft Bites", Description: "Omega-rich salmon chunks in light broth", Price: 189, Image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400", IsVeg: false, IsBestseller: false, IsAvailable: true},
				{Name: "Chicken Mousse Cups", Description: "Smooth textured chicken cups for kittens", Price: 139, Image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=400", IsVeg: false, IsBestseller: true, IsAvailable: true},
			},
		},
		{
			Name:         "Bunny Bites Co.",
			Tagline:      "Farm-fresh bowls for rabbits and small pets",
			Phone:        "+919876543212",
			Image:        "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600",
			Rating:       4.5,
			ReviewCount:  124,
			DeliveryTime: "30–40 min",
			DeliveryFee:  "₹10",
			OpeningTime:  "08:30",
			ClosingTime:  "21:00",
			Distance:     "3.4 km",
			Latitude:     17.4422,
			Longitude:    78.3912,
			IsOpen:       true,
			IsPromoted:   false,
			Discount:     &disc3,
			Tags:         []string{"Rabbits", "Guinea Pigs", "Herb-rich"},
			MenuItems: []MenuItem{
				{Name: "Hay & Herb Pack", Description: "Timothy hay with mint and parsley mix", Price: 119, Image: "https://images.unsplash.com/photo-1464306076886-debede6f7d2f?w=400", IsVeg: true, IsBestseller: true, IsAvailable: true},
				{Name: "Crunchy Veg Cubes", Description: "Dehydrated carrot, beet and spinach bites", Price: 99, Image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400", IsVeg: true, IsBestseller: false, IsAvailable: true},
				{Name: "Calcium Pellet Blend", Description: "Balanced pellet mix for daily nutrition", Price: 149, Image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400", IsVeg: true, IsBestseller: true, IsAvailable: true},
			},
		},
		{
			Name:         "Pet Chef Express",
			Tagline:      "Fast delivery pet meals for all breeds",
			Phone:        "+919876543213",
			Image:        "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600",
			Rating:       4.3,
			ReviewCount:  178,
			DeliveryTime: "15–25 min",
			DeliveryFee:  "₹20",
			OpeningTime:  "11:00",
			ClosingTime:  "23:30",
			Distance:     "1.8 km",
			Latitude:     17.4449,
			Longitude:    78.3834,
			IsOpen:       true,
			IsPromoted:   true,
			Discount:     &disc4,
			Tags:         []string{"Dogs", "Cats", "Quick Delivery"},
			MenuItems: []MenuItem{
				{Name: "Lamb Rice Combo", Description: "Slow-cooked lamb with rice and peas", Price: 199, Image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400", IsVeg: false, IsBestseller: true, IsAvailable: true},
				{Name: "Turkey Power Meal", Description: "Lean turkey mix for active pets", Price: 189, Image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", IsVeg: false, IsBestseller: false, IsAvailable: true},
				{Name: "Veggie Boost Mix", Description: "Mixed veggies and grains for balanced diet", Price: 129, Image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", IsVeg: true, IsBestseller: false, IsAvailable: true},
			},
		},
	}
}

func (a *App) seedDiscountsIfEmpty() error {
	var count int64
	if err := a.db.Model(&Discount{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	max75 := 75.0
	max100 := 100.0

	discounts := []Discount{
		{
			Code:        "PAWFIRST",
			Title:       "Welcome Offer",
			Description: "30% off up to ₹75",
			Type:        "percent",
			Value:       30,
			MaxDiscount: &max75,
			MinOrder:    149,
			IsActive:    true,
		},
		{
			Code:        "TREATS50",
			Title:       "Treat Time",
			Description: "Flat ₹50 off on orders above ₹299",
			Type:        "flat",
			Value:       50,
			MaxDiscount: &max100,
			MinOrder:    299,
			IsActive:    true,
		},
	}

	return a.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&discounts).Error
	})
}

func splitTags(tagsCSV string) []string {
	tags := make([]string, 0)
	for _, tag := range strings.Split(tagsCSV, ",") {
		trimmed := strings.TrimSpace(tag)
		if trimmed != "" {
			tags = append(tags, trimmed)
		}
	}
	return tags
}

func (a *App) seedRestaurantPartners(partnerKeys map[uint]string) error {
	if len(partnerKeys) == 0 {
		return nil
	}

	return a.db.Transaction(func(tx *gorm.DB) error {
		for restaurantID, key := range partnerKeys {
			trimmedKey := strings.TrimSpace(key)
			if trimmedKey == "" {
				continue
			}
			var restaurant Restaurant
			if err := tx.First(&restaurant, restaurantID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					continue
				}
				return err
			}

			hash := hashPartnerKey(trimmedKey)
			var partner RestaurantPartner
			err := tx.Where("restaurant_id = ?", restaurantID).First(&partner).Error
			if err == gorm.ErrRecordNotFound {
				partner = RestaurantPartner{
					RestaurantID: restaurantID,
					KeyHash:      hash,
					IsActive:     true,
				}
				if err := tx.Create(&partner).Error; err != nil {
					return err
				}
				continue
			}
			if err != nil {
				return err
			}
			if partner.KeyHash != hash {
				partner.KeyHash = hash
				partner.IsActive = true
				if err := tx.Save(&partner).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
