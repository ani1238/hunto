import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import MenuItemCard from '../components/MenuItemCard';
import CartBar from '../components/CartBar';
import useCartStore from '../store/cartStore';

const RestaurantScreen = ({ navigation, route }) => {
  const { restaurant } = route.params;
  const loadCart = useCartStore((state) => state.loadCart);

  React.useEffect(() => {
    loadCart();
  }, [loadCart]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: restaurant.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.heroTopGrad}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {!restaurant.isOpen ? (
            <View style={styles.closedHeroOverlay}>
              <Text style={styles.closedHeroTitle}>Restaurant Closed</Text>
              <Text style={styles.closedHeroSubtitle}>
                Opens {restaurant.openingTime || '09:00'} · Closes {restaurant.closingTime || '23:00'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantTagline}>{restaurant.tagline}</Text>
          <View style={[styles.statusBadge, restaurant.isOpen ? styles.statusOpen : styles.statusClosed]}>
            <Ionicons name={restaurant.isOpen ? 'checkmark-circle' : 'close-circle'} size={14} color={restaurant.isOpen ? COLORS.success : COLORS.danger} />
            <Text style={[styles.statusText, restaurant.isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
              {restaurant.isOpen ? 'Open' : 'Closed'} · {restaurant.openingTime || '09:00'} - {restaurant.closingTime || '23:00'}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={16} color={COLORS.rating} />
              <Text style={styles.statValue}>{restaurant.rating}</Text>
              <Text style={styles.statLabel}>({restaurant.reviewCount}+)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{restaurant.deliveryTime}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.statValue}>{restaurant.distance}</Text>
            </View>
          </View>

          {restaurant.discount && (
            <View style={styles.offerBanner}>
              <Ionicons name="pricetag" size={14} color={COLORS.primary} />
              <Text style={styles.offerText}>{restaurant.discount}</Text>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>
          {restaurant.menu.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              restaurantOpen={restaurant.isOpen}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {restaurant.isOpen ? <CartBar onPress={() => navigation.navigate('Cart')} /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroContainer: {
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTopGrad: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  closedHeroTitle: {
    color: '#fff',
    fontSize: SIZES.lg,
    fontWeight: '800',
    marginBottom: 6,
  },
  closedHeroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: SIZES.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    margin: SIZES.padding,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.padding,
    ...SHADOWS.card,
  },
  restaurantName: {
    fontSize: SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  restaurantTagline: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginBottom: 14,
  },
  statusBadge: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusOpen: {
    backgroundColor: '#ECFDF3',
  },
  statusClosed: {
    backgroundColor: '#FFF1F2',
  },
  statusText: {
    fontSize: SIZES.xs,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: COLORS.success,
  },
  statusTextClosed: {
    color: COLORS.danger,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  offerText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
  menuSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.cardRadius,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});

export default RestaurantScreen;
