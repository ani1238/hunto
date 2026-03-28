import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import useCartStore, { CART_RESTAURANT_CONFLICT } from '../store/cartStore';

const MenuItemCard = ({ item, restaurantId, restaurantName, restaurantOpen = true }) => {
  const { addItem, removeItem, getItemQuantity, replaceCartWithItem, errorMessage } = useCartStore();
  const quantity = getItemQuantity(item.id);

  const handleAdd = async () => {
    if (!restaurantOpen) {
      Alert.alert('Restaurant closed', 'This restaurant is currently closed. Please order during opening hours.');
      return;
    }
    const result = await addItem({ ...item, restaurantId, restaurantName });
    if (result?.code === CART_RESTAURANT_CONFLICT) {
      Alert.alert(
        'Start new cart?',
        'Your cart has items from another restaurant. Clear cart and add this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              await replaceCartWithItem(item.id);
            },
          },
        ]
      );
    }
  };

  const canIncrement = restaurantOpen;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        {/* Veg / Non-veg indicator */}
        <View style={[styles.vegIcon, !item.isVeg && styles.nonVeg]}>
          <View style={[styles.vegDot, !item.isVeg && styles.nonVegDot]} />
        </View>

        {item.isBestseller && (
          <View style={styles.bestseller}>
            <Text style={styles.bestsellerText}>🏆 Bestseller</Text>
          </View>
        )}

        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>

      {/* Add to Cart */}
      <View style={styles.addSection}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="fast-food-outline" size={18} color={COLORS.textMuted} />
          </View>
        )}
        {quantity === 0 ? (
          <TouchableOpacity
            style={[styles.addBtn, !restaurantOpen && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!restaurantOpen}
          >
            <Text style={styles.addBtnText}>{restaurantOpen ? 'ADD' : 'CLOSED'}</Text>
            {restaurantOpen ? <Ionicons name="add" size={14} color={COLORS.primary} /> : null}
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => removeItem(item.id)}
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, !canIncrement && styles.qtyBtnDisabled]}
              onPress={canIncrement ? handleAdd : undefined}
              disabled={!canIncrement}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SIZES.padding,
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: COLORS.success,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nonVeg: {
    borderColor: COLORS.danger,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  nonVegDot: {
    backgroundColor: COLORS.danger,
  },
  bestseller: {
    marginBottom: 4,
  },
  bestsellerText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '700',
  },
  name: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  price: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  description: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  errorText: {
    marginTop: 6,
    fontSize: SIZES.xs,
    color: COLORS.danger,
  },
  addSection: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 108,
  },
  itemImage: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: COLORS.border,
  },
  imageFallback: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 2,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    padding: 6,
    paddingHorizontal: 8,
  },
  qtyBtnDisabled: {
    opacity: 0.45,
  },
  qtyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: SIZES.base,
    minWidth: 24,
    textAlign: 'center',
  },
});

export default MenuItemCard;
