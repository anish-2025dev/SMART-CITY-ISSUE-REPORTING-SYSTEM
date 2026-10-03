import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";

// Sharp orange pin built with CSS, so we avoid Leaflet's default-icon path issue with Vite
const pinIcon = L.divIcon({
  className: "pin",
  html: '<span class="pin-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // fallback view of India until a location is chosen

function ClickToPlace({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Moves the map when the position changes (e.g. after "Use my location")
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16));
  }, [position, map]);
  return null;
}

export default function LocationPicker({ position, onChange }) {
  return (
    <MapContainer
      center={position ? [position.lat, position.lng] : DEFAULT_CENTER}
      zoom={position ? 16 : 5}
      className="map-picker"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onChange={onChange} />
      <FlyTo position={position} />
      {position && (
        <Marker
          position={[position.lat, position.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const { lat, lng } = e.target.getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
