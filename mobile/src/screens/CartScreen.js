import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useCartStore from '../store/cartStore';
import useLocationStore from '../store/locationStore';

const PAYMENT_METHOD = 'Cash on Delivery';
const TRUST_SIGNALS = [
  { id: 'hygiene', icon: 'shield-checkmark-outline', text: 'Hygienic prep partner verified' },
  { id: 'support', icon: 'headset-outline', text: '24x7 support for order issues' },
  { id: 'fresh', icon: 'medkit-outline', text: 'Fresh meals with safe packaging' },
];

const CartScreen = ({ navigation }) => {
  const {
    cart,
    addItem,
    removeItem,
    clearCart,
    getTotalPrice,
    getSubtotal,
    getDiscountAmount,
    loadCart,
    loadDiscounts,
    applyDiscount,
    removeDiscount,
    availableDiscounts,
    errorMessage,
    isLoading,
    placeOrder,
  } = useCartStore();
  const { persistedLocations, loadPersistedLocations, selectPersistedLocation } = useLocationStore();
  const [selectedAddressId, setSelectedAddressId] = React.useState('');
  const items = cart.items || [];
  const subtotal = getSubtotal();
  const discountedTotal = getTotalPrice();
  const discountAmount = getDiscountAmount();
  const deliveryFee = discountedTotal >= 199 ? 0 : 20;
  const taxes = Math.round(discountedTotal * 0.05);
  const grandTotal = discountedTotal + deliveryFee + taxes;

  React.useEffect(() => {
    loadCart();
    loadDiscounts();
    loadPersistedLocations();
  }, [loadCart, loadPersistedLocations]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is empty!</Text>
          <Text style={styles.emptySubtitle}>
            Add some tasty meals for your furry friends
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptySubtitle}>Updating cart...</Text>
        </View>
      ) : (
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.menuItemName}</Text>
              <Text style={styles.itemRestaurant}>{item.restaurantName}</Text>
              <Text style={styles.itemPrice}>₹{Number(item.lineTotal || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => removeItem(item.menuItemId)}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => addItem({ id: item.menuItemId })}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.billSection}>
            <Text style={styles.billTitle}>Bill Details</Text>
            {cart.appliedDiscount ? (
              <View style={styles.discountBanner}>
                <Text style={styles.discountBannerText}>
                  Applied: {cart.appliedDiscount.code} (-₹{Number(discountAmount).toFixed(2)})
                </Text>
                <TouchableOpacity onPress={removeDiscount}>
                  <Text style={styles.removeDiscountText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{Number(subtotal).toFixed(2)}</Text>
            </View>
            {discountAmount > 0 ? (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, styles.free]}>-₹{Number(discountAmount).toFixed(2)}</Text>
              </View>
            ) : null}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={[styles.billValue, deliveryFee === 0 && styles.free]}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Charges</Text>
              <Text style={styles.billValue}>₹{taxes}</Text>
            </View>

            {availableDiscounts.length > 0 && !cart.appliedDiscount ? (
              <View style={styles.discountSection}>
                <Text style={styles.discountSectionTitle}>Available Offers</Text>
                {availableDiscounts.map((offer) => (
                  <TouchableOpacity
                    key={offer.code}
                    style={styles.offerRow}
                    onPress={() => applyDiscount(offer.code)}
                  >
                    <View>
                      <Text style={styles.offerCode}>{offer.code}</Text>
                      <Text style={styles.offerDesc}>{offer.description}</Text>
                    </View>
                    <Text style={styles.applyText}>Apply</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {!!errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotal}>Grand Total</Text>
              <Text style={styles.billTotalValue}>₹{grandTotal}</Text>
            </View>
          </View>
        }
      />
      )}

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.paymentCard}>
          <View style={styles.paymentLeft}>
            <Ionicons name="cash-outline" size={18} color={COLORS.success} />
            <View>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>{PAYMENT_METHOD}</Text>
            </View>
          </View>
          <View style={styles.codPill}>
            <Text style={styles.codPillText}>COD</Text>
          </View>
        </View>

        <View style={styles.trustCard}>
          {TRUST_SIGNALS.map((signal) => (
            <View key={signal.id} style={styles.trustRow}>
              <Ionicons name={signal.icon} size={16} color={COLORS.success} />
              <Text style={styles.trustText}>{signal.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressTitle}>Delivery Address</Text>
          {persistedLocations.length === 0 ? (
            <>
              <Text style={styles.addressHint}>
                No saved address found. Please add an address before placing order.
              </Text>
              <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.addAddressBtnText}>Add Address</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.addressHint}>Select one saved address for this order:</Text>
              {persistedLocations.map((location) => {
                const isSelected = String(selectedAddressId) === String(location.id);
                return (
                  <TouchableOpacity
                    key={String(location.id)}
                    style={[styles.addressOption, isSelected && styles.addressOptionSelected]}
                    onPress={async () => {
                      setSelectedAddressId(String(location.id));
                      await selectPersistedLocation(location.id);
                    }}
                  >
                    <View style={[styles.addressRadio, isSelected && styles.addressRadioSelected]} />
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLabel}>{location.label}</Text>
                      <Text style={styles.addressLine}>{location.addressLine}, {location.city}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.orderBtn}
          onPress={async () => {
            if (persistedLocations.length === 0) {
              Alert.alert('Address required', 'Please add a saved address before placing your order.', [
                { text: 'Not now', style: 'cancel' },
                { text: 'Add Address', onPress: () => navigation.navigate('Profile') },
              ]);
              return;
            }
            if (!selectedAddressId) {
              Alert.alert('Select address', 'Please select which saved address should receive this order.');
              return;
            }
            const result = await placeOrder(selectedAddressId);
            if (result.success && result.order?.id) {
              navigation.navigate('OrderTracking', { orderId: result.order.id });
            }
          }}
        >
          <View>
            <Text style={styles.orderBtnText}>Place Order</Text>
            <Text style={styles.orderBtnSub}>Estimated 30–40 min</Text>
          </View>
          <Text style={styles.orderBtnPrice}>₹{grandTotal}</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: SIZES.sm,
  },
  list: {
    padding: SIZES.padding,
    gap: 12,
  },
  cartItem: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemRestaurant: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.primary,
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
  qtyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: SIZES.base,
    minWidth: 24,
    textAlign: 'center',
  },
  billSection: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginTop: 8,
    ...SHADOWS.card,
  },
  discountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E9FFF1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  discountBannerText: {
    color: COLORS.success,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  removeDiscountText: {
    color: COLORS.danger,
    fontSize: SIZES.xs,
    fontWeight: '700',
  },
  discountSection: {
    marginTop: 10,
  },
  discountSectionTitle: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  offerCode: {
    fontSize: SIZES.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  offerDesc: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  applyText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: SIZES.xs,
    marginTop: 6,
  },
  billTitle: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
  },
  billValue: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  free: {
    color: COLORS.success,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  billTotal: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.text,
  },
  billTotalValue: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.primary,
  },
  footer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentCard: {
    backgroundColor: '#F4FFF8',
    borderWidth: 1,
    borderColor: '#CDEFD9',
    borderRadius: SIZES.borderRadius,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
  paymentValue: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: 2,
  },
  codPill: {
    backgroundColor: COLORS.success,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codPillText: {
    color: '#fff',
    fontSize: SIZES.xs,
    fontWeight: '800',
  },
  trustCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: SIZES.xs,
    color: COLORS.text,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    padding: 12,
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: SIZES.sm,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  addressHint: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  addAddressBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addAddressBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: SIZES.sm,
  },
  addressOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  addressOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F0',
  },
  addressRadio: {
    width: 16,
    height: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
  },
  addressRadioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  addressLine: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  orderBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBtnText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: '800',
  },
  orderBtnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  orderBtnPrice: {
    color: '#fff',
    fontSize: SIZES.lg,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: SIZES.base,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: SIZES.base,
  },
});

export default CartScreen;
