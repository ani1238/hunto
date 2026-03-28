import React from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useOrderStore from '../store/orderStore';

const DELIVERY_WINDOW_SECONDS = 30 * 60;

const adItems = [
  { id: 'ad-1', title: '20% off on treats', subtitle: 'Use code TREATS20 on your next order' },
  { id: 'ad-2', title: 'Free delivery pass', subtitle: 'Get unlimited free delivery for 7 days' },
  { id: 'ad-3', title: 'Health check combo', subtitle: 'Add nutrition packs for better pet health' },
];
const trustSignals = [
  { id: 'safe-handover', label: 'Contactless handover available' },
  { id: 'background-check', label: 'Delivery partner identity verified' },
  { id: 'support', label: 'Support responds within minutes' },
];

const formatRemaining = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatStatusLabel = (status) => String(status || '').replace(/_/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());

const OrderTrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const { tracking, trackOrder, loadOrderById, isLoading } = useOrderStore();
  const [remainingSeconds, setRemainingSeconds] = React.useState(DELIVERY_WINDOW_SECONDS);
  const [initialStatus, setInitialStatus] = React.useState('');

  React.useEffect(() => {
    let mounted = true;

    const initializeCountdown = async () => {
      const order = await loadOrderById(orderId);
      if (!mounted) return;
      setInitialStatus(order?.status || '');
      if (!order?.createdAt) {
        setRemainingSeconds(DELIVERY_WINDOW_SECONDS);
        return;
      }
      const createdAtMs = new Date(order.createdAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
      setRemainingSeconds(Math.max(0, DELIVERY_WINDOW_SECONDS - elapsedSeconds));
    };

    const tick = async () => {
      const { tracking: data, shouldNotify } = await trackOrder(orderId);
      if (!mounted || !data) return;
      if (data.status === 'delivered' || data.status === 'cancelled') {
        setRemainingSeconds(0);
      }
      if (shouldNotify) {
        Alert.alert('Order update', `Status changed to: ${formatStatusLabel(data.status)}`);
      }
    };

    initializeCountdown();
    tick();
    const trackingIntervalId = setInterval(tick, 8000);
    return () => {
      mounted = false;
      clearInterval(trackingIntervalId);
    };
  }, [orderId, trackOrder, loadOrderById]);

  const timeline = tracking?.timeline || [];
  const currentStatus = tracking?.status || initialStatus || 'placed';
  const restaurantPhone = tracking?.order?.restaurantPhone || '';
  const isDelivered = currentStatus === 'delivered';
  const isCancelled = currentStatus === 'cancelled';
  const isTerminal = isDelivered || isCancelled;

  React.useEffect(() => {
    if (isTerminal) {
      return undefined;
    }
    const countdownIntervalId = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(countdownIntervalId);
  }, [isTerminal]);

  const handleCallRestaurant = async () => {
    const phone = String(restaurantPhone || '').trim();
    if (!phone) {
      Alert.alert('Phone unavailable', 'Restaurant contact number is not available yet.');
      return;
    }
    const telUrl = `tel:${phone}`;
    const supported = await Linking.canOpenURL(telUrl);
    if (!supported) {
      Alert.alert('Unable to call', 'Calling is not supported on this device.');
      return;
    }
    await Linking.openURL(telUrl);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Order</Text>
      </View>
      {isLoading && !tracking ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.status}>Current: {formatStatusLabel(currentStatus)}</Text>
            {!isTerminal ? (
              <View style={styles.etaCard}>
                <Text style={styles.etaLabel}>Estimated delivery in</Text>
                <Text style={styles.etaValue}>{formatRemaining(remainingSeconds)}</Text>
              </View>
            ) : isDelivered ? (
              <View style={styles.deliveredCard}>
                <Text style={styles.deliveredTitle}>Delivered!</Text>
                <Text style={styles.deliveredSubtitle}>Your order has reached you successfully.</Text>
              </View>
            ) : (
              <View style={styles.cancelledCard}>
                <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledSubtitle}>This order was cancelled because the restaurant did not accept it in time.</Text>
              </View>
            )}
            {timeline.map((step) => (
              <View key={step.status} style={styles.row}>
                <Text style={[styles.dot, step.done && styles.dotDone]}>●</Text>
                <Text style={[styles.step, step.done && styles.stepDone]}>{step.status}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={handleCallRestaurant}>
              <Text style={styles.callBtnText}>
                {restaurantPhone ? `Call Restaurant: ${restaurantPhone}` : 'Call Restaurant'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.adsCard}>
            <Text style={styles.adsTitle}>While you wait</Text>
            {adItems.map((ad) => (
              <View key={ad.id} style={styles.adRow}>
                <Text style={styles.adHeading}>{ad.title}</Text>
                <Text style={styles.adSubheading}>{ad.subtitle}</Text>
              </View>
            ))}
          </View>

          <View style={styles.trustCard}>
            <Text style={styles.trustTitle}>Trust & Safety</Text>
            {trustSignals.map((signal) => (
              <View key={signal.id} style={styles.trustRow}>
                <Text style={styles.trustDot}>●</Text>
                <Text style={styles.trustText}>{signal.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SIZES.padding },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { margin: SIZES.padding, padding: 16, borderRadius: 12, backgroundColor: COLORS.card, ...SHADOWS.card },
  status: { fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  etaCard: {
    backgroundColor: '#FFF5F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD8C2',
  },
  etaLabel: {
    color: COLORS.textLight,
    fontSize: SIZES.sm,
    marginBottom: 4,
  },
  etaValue: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  deliveredCard: {
    backgroundColor: '#ECFDF3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  deliveredTitle: {
    color: COLORS.success,
    fontSize: SIZES.base,
    fontWeight: '800',
    marginBottom: 2,
  },
  deliveredSubtitle: {
    color: COLORS.textLight,
    fontSize: SIZES.sm,
  },
  cancelledCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledTitle: {
    color: COLORS.danger,
    fontSize: SIZES.base,
    fontWeight: '800',
    marginBottom: 2,
  },
  cancelledSubtitle: {
    color: COLORS.textLight,
    fontSize: SIZES.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { color: COLORS.textMuted, marginRight: 8 },
  dotDone: { color: COLORS.success },
  step: { color: COLORS.textLight, fontSize: SIZES.sm },
  stepDone: { color: COLORS.text, fontWeight: '700' },
  callBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  callBtnText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '800',
  },
  adsCard: {
    marginHorizontal: SIZES.padding,
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    ...SHADOWS.card,
  },
  adsTitle: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  adRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 10,
  },
  adHeading: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  adSubheading: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  trustCard: {
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...SHADOWS.card,
  },
  trustTitle: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trustDot: {
    color: COLORS.success,
    marginRight: 8,
    fontSize: 10,
  },
  trustText: {
    color: COLORS.text,
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
});

export default OrderTrackingScreen;
