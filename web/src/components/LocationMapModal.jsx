import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationStore } from '../store/locationStore';

// Fix for marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.latitude, center.longitude], 13);
    }
  }, [center, map]);
  return null;
}

export function LocationMapModal({ isOpen, onClose, onSelectLocation }) {
  const { selectedLocation } = useLocationStore();
  const [mapCenter, setMapCenter] = useState(
    selectedLocation ? 
      { latitude: selectedLocation.latitude || 17.3850, longitude: selectedLocation.longitude || 78.4867 } :
      { latitude: 17.3850, longitude: 78.4867 } // Hyderabad default
  );
  const [selectedPin, setSelectedPin] = useState(mapCenter);
  const [locationLabel, setLocationLabel] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (selectedLocation) {
      setMapCenter({
        latitude: selectedLocation.latitude || 17.3850,
        longitude: selectedLocation.longitude || 78.4867,
      });
      setSelectedPin({
        latitude: selectedLocation.latitude || 17.3850,
        longitude: selectedLocation.longitude || 78.4867,
      });
      setLocationLabel(selectedLocation.address || '');
    }
  }, [isOpen, selectedLocation]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedPin({ latitude: lat, longitude: lng });
    // In a real app, you'd use reverse geocoding to get the address
    setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleConfirmLocation = () => {
    if (selectedPin) {
      onSelectLocation({
        latitude: selectedPin.latitude,
        longitude: selectedPin.longitude,
        address: locationLabel || `${selectedPin.latitude.toFixed(4)}, ${selectedPin.longitude.toFixed(4)}`,
        label: locationLabel || 'Map Location',
        isCurrent: false,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal-map">
        <div className="modal-header">
          <h2>Select delivery location</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="map-wrapper">
          <MapContainer
            center={[mapCenter.latitude, mapCenter.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            onClick={(e) => handleMapClick(e)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <MapRecenter center={mapCenter} />
            {selectedPin && (
              <Marker
                position={[selectedPin.latitude, selectedPin.longitude]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setSelectedPin({ latitude: lat, longitude: lng });
                  },
                }}
              >
                <Popup>
                  <div className="marker-popup">
                    <p>{locationLabel || 'New Location'}</p>
                    <p className="coords">{selectedPin.latitude.toFixed(4)}, {selectedPin.longitude.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className="location-input-section">
          <input
            type="text"
            placeholder="Enter location name or address"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            className="location-input"
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirmLocation}
            disabled={!selectedPin}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
