'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom neon icon
const createNeonIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-neon-marker',
    html: `
      <div style="
        width: 12px; 
        height: 12px; 
        background-color: ${color}; 
        border-radius: 50%; 
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        border: 2px solid #fff;
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

interface GlobalMapProps {
  onClose: () => void;
  activeLot: any;
}

export default function GlobalMap({ onClose, activeLot }: GlobalMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Colombia Coordinates
  const colombiaCenter: [number, number] = [4.5709, -74.2973];
  
  // Destination: Hamburg
  const hamburg: [number, number] = [53.5511, 9.9937];
  
  // Fake farm coordinates around Colombia
  const farms = activeLot?.farmers?.slice(0, 5).map((f: any, i: number) => ({
    ...f,
    lat: 4.5709 + (Math.random() * 4 - 2),
    lng: -74.2973 + (Math.random() * 4 - 2)
  })) || [];

  return (
    <div className="relative w-full h-full bg-[#0a0a0a]">
      {/* Map Button requested by user */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col items-end gap-2">
        <button 
          onClick={onClose}
          className="bg-black/80 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          Cerrar Mapa / Volver al Lote
        </button>
        <div className="bg-black/80 backdrop-blur-md border border-[#00FFB2]/30 p-4 rounded-lg shadow-[0_0_20px_rgba(0,255,178,0.15)] mt-2 w-64 text-left pointer-events-none">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Lote Activo</p>
          <p className="text-white font-bold mb-2">{activeLot?.title || 'Lote'}</p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Volumen:</span>
            <span className="text-[#00FFB2] font-mono">{activeLot?.batchCurrent} kg</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-slate-400">Fincas:</span>
            <span className="text-white font-mono">{activeLot?.farmers?.length} validadas</span>
          </div>
        </div>
      </div>

      <MapContainer 
        center={[20.0, -30.0]} 
        zoom={3} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Origin Marker */}
        <Marker position={colombiaCenter} icon={createNeonIcon('#00FFB2')}>
          <Tooltip direction="top" className="bg-black/90 text-[#00FFB2] border border-[#00FFB2]/50 font-mono text-xs p-2">
            ORIGEN: COLOMBIA
          </Tooltip>
        </Marker>

        {/* Destination Marker */}
        <Marker position={hamburg} icon={createNeonIcon('#0C6056')}>
          <Tooltip direction="top" className="bg-black/90 text-white border border-white/20 font-mono text-xs p-2">
            DESTINO: HAMBURGO
          </Tooltip>
        </Marker>

        {/* Route Line */}
        <Polyline 
          positions={[colombiaCenter, [30.0, -40.0], hamburg]} 
          color="#00FFB2" 
          weight={2} 
          dashArray="5, 10" 
          opacity={0.5} 
        />

        {/* Farm Markers */}
        {farms.map((f: any, i: number) => (
          <Marker key={i} position={[f.lat, f.lng]} icon={createNeonIcon('#00C87A')}>
            <Tooltip direction="top" className="bg-black/90 text-white border border-[#00C87A]/50 text-xs p-2">
              <p className="font-bold">{f.farm}</p>
              <p className="text-[10px] text-slate-400">{f.name}</p>
              <p className="text-[#00C87A] font-mono mt-1">{f.volume}</p>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
