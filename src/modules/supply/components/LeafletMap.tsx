"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with webpack/nextjs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
    center: [number, number];
    polygonCoords?: [number, number][]; // [lat, lng][]
    markers?: [number, number][]; // [lat, lng][]
}

function MapUpdater({ center, polygonCoords, markers }: LeafletMapProps) {
    const map = useMap();
    useEffect(() => {
        if (polygonCoords && polygonCoords.length > 0) {
            const bounds = L.latLngBounds(polygonCoords);
            map.fitBounds(bounds, { padding: [20, 20] });
        } else if (markers && markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 17 });
        } else {
            map.setView(center, 15);
        }
    }, [center, polygonCoords, markers, map]);

    return null;
}

export default function LeafletMap({ center, polygonCoords, markers }: LeafletMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={15}
            style={{ width: '100%', height: '100%', background: '#0a1f15' }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
            />

            {polygonCoords && polygonCoords.length > 0 && (
                <Polygon
                    positions={polygonCoords}
                    pathOptions={{ color: '#00df9a', fillColor: '#00df9a', fillOpacity: 0.2, weight: 3 }}
                />
            )}

            {markers && markers.map((m, i) => (
                <Marker key={i} position={m} />
            ))}

            <MapUpdater center={center} polygonCoords={polygonCoords} markers={markers} />
        </MapContainer>
    );
}
