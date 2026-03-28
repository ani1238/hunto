import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useLocationStore } from '../store/locationStore';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 17.3850,
  lng: 78.4867,
};

export function LocationMapModal({ isOpen, onClose, onSelectLocation }) {
  const { selectedLocation } = useLocationStore();
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [locationLabel, setLocationLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' },
          types: ['geocode'],
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }
  }, [isLoaded]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newPosition = { lat, lng };
      
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      setLocationLabel(place.formatted_address || '');
      setAddressLine1(''); // Don't auto-fill, let user enter
    }
  };

  useEffect(() => {
    if (selectedLocation && isOpen) {
      const center = {
        lat: selectedLocation.latitude || defaultCenter.lat,
        lng: selectedLocation.longitude || defaultCenter.lng,
      };
      setMapCenter(center);
      setMarkerPosition(center);
      setLocationLabel(selectedLocation.address || '');
      setAddressLine1(selectedLocation.addressLine || '');
    }
  }, [isOpen, selectedLocation]);

  const reverseGeocode = async (lat, lng) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.address?.name ||
        data.address?.road ||
        data.name ||
        '';
      setLocationLabel(address);
      // Don't auto-populate addressLine1 - let user enter it manually
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapClick = (e) => {
    const newPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    setMarkerPosition(newPosition);
    reverseGeocode(newPosition.lat, newPosition.lng);
  };

  const handleMarkerDragEnd = (e) => {
    const newPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    setMarkerPosition(newPosition);
    reverseGeocode(newPosition.lat, newPosition.lng);
  };

  const handleConfirmLocation = () => {
    if (!addressLine1.trim()) {
      alert('Please enter Address Line 1');
      return;
    }
    if (markerPosition) {
      onSelectLocation({
        latitude: markerPosition.lat,
        longitude: markerPosition.lng,
        address: locationLabel || `${markerPosition.lat.toFixed(4)}, ${markerPosition.lng.toFixed(4)}`,
        addressLine: addressLine1,
        label: locationLabel || 'Map Location',
        isCurrent: false,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  if (loadError) {
    return (
      <div className="location-modal-overlay">
        <div className="location-modal-map">
          <div className="modal-header">
            <h2>Error Loading Map</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Could not load Google Maps. Please try again.</p>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="location-modal-overlay">
        <div className="location-modal-map">
          <div className="modal-header">
            <h2>Loading map...</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="location-modal-overlay">
      <div className="location-modal-map">
        <div className="modal-header">
          <h2>Select delivery location</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search location..."
            className="location-input"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div className="map-wrapper">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={13}
            onClick={handleMapClick}
            options={{
              fullscreenControl: true,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
            }}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
                title="Your delivery location"
                animation={window.google?.maps?.Animation?.DROP}
              />
            )}
          </GoogleMap>
          
          {/* Center pin indicator */}
          <div className="map-center-pin">
            <div className="pin-icon">📍</div>
          </div>
        </div>

        <div className="location-input-section">
          <label htmlFor="addressLine1" style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Address Line 1
          </label>
          <input
            id="addressLine1"
            type="text"
            placeholder="Enter your address (e.g., Apt/House No., Street)"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="location-input"
          />
          <label htmlFor="locationLabel" style={{ display: 'block', fontSize: '12px', color: '#666', margin: '8px 0 4px' }}>
            Location Name (Optional)
          </label>
          <input
            id="locationLabel"
            type="text"
            placeholder="e.g., Home, Office, Mom's Place"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            className="location-input"
            disabled={isLoadingAddress}
          />
          {isLoadingAddress && <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0' }}>Getting address...</p>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirmLocation}
            disabled={!markerPosition || !addressLine1.trim()}
            style={{ opacity: (!markerPosition || !addressLine1.trim()) ? 0.5 : 1 }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
