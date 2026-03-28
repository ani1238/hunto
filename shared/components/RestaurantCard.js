import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const RestaurantCard = ({ restaurant, onPress }) => {
  const { name, tagline, image, rating, reviewCount, deliveryTime, deliveryFee, openingTime, closingTime, tags, isOpen, isPromoted, discount, distanceKm } = restaurant;

  return (
    <TouchableOpacity
      style={[styles.card, !isOpen && styles.cardClosed]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

        {!isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>Currently Closed</Text>
          </View>
        )}

        {isPromoted && (
          <View style={styles.promotedBadge}>
            <Text style={styles.promotedText}>PROMOTED</Text>
          </View>
        )}

        {discount && (
          <View style={styles.discountBadge}>
            <Ionicons name="pricetag" size={11} color="#fff" />
            <Text style={styles.discountText}> {discount}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.rowBetween}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={COLORS.rating} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        <Text style={styles.tagline} numberOfLines={1}>{tagline}</Text>

        {/* Tags */}
        <View style={styles.tags}>
          {tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <Text style={styles.hoursText}>Hours: {openingTime || '09:00'} - {closingTime || '23:00'}</Text>

        {/* Delivery meta */}
        <View style={styles.row}>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.meta}>{deliveryTime}</Text>
          <View style={styles.dot} />
          <Ionicons name="bicycle-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.meta}>{deliveryFee}</Text>
          {distanceKm != null && (
            <>
              <View style={styles.dot} />
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.meta}>{distanceKm.toFixed(1)} km</Text>
            </>
          )}
          <View style={styles.dot} />
          <Text style={styles.reviews}>({reviewCount} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.cardRadius,
    marginHorizontal: SIZES.padding,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardClosed: {
    opacity: 0.75,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 170,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: SIZES.base,
    letterSpacing: 0.5,
  },
  promotedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  promotedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    padding: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderColor: COLORS.success,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
  },
  ratingText: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.success,
  },
  tagline: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginTop: 3,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#FFF5F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  hoursText: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
  },
  reviews: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 2,
  },
});

export default RestaurantCard;
