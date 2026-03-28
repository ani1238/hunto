export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    const address = data.address || {};

    return {
      addressLine: address.road || address.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: address.city || address.town || address.village || 'Unknown',
      state: address.state || 'Unknown',
      postalCode: address.postcode || '000000',
      country: address.country || 'Unknown',
      displayName: data.display_name || 'Location',
    };
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    // Fallback: return basic coordinates as address
    return {
      addressLine: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'India',
      displayName: 'Selected Location',
    };
  }
}
