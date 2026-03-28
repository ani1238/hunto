import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useAuthStore from '../store/authStore';
import useLocationStore from '../store/locationStore';

const ProfileScreen = () => {
  const { userProfile, updateProfile } = useAuthStore();
  const { persistedLocations, loadPersistedLocations, selectPersistedLocation, saveLocation, locationError, clearLocationError } = useLocationStore();
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [addressLabel, setAddressLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  React.useEffect(() => {
    loadPersistedLocations();
  }, [loadPersistedLocations]);

  React.useEffect(() => {
    if (!locationError) return;
    Alert.alert('Address error', locationError);
    clearLocationError();
  }, [locationError, clearLocationError]);

  const handleSaveAddress = async () => {
    if (!addressLine1.trim()) {
      Alert.alert('Address line 1 required', 'Please enter Address Line 1 to save this address.');
      return;
    }
    const result = await saveLocation({
      label: addressLabel.trim() || 'Saved Address',
      addressLine: addressLine1.trim(),
      city: city.trim() || 'Unknown',
      state: state.trim() || 'Unknown',
      postalCode: postalCode.trim() || '000000',
      country: country.trim() || 'India',
      latitude: 17.3850,
      longitude: 78.4867,
    }, false);
    if (result) {
      setAddressLabel('');
      setAddressLine1('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('India');
      Alert.alert('Saved', 'Address saved successfully.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Profile & Addresses</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowProfileEditor((v) => !v)}>
          <View>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.summaryText}>{name || 'No name'} · {email || 'No email'}</Text>
          </View>
          <Ionicons name={showProfileEditor ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
        </TouchableOpacity>
        {showProfileEditor ? (
          <>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
            <TouchableOpacity style={styles.saveBtn} onPress={() => updateProfile(name, email)}>
              <Text style={styles.saveText}>Save Profile</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowAddAddressForm((v) => !v)}>
          <View>
            <Text style={styles.sectionTitle}>Addresses</Text>
            <Text style={styles.summaryText}>{persistedLocations.length} saved</Text>
          </View>
          <Ionicons name={showAddAddressForm ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
        </TouchableOpacity>
        {showAddAddressForm ? (
          <>
            <TextInput style={styles.input} value={addressLabel} onChangeText={setAddressLabel} placeholder="Label (Home, Office)" />
            <TextInput
              style={styles.input}
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Address Line 1 *"
            />
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
            <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="State" />
            <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="Postal Code" keyboardType="number-pad" />
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
              <Text style={styles.saveText}>Save Address</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.expandBtn} onPress={() => setShowAddAddressForm(true)}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.expandBtnText}>Add new address</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.section}>Saved Addresses</Text>
      <FlatList
        data={persistedLocations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.addrCard} onPress={() => selectPersistedLocation(item.id)}>
            <Text style={styles.addrTitle}>{item.label}</Text>
            <Text style={styles.addrSub}>{item.addressLine}, {item.city}</Text>
            {item.isCurrent ? <Text style={styles.current}>Current</Text> : null}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 12, ...SHADOWS.card, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text },
  summaryText: { marginTop: 2, fontSize: SIZES.xs, color: COLORS.textLight },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 10, padding: 10, color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  section: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  expandBtnText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '700' },
  addrCard: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, ...SHADOWS.card },
  addrTitle: { color: COLORS.text, fontWeight: '700' },
  addrSub: { color: COLORS.textLight, marginTop: 2 },
  current: { marginTop: 6, color: COLORS.success, fontWeight: '700', fontSize: SIZES.xs },
});

export default ProfileScreen;
