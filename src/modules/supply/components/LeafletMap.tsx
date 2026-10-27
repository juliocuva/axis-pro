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

const getVertexIcon = (num: number, isLast: boolean) => {
    if (typeof window === 'undefined') return undefined;
    return L.divIcon({
        className: 'custom-vertex-marker',
        html: `<div style="
            background: ${isLast ? '#FAF2CA' : '#83DF9C'};
            color: #0C3C60;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 900;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.6);
        ">${num}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
};

interface LeafletMapProps {
    center: [number, number];
    polygonCoords?: [number, number][]; // [lat, lng][]
    markers?: [number, number][]; // [lat, lng][]
    currentLocation?: [number, number] | null;
    recenterKey?: number;
}

function MapUpdater({ center, polygonCoords, markers, currentLocation, recenterKey }: LeafletMapProps) {
    const map = useMap();
    const hasCenteredInitial = React.useRef(false);
    const lastRecenterKey = React.useRef(recenterKey);

    useEffect(() => {
        // Invalidate size on mount and window resize (crucial for mobile layout & orientation changes)
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        const handleResize = () => {
            map.invalidateSize();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [map]);

    // Handle manual re-center triggered by user pressing "Mi Ubicación"
    useEffect(() => {
        if (recenterKey !== undefined && recenterKey !== lastRecenterKey.current) {
            lastRecenterKey.current = recenterKey;
            const target = currentLocation || center;
            if (target) {
                map.setView(target, 18, { animate: true });
            }
        }
    }, [recenterKey, currentLocation, center, map]);

    // Handle bounds and initial one-time centering
    useEffect(() => {
        if (polygonCoords && polygonCoords.length > 0) {
            const bounds = L.latLngBounds(polygonCoords);
            map.fitBounds(bounds, { padding: [30, 30] });
        } else if (markers && markers.length > 1) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
        } else if (!hasCenteredInitial.current && (currentLocation || center)) {
            // Only center ONCE automatically so map doesn't jerk continuously
            hasCenteredInitial.current = true;
            map.setView(currentLocation || center, 18);
        }
    }, [polygonCoords, markers, currentLocation, center, map]);

    return null;
}

export default function LeafletMap({ center, polygonCoords, markers, currentLocation, recenterKey }: LeafletMapProps) {
    // Memoize markers with custom numbered vertex pills
    const markerElements = useMemo(() => {
        if (!markers || markers.length === 0) return null;
        return markers.map((m, i) => {
            const isLast = i === markers.length - 1;
            const icon = getVertexIcon(i + 1, isLast);
            if (!icon) return null;
            return (
                <Marker key={`vertex-${i}-${m[0]}-${m[1]}`} position={m} icon={icon} />
            );
        });
    }, [markers]);

    return (
        <MapContainer
            center={center}
            zoom={18}
            style={{ width: '100%', height: '100%', background: '#082840' }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                crossOrigin="anonymous"
            />

            {polygonCoords && polygonCoords.length > 0 && (
                <Polygon
                    positions={polygonCoords}
                    pathOptions={{ 
                        color: '#83DF9C', 
                        fillColor: '#83DF9C', 
                        fillOpacity: 0.22, 
                        weight: 3.5,
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
                        radius={15} 
                        pathOptions={{ color: '#83DF9C', fillColor: '#83DF9C', fillOpacity: 0.35, weight: 2 }} 
                    />
                    <CircleMarker 
                        center={currentLocation} 
                        radius={6} 
                        pathOptions={{ color: '#ffffff', fillColor: '#0C3C60', fillOpacity: 1, weight: 2.5 }} 
                    />
                </>
            )}

            <MapUpdater center={center} polygonCoords={polygonCoords} markers={markers} currentLocation={currentLocation} recenterKey={recenterKey} />
        </MapContainer>
    );
}
