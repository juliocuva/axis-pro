"use client";
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with webpack/nextjs
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

const vertexIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#00DF9A; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px rgba(0,255,154,0.8);'></div>",
    iconSize: [10, 10],
    iconAnchor: [5, 5]
}) : null;

interface LeafletMapProps {
    center: [number, number];
    polygonCoords?: [number, number][]; // [lat, lng][]
    markers?: [number, number][]; // [lat, lng][]
    currentLocation?: [number, number] | null;
}

function MapUpdater({ center, polygonCoords, markers }: LeafletMapProps) {
    const map = useMap();
    useEffect(() => {
        if (polygonCoords && polygonCoords.length > 0) {
            const bounds = L.latLngBounds(polygonCoords);
            map.fitBounds(bounds, { padding: [40, 40] });
        } else if (markers && markers.length > 1) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
        } else {
            map.setView(center, 18);
        }
    }, [center, polygonCoords, markers, map]);

    return null;
}

export default function LeafletMap({ center, polygonCoords, markers, currentLocation }: LeafletMapProps) {
    // Memoize markers to prevent unnecessary re-renders
    const markerElements = useMemo(() => {
        if (!markers || !vertexIcon) return null;
        return markers.map((m, i) => (
            <Marker key={`${i}-${m[0]}`} position={m} icon={vertexIcon} />
        ));
    }, [markers]);

    return (
        <MapContainer
            center={center}
            zoom={18}
            style={{ width: '100%', height: '100%', background: '#0a1f15' }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
            />

            {polygonCoords && polygonCoords.length > 0 && (
                <Polygon
                    positions={polygonCoords}
                    pathOptions={{ 
                        color: '#00DF9A', 
                        fillColor: '#00DF9A', 
                        fillOpacity: 0.15, 
                        weight: 4,
                        dashArray: '5, 5',
                        lineJoin: 'round'
                    }}
                />
            )}

            {markerElements}

            {currentLocation && (
                <>
                    <CircleMarker 
                        center={currentLocation} 
                        radius={12} 
                        pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 0.4, weight: 2 }} 
                    />
                    <CircleMarker 
                        center={currentLocation} 
                        radius={5} 
                        pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }} 
                    />
                </>
            )}

            <MapUpdater center={center} polygonCoords={polygonCoords} markers={markers} />
        </MapContainer>
    );
}
