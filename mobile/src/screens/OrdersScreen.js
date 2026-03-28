import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useOrderStore from '../store/orderStore';

const formatStatusLabel = (status) => String(status || '').replace(/_/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());

const OrdersScreen = ({ navigation }) => {
  const { orders, isLoading, loadOrders } = useOrderStore();

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
            >
              <Text style={styles.restaurant}>{item.restaurantName}</Text>
              <Text style={[styles.meta, item.status === 'cancelled' && styles.cancelledMeta]}>
                Status: {formatStatusLabel(item.status)}
              </Text>
              {item.status === 'cancelled' ? (
                <Text style={styles.cancelledHint}>Cancelled: restaurant did not accept in time</Text>
              ) : null}
              <Text style={styles.meta}>Total: ₹{item.grandTotal}</Text>
              <Text style={styles.codMeta}>Payment: Cash on Delivery</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SIZES.padding },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: SIZES.padding, gap: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, ...SHADOWS.card },
  restaurant: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  meta: { marginTop: 4, color: COLORS.textLight, fontSize: SIZES.sm },
  cancelledMeta: { color: COLORS.danger, fontWeight: '700' },
  cancelledHint: { marginTop: 4, color: COLORS.danger, fontSize: SIZES.xs },
  codMeta: { marginTop: 6, color: COLORS.success, fontSize: SIZES.xs, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 30, color: COLORS.textLight },
});

export default OrdersScreen;
