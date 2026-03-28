import React, { useState, useEffect } from 'react';
import { useLocationStore } from '../store/locationStore';
import { LocationMapModal } from '../components/LocationMapModal';

export function LocationSelectorScreen({ onLocationSelected, onBack }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('Home');
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

  const handleAddLocation = async () => {
    if (!address.trim()) {
      alert('Please enter an address');
      return;
    }

    // Default coordinates - in production, use geocoding API
    const success = await saveLocation(address, 0, 0, label);
    if (success) {
      setAddress('');
      setLabel('Home');
      setShowAddForm(false);
    }
  };

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
        {showAddForm ? (
          <div className="add-location-form">
            <h3>Add New Location</h3>
            <div className="form-group">
              <label>Label (e.g., Home, Office)</label>
              <input
                type="text"
                placeholder="Home"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                placeholder="Enter full delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button
                className="btn btn-primary"
                onClick={handleAddLocation}
                disabled={isLoading || !address.trim()}
              >
                {isLoading ? 'Saving...' : 'Save Location'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="add-location-options">
            <button className="btn btn-primary add-btn" onClick={() => setShowAddForm(true)}>
              + Add Address Manually
            </button>
            <button className="btn btn-secondary map-btn" onClick={() => setShowMapModal(true)}>
              📍 Pick from Map
            </button>
          </div>
        )}
      </div>

      <LocationMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectLocation={handleMapLocationSelected}
      />
    </div>
  );
}
