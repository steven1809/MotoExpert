import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Corregir problema de iconos de Leaflet en React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = () => {
  const position = [4.4447, -75.2015]; // Coordenadas SENA Ibagué

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-12 animate-in fade-in duration-700">
      <div className="bg-slate-800/50 backdrop-blur-sm p-1 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="h-[400px] w-full rounded-2xl overflow-hidden z-0">
          <MapContainer 
            center={position} 
            zoom={16} 
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-blue-600">MotoExpert</p>
                  <p className="text-xs text-gray-600">Lavadero de Motos (SENA Ibagué)</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapView;
