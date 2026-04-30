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

  const handleDirectionsClick = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`, '_blank');
  };

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

      <div className="mt-6 text-center">
        <button
          onClick={handleDirectionsClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transform transition-all active:scale-95 flex items-center justify-center mx-auto space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Cómo llegar</span>
        </button>
      </div>
    </div>
  );
};

export default MapView;
