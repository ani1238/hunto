import React, { useState, useEffect } from 'react';
import { useLocationStore } from '../store/locationStore';
import { LocationMapModal } from '../components/LocationMapModal';

export function LocationSelectorScreen({ onLocationSelected, onBack }) {
  const [showMapModal, setShowMapModal] = useState(false);
  const {
    locations,
    selectedLocation,
    isLoading,
    errorMessage,
    fetchLocations,
    saveLocation,
    selectLocation,
  } = useLocationStore();

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSelectLocation = async (location) => {
    await selectLocation(location.id);
    onLocationSelected?.(location);
  };

  const handleMapLocationSelected = async (locationData) => {
    const success = await saveLocation(
      locationData.address,
      locationData.latitude,
      locationData.longitude,
      locationData.label,
      locationData.addressLine
    );
    if (success) {
      setShowMapModal(false);
      fetchLocations();
    }
  };

  return (
    <div className="screen location-selector-screen">
      <div className="location-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>Select Delivery Location</h2>
      </div>

      <div className="location-content">
        {errorMessage && <p className="error-text">{errorMessage}</p>}

        {isLoading && <p className="loading-text">Loading locations...</p>}

        <div className="locations-list">
          {locations.length === 0 ? (
            <p className="no-locations">No saved locations. Add one below.</p>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className={`location-card ${selectedLocation?.id === location.id ? 'selected' : ''}`}
                onClick={() => handleSelectLocation(location)}
                style={{ position: 'relative' }}
              >
                <div className="location-label">{location.label}</div>
                <div className="location-address">{location.addressLine}</div>
                {selectedLocation?.id === location.id && <div className="checkmark">✓</div>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="location-buttons-container">
        <button className="btn btn-secondary map-btn" onClick={() => setShowMapModal(true)}>
          📍 Pick from Map
        </button>
      </div>

      <LocationMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectLocation={handleMapLocationSelected}
      />
    </div>
  );
}
