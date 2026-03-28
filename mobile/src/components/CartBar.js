import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useCartStore from '../store/cartStore';

const CartBar = ({ onPress }) => {
  const totalItems = useCartStore((s) => s.getTotalItems());
  const totalPrice = useCartStore((s) => s.getTotalPrice());

  if (totalItems === 0) return null;

  return (
    <TouchableOpacity style={styles.bar} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems}</Text>
        </View>
        <Text style={styles.label}>View Cart</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>₹{Number(totalPrice || 0).toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 24,
    left: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 18,
    ...SHADOWS.card,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: SIZES.sm,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: SIZES.base,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    color: '#fff',
    fontWeight: '800',
    fontSize: SIZES.base,
  },
});

export default CartBar;
