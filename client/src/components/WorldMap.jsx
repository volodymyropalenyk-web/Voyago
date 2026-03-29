import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths for Vite
delete L.Icon.Default.prototype._getIconUrl;

function createIcon(number) {
  return L.divIcon({
    html: `<div class="city-marker">${number}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function FlyToLast({ cities }) {
  const map = useMap();
  const prevLen = useRef(0);
  useEffect(() => {
    if (cities.length > prevLen.current && cities.length > 0) {
      const last = cities[cities.length - 1];
      map.flyTo([last.lat, last.lon], Math.max(map.getZoom(), 5), { duration: 1 });
    }
    prevLen.current = cities.length;
  }, [cities, map]);
  return null;
}

export default function WorldMap({ cities, onMarkerClick }) {
  const polylinePoints = cities.map((c) => [c.lat, c.lon]);

  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={2}
      style={{ width: '100%', height: '100%' }}
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToLast cities={cities} />

      {cities.length >= 2 && (
        <Polyline
          positions={polylinePoints}
          pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '6 4', opacity: 0.7 }}
        />
      )}

      {cities.map((city, i) => (
        <Marker
          key={city.id}
          position={[city.lat, city.lon]}
          icon={createIcon(i + 1)}
          eventHandlers={{ click: () => onMarkerClick(city) }}
        />
      ))}
    </MapContainer>
  );
}
