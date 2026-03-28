import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { BANNERS, CATEGORIES, LOCATIONS } from '../constants/mockData';
import RestaurantCard from '../components/RestaurantCard';
import BannerCarousel from '../components/BannerCarousel';
import CartBar from '../components/CartBar';
import useLocationStore from '../store/locationStore';
import useRestaurantStore from '../store/restaurantStore';
import useCartStore from '../store/cartStore';

const HomeScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('c6');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [openOnly, setOpenOnly] = useState(true);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationModalTab, setLocationModalTab] = useState('list'); // 'list' or 'map'
  const [mapRegion, setMapRegion] = useState({
    latitude: 17.3850, // Hyderabad coordinates
    longitude: 78.4867,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const mapRef = useRef(null);

  // Location store
  const {
    selectedLocation,
    currentLocation,
    recentLocations,
    persistedLocations,
    isLoadingLocation,
    locationError,
    setSelectedLocation,
    addRecentLocation,
    getCurrentLocation,
    saveLocation,
    loadPersistedLocations,
    selectPersistedLocation,
    clearLocationError,
  } = useLocationStore();

  const {
    restaurants,
    isLoading: isRestaurantsLoading,
    errorMessage: restaurantsError,
    fetchRestaurants,
  } = useRestaurantStore();

  const loadCart = useCartStore((state) => state.loadCart);

  // Initialize with current device location if available, else fallback to default location
  useEffect(() => {
    const initializeLocation = async () => {
      const stored = await loadPersistedLocations();
      const persistedCurrent = stored.find((loc) => loc.isCurrent);
      if (persistedCurrent) {
        setSelectedLocation(persistedCurrent);
        setMapRegion((prev) => ({
          ...prev,
          latitude: persistedCurrent.latitude,
          longitude: persistedCurrent.longitude,
        }));
      }

      const location = await getCurrentLocation();
      if (location) {
        if (!persistedCurrent) {
          setSelectedLocation(location);
        }
        if (!persistedCurrent && location.latitude && location.longitude) {
          setMapRegion((prev) => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }
      } else if (!persistedCurrent) {
        setSelectedLocation(LOCATIONS[0]);
      }
    };

    initializeLocation();
    fetchRestaurants('');
    loadCart();
  }, []);

  // Clear location error when modal opens
  useEffect(() => {
    if (locationModalVisible) {
      clearLocationError();
      setSelectedMapLocation(null);
      setLocationModalTab('list');
    }
  }, [locationModalVisible]);

  // Fetch and center current location when map tab opens
  useEffect(() => {
    const fetchMapLocation = async () => {
      if (locationModalTab === 'map') {
        const location = await getCurrentLocation();
        if (location) {
          setMapRegion((prev) => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
          setSelectedMapLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            ...location,
          });
        }
      }
    };

    fetchMapLocation();
  }, [locationModalTab]);

  const allLocations = [
    ...(currentLocation ? [{ ...currentLocation, source: 'current' }] : []),
    ...persistedLocations.map((loc) => ({ ...loc, source: 'saved' })),
    ...recentLocations
      .filter((loc) => !persistedLocations.find((l) => String(l.id) === String(loc.id)) && loc.id !== 'current')
      .map((loc) => ({ ...loc, source: 'recent' })),
  ];

  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const allLocationsWithKey = allLocations.map((loc, index) => ({
    ...loc,
    key: `${loc.source || 'unknown'}-${loc.id ?? index}`,
  }));

  const uniqueLocationsMap = new Map();
  allLocationsWithKey.forEach((loc) => {
    if (!uniqueLocationsMap.has(loc.key)) {
      uniqueLocationsMap.set(loc.key, loc);
    }
  });

  const locationOptions = Array.from(uniqueLocationsMap.values()).filter((location) =>
    location.label.toLowerCase().includes(locationQuery.trim().toLowerCase())
  );

  const locationKeyExtractor = (item) => item.key;

  const isLocationServiceable = selectedLocation?.isServiceable ?? false;

  const filteredRestaurants = restaurants.map((r) => {
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    const matchesCat = selectedCategory === 'c6' || r.tags.includes(cat?.name);
    const dishMatchesSearch = (r.menu || []).some((item) =>
      (item?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item?.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesSearch =
      searchQuery.trim() === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dishMatchesSearch;

    const hasCoords = selectedLocation?.latitude && selectedLocation?.longitude && r.latitude && r.longitude;
    const distanceKm = hasCoords
      ? getDistanceInKm(selectedLocation.latitude, selectedLocation.longitude, r.latitude, r.longitude)
      : Number.MAX_VALUE;

    return {
      ...r,
      distanceKm,
      isWithinRadius: distanceKm <= 10,
      matchesSearch,
      matchesCat,
      isServiceable: isLocationServiceable && selectedLocation?.isServiceable && (!openOnly || r.isOpen),
    };
  }).filter((r) => r.matchesSearch && r.matchesCat && r.isServiceable && r.isWithinRadius)
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'delivery') return (a.deliveryTime || '').localeCompare(b.deliveryTime || '');
      return (b.rating || 0) - (a.rating || 0);
    });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants(searchQuery.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchRestaurants]);


  const handleLocationSelect = async (location) => {
    if (!location) {
      return;
    }

    if (location.id === 'current' || location.isMapSelected) {
      const saved = await saveLocation(location, true);
      const next = saved || location;
      setSelectedLocation(next);
      addRecentLocation(next);
    } else {
      await selectPersistedLocation(location.id);
      setSelectedLocation(location);
      addRecentLocation(location);
    }

    setLocationModalVisible(false);
    setLocationQuery('');
  };

  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      handleLocationSelect(location);
      // Also update map region
      if (location.latitude && location.longitude) {
        setMapRegion({
          ...mapRegion,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setSelectedMapLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    } else if (locationError) {
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedMapLocation(coordinate);
    setIsReverseGeocoding(true);

    try {
      // Reverse geocode the coordinate
      const address = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      const mapLocationData = {
        id: 'map-selected',
        label: address[0] ? `${address[0].name || address[0].street}, ${address[0].city || 'Unknown'}` : 'Selected Location',
        city: address[0]?.city || 'Unknown',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        isServiceable: true, // Assume selected location is serviceable
        isMapSelected: true,
      };

      setSelectedMapLocation(mapLocationData);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      const mapLocationData = {
        id: 'map-selected',
        label: `Location (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
        city: 'Unknown',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        isServiceable: true,
        isMapSelected: true,
      };
      setSelectedMapLocation(mapLocationData);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleConfirmMapLocation = () => {
    if (selectedMapLocation) {
      handleLocationSelect(selectedMapLocation);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <TouchableOpacity style={styles.locationTouch} onPress={() => setLocationModalVisible(true)}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.locationLabel}>Delivering to</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.text} />
            </View>
            <Text style={styles.locationText}>{selectedLocation?.label || 'Select Location'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.ordersBtn} onPress={() => navigation.navigate('Orders')}>
            <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.profileEmoji}>🐾</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for pet food, treats..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Banner Carousel */}
        <BannerCarousel banners={BANNERS} />

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What's your pet eating? 🐾</Text>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, sortBy === 'rating' && styles.filterChipActive]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.filterChipText, sortBy === 'rating' && styles.filterChipTextActive]}>Top Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, sortBy === 'distance' && styles.filterChipActive]}
            onPress={() => setSortBy('distance')}
          >
            <Text style={[styles.filterChipText, sortBy === 'distance' && styles.filterChipTextActive]}>Nearest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, openOnly && styles.filterChipActive]}
            onPress={() => setOpenOnly((v) => !v)}
          >
            <Text style={[styles.filterChipText, openOnly && styles.filterChipTextActive]}>Open Now</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurant List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isLocationServiceable ? `${filteredRestaurants.length} Restaurants Nearby` : 'Serviceability'}
          </Text>
          {isLocationServiceable && (
            <TouchableOpacity>
              <Text style={styles.seeAll}>Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isLocationServiceable ? (
          <View style={styles.unavailableState}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>Currently available only in Hyderabad</Text>
            <Text style={styles.emptySubtitle}>
              Please choose a Hyderabad location to order from Pawsome Kitchen.
            </Text>
            <TouchableOpacity
              style={styles.changeLocationBtn}
              onPress={() => setLocationModalVisible(true)}
            >
              <Text style={styles.changeLocationText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        ) : isRestaurantsLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.emptySubtitle}>Loading restaurants...</Text>
          </View>
        ) : restaurantsError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Unable to load restaurants</Text>
            <Text style={styles.emptySubtitle}>{restaurantsError}</Text>
            <TouchableOpacity
              style={styles.changeLocationBtn}
              onPress={() => fetchRestaurants(searchQuery.trim())}
            >
              <Text style={styles.changeLocationText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRestaurants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No restaurants found</Text>
            <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
          </View>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => {
                if (!restaurant.isOpen) {
                  Alert.alert(
                    'Restaurant closed',
                    `${restaurant.name} is currently closed. Opening hours: ${restaurant.openingTime || '09:00'} - ${restaurant.closingTime || '23:00'}`
                  );
                  return;
                }
                navigation.navigate('Restaurant', { restaurant });
              }}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartBar onPress={() => navigation.navigate('Cart')} />

      <Modal
        transparent
        animationType="slide"
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[
            styles.modalCard,
            locationModalTab === 'map' && styles.modalCardMap
          ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select delivery location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, locationModalTab === 'list' && styles.tabActive]}
                onPress={() => setLocationModalTab('list')}
              >
                <Ionicons name="list" size={16} color={locationModalTab === 'list' ? '#fff' : COLORS.textMuted} />
                <Text style={[styles.tabText, locationModalTab === 'list' && styles.tabTextActive]}>List</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, locationModalTab === 'map' && styles.tabActive]}
                onPress={() => setLocationModalTab('map')}
              >
                <Ionicons name="map" size={16} color={locationModalTab === 'map' ? '#fff' : COLORS.textMuted} />
                <Text style={[styles.tabText, locationModalTab === 'map' && styles.tabTextActive]}>Map</Text>
              </TouchableOpacity>
            </View>

            {locationModalTab === 'list' ? (
              <>
                {/* Current Location Option */}
                <TouchableOpacity
                  style={styles.currentLocationBtn}
                  onPress={handleUseCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  <View style={styles.currentLocationLeft}>
                    <Ionicons
                      name={isLoadingLocation ? "location" : "navigate"}
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.currentLocationText}>
                      {isLoadingLocation ? 'Getting your location...' : 'Use current location'}
                    </Text>
                  </View>
                  {isLoadingLocation && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                <View style={styles.modalSearch}>
                  <Ionicons name="search" size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search area, city..."
                    placeholderTextColor={COLORS.textMuted}
                    value={locationQuery}
                    onChangeText={setLocationQuery}
                  />
                </View>

                {/* Recent Locations */}
                {recentLocations.length > 0 && locationQuery.trim() === '' && (
                  <View style={styles.recentSection}>
                    <Text style={styles.recentTitle}>Recent locations</Text>
                    {recentLocations.slice(0, 3).map((location) => (
                      <TouchableOpacity
                        key={`recent-${location.id}`}
                        style={styles.locationOption}
                        onPress={() => handleLocationSelect(location)}
                      >
                        <View style={styles.locationOptionLeft}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={COLORS.textMuted}
                          />
                          <View>
                            <Text style={styles.locationOptionLabel}>{location.label}</Text>
                            <Text style={styles.locationOptionSub}>
                              {location.isServiceable ? 'Serviceable' : 'Not serviceable'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* All Locations */}
                <FlatList
                  data={locationOptions.filter(loc => !loc.isCurrentLocation || locationQuery.trim() !== '')}
                  keyExtractor={(item) => locationKeyExtractor(item)}
                  renderItem={({ item }) => {
                    const selected = item.id === selectedLocation?.id;
                    return (
                      <TouchableOpacity
                        style={[styles.locationOption, selected && styles.locationOptionSelected]}
                        onPress={() => handleLocationSelect(item)}
                      >
                        <View style={styles.locationOptionLeft}>
                          <Ionicons
                            name={item.isCurrentLocation ? "navigate" : "location-outline"}
                            size={16}
                            color={item.isServiceable ? COLORS.success : COLORS.textMuted}
                          />
                          <View>
                            <Text style={styles.locationOptionLabel}>{item.label}</Text>
                            <Text
                              style={[
                                styles.locationOptionSub,
                                !item.isServiceable && styles.locationOptionSubUnavailable,
                              ]}
                            >
                              {item.isServiceable ? 'Serviceable now' : 'Not serviceable yet'}
                            </Text>
                          </View>
                        </View>
                        {selected && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={styles.locationDivider} />}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    locationQuery.trim() !== '' ? (
                      <View style={styles.noResults}>
                        <Ionicons name="search" size={24} color={COLORS.textMuted} />
                        <Text style={styles.noResultsText}>No locations found</Text>
                        <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                      </View>
                    ) : null
                  }
                />
              </>
            ) : (
              /* Map View */
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={mapRegion}
                  onPress={handleMapPress}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  {selectedMapLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedMapLocation.latitude,
                        longitude: selectedMapLocation.longitude,
                      }}
                      title="Selected Location"
                      description={selectedMapLocation.label}
                      draggable={true}
                      onDragEnd={(event) => handleMapPress({ nativeEvent: { coordinate: event.nativeEvent.coordinate } })}
                    />
                  )}
                </MapView>

                {isReverseGeocoding && (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.mapLoadingText}>Getting address...</Text>
                  </View>
                )}

                {selectedMapLocation && (
                  <View style={styles.mapLocationCard}>
                    <View style={styles.mapLocationInfo}>
                      <Ionicons name="location" size={16} color={COLORS.primary} />
                      <View style={styles.mapLocationText}>
                        <Text style={styles.mapLocationLabel} numberOfLines={1}>
                          {selectedMapLocation.label}
                        </Text>
                        <Text style={styles.mapLocationSub}>
                          {selectedMapLocation.city}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.confirmLocationBtn}
                      onPress={handleConfirmMapLocation}
                    >
                      <Text style={styles.confirmLocationText}>Confirm Location</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.currentLocationMapBtn}
                  onPress={handleUseCurrentLocation}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTouch: {
    paddingVertical: 2,
  },
  locationLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ordersBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  profileEmoji: {
    fontSize: 20,
  },
  scroll: {
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    marginBottom: 20,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    ...SHADOWS.card,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categories: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textLight,
    fontSize: SIZES.xs,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.card,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  categoryTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: SIZES.padding,
  },
  unavailableState: {
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    padding: 24,
    ...SHADOWS.card,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  changeLocationBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  changeLocationText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: SIZES.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '70%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: SIZES.padding,
    paddingTop: 14,
    paddingBottom: 20,
  },
  modalCardMap: {
    maxHeight: '90%',
    height: Dimensions.get('window').height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  locationOption: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationOptionSelected: {
    backgroundColor: '#FFF8F4',
  },
  locationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationOptionLabel: {
    fontSize: SIZES.base,
    color: COLORS.text,
    fontWeight: '600',
  },
  locationOptionSub: {
    fontSize: SIZES.sm,
    color: COLORS.success,
  },
  locationOptionSubUnavailable: {
    color: COLORS.textMuted,
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  currentLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentLocationText: {
    fontSize: SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: SIZES.base,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 8,
  },
  noResultsSubtext: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    height: Dimensions.get('window').height * 0.75,
  },
  map: {
    flex: 1,
    borderRadius: 8,
  },
  mapLoading: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.card,
  },
  mapLoadingText: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  mapLocationCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.card,
  },
  mapLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  mapLocationText: {
    flex: 1,
  },
  mapLocationLabel: {
    fontSize: SIZES.base,
    color: COLORS.text,
    fontWeight: '600',
  },
  mapLocationSub: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
  },
  confirmLocationBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  confirmLocationText: {
    color: '#fff',
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  currentLocationMapBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
});

export default HomeScreen;
