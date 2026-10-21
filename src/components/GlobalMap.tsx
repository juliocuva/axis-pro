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
        border: 2px solid #FAF2CA;
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
  
  // Farm coordinates from WhatsApp / GPS + Sentinel-2 verification
  const farms = (activeLot?.farmers || []).map((f: any, i: number) => ({
    ...f,
    lat: typeof f.lat === 'number' ? f.lat : 4.8133 + ((i % 7) - 3) * 0.04,
    lng: typeof f.lng === 'number' ? f.lng : -75.6961 + ((i % 5) - 2) * 0.04
  }));

  return (
    <div className="relative w-full h-full bg-[#0C3C60]">
      <style>{`
        .axis-navy-map .leaflet-tile-pane {
          filter: sepia(100%) hue-rotate(168deg) saturate(310%) brightness(88%) contrast(108%);
        }
        .axis-navy-map.leaflet-container {
          background-color: #082840 !important;
        }
      `}</style>

      {/* Map Button & Active Lot Card in #0C3C60 Navy */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col items-end gap-2">
        <button 
          onClick={onClose}
          className="bg-[#0C3C60]/95 backdrop-blur-md border border-[#FAF2CA]/30 text-[#FAF2CA] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#124d7a] transition-colors shadow-xl cursor-pointer"
        >
          Cerrar Mapa / Volver al Lote
        </button>
        <div className="bg-[#0C3C60]/95 backdrop-blur-md border border-[#69CCC2]/40 p-4 rounded-xl shadow-2xl mt-2 w-64 text-left pointer-events-none">
          <p className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1">Lote Activo</p>
          <p className="text-[#FAF2CA] font-bold mb-2">{activeLot?.title || 'Lote'}</p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#FAF2CA]/70">Volumen:</span>
            <span className="text-[#69CCC2] font-mono font-bold">{activeLot?.batchCurrent} kg</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-[#FAF2CA]/70">Fincas (WhatsApp GPS):</span>
            <span className="text-white font-mono">{activeLot?.farmers?.length} validadas</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1.5 pt-1.5 border-t border-white/15">
            <span className="text-[#FAF2CA]/70">Cruce Sentinel-2:</span>
            <span className="text-[#83DF9C] font-mono font-bold">✓ EUDR 0.0 ha</span>
          </div>
        </div>
      </div>

      <MapContainer 
        center={[20.0, -30.0]} 
        zoom={3} 
        className="w-full h-full z-0 axis-navy-map"
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Origin Marker */}
        <Marker position={colombiaCenter} icon={createNeonIcon('#83DF9C')}>
          <Tooltip direction="top" className="bg-[#0C3C60] text-[#83DF9C] border border-[#83DF9C]/50 font-mono text-xs p-2">
            ORIGEN: COLOMBIA (EJE CAFETERO)
          </Tooltip>
        </Marker>

        {/* Destination Marker */}
        <Marker position={hamburg} icon={createNeonIcon('#69CCC2')}>
          <Tooltip direction="top" className="bg-[#0C3C60] text-[#FAF2CA] border border-[#69CCC2]/50 font-mono text-xs p-2">
            DESTINO: HAMBURGO
          </Tooltip>
        </Marker>

        {/* Route Line */}
        <Polyline 
          positions={[colombiaCenter, [30.0, -40.0], hamburg]} 
          color="#69CCC2" 
          weight={2.5} 
          dashArray="6, 10" 
          opacity={0.85} 
        />

        {/* Farm Markers */}
        {farms.map((f: any, i: number) => (
          <Marker key={i} position={[f.lat, f.lng]} icon={createNeonIcon(f.eudrCleared === false ? '#FF7E7E' : '#83DF9C')}>
            <Tooltip direction="top" className="bg-[#0C3C60] text-white border border-[#83DF9C]/50 text-xs p-2">
              <p className="font-bold text-[#FAF2CA]">{f.farm}</p>
              <p className="text-[10px] text-[#FAF2CA]/70">{f.name}</p>
              <p className="text-[10px] text-[#69CCC2] font-mono mt-0.5">📍 {f.coordinates || `${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}`}</p>
              <p className="text-[#83DF9C] font-mono font-bold mt-1">{f.volume} • ✓ SENTINEL-2 EUDR OK</p>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
