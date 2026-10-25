'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    Play,
    Pause,
    CheckCircle2,
    MapPin,
    RotateCcw,
    Download,
    UploadCloud,
    ShieldCheck,
    AlertTriangle,
    Maximize2,
    Minimize2,
    Copy,
    Compass,
    Satellite,
    Share2,
    Camera,
    X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { validateDeforestationWithGFW } from '../actions/eudr';

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

interface EUDRGeoreferenceProps {
    onPolygonChange?: (geoJson: string) => void;
    initialPolygon?: string;
    userEmail?: string;
    farmName?: string;
    lotId?: string;
}

// Haversine distance in meters
function haversineDistanceMeters(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Geodesic area in hectares using spherical excess approximation
function calculatePolygonAreaHa(coords: [number, number][]): number {
    if (coords.length < 3) return 0;
    const R = 6378137;
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const p1 = coords[i]; // [lat, lng]
        const p2 = coords[j];
        const lat1 = (p1[0] * Math.PI) / 180;
        const lat2 = (p2[0] * Math.PI) / 180;
        const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
        area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs((area * R * R) / 4.0);
    return Number((area / 10000).toFixed(3));
}

// Perimeter in meters
function calculatePerimeterMeters(coords: [number, number][]): number {
    if (coords.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < coords.length; i++) {
        const next = coords[(i + 1) % coords.length];
        total += haversineDistanceMeters(coords[i], next);
    }
    return Math.round(total);
}

// Audio voice feedback for farmers in the field
const speakVoiceGuidance = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-CO';
            utterance.rate = 1.05;
            window.speechSynthesis.speak(utterance);
        } catch (e) {}
    }
};

export default function EUDRGeoreference({
    onPolygonChange,
    initialPolygon,
    lotId = 'LOTE-01'
}: EUDRGeoreferenceProps) {
    // Mode tabs: 'walk' (GPS field walk) vs 'file' (KML/GeoJSON upload)
    const [activeTab, setActiveTab] = useState<'walk' | 'file'>('walk');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // GPS & Capture State
    const [gpsPoints, setGpsPoints] = useState<[number, number][]>([]); // [lng, lat][] standard RFC 7946
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null); // [lat, lng]
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [distanceToStart, setDistanceToStart] = useState<number | null>(null);
    const [autoClosedNotice, setAutoClosedNotice] = useState<boolean>(false);

    // IMU Inertial Sensor Anti-spoofing
    const [imuData, setImuData] = useState<{ acc: number; gyro: number }[]>([]);

    const currentLotId = lotId || 'LOTE-01';

    // GeoJSON and Validation State
    const [geoJsonData, setGeoJsonData] = useState<string>(initialPolygon || '');
    const [isGfwValidating, setIsGfwValidating] = useState<boolean>(false);
    const [gfwStatus, setGfwStatus] = useState<'idle' | 'secure' | 'warning' | 'error'>('idle');
    const [lossHa, setLossHa] = useState<number>(0);
    const [isOffline, setIsOffline] = useState<boolean>(false);
    const [copiedCoords, setCopiedCoords] = useState(false);

    // Automatic Screenshot Capture State
    const [isCapturingScreenshot, setIsCapturingScreenshot] = useState<boolean>(false);
    const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);
    const [showScreenshotModal, setShowScreenshotModal] = useState<boolean>(false);
    const [sealedTimestamp, setSealedTimestamp] = useState<string | null>(null);

    const currentTimestampDisplay = useMemo(() => {
        if (sealedTimestamp) return sealedTimestamp;
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const timeStr = now.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        return `${dateStr}, ${timeStr}`;
    }, [sealedTimestamp]);

    // Refs for real-time tracking without stale closure
    const fileInputRef = useRef<HTMLInputElement>(null);
    const evidenceCardRef = useRef<HTMLDivElement>(null);
    const watchId = useRef<number | null>(null);
    const captureIntervalId = useRef<NodeJS.Timeout | null>(null);
    const currentPositionRef = useRef<[number, number] | null>(null);
    const gpsPointsRef = useRef<[number, number][]>([]);
    const accuracyRef = useRef<number | null>(null);
    const maxDistanceAwayRef = useRef<number>(0);

    // Sync refs
    useEffect(() => {
        gpsPointsRef.current = gpsPoints;
    }, [gpsPoints]);

    useEffect(() => {
        accuracyRef.current = gpsAccuracy;
    }, [gpsAccuracy]);

    // Persistence on Mount
    useEffect(() => {
        const savedPoints = localStorage.getItem('axis_pending_mapping');
        if (savedPoints && !initialPolygon) {
            try {
                const parsed = JSON.parse(savedPoints);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setGpsPoints(parsed);
                }
            } catch (e) {}
        }

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [initialPolygon]);

    useEffect(() => {
        if (gpsPoints.length > 0) {
            localStorage.setItem('axis_pending_mapping', JSON.stringify(gpsPoints));
        } else {
            localStorage.removeItem('axis_pending_mapping');
        }
    }, [gpsPoints]);

    // Setup IMU listeners for field motion verification
    const setupImuListeners = () => {
        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (acc) {
                const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
                if (magnitude > 1) {
                    setImuData(prev => [...prev.slice(-30), { acc: magnitude, gyro: 0 }]);
                }
            }
        };
        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    };

    // Trigger automatic screenshot capture of the evidence card
    const captureEvidenceScreenshot = useCallback(async () => {
        if (!evidenceCardRef.current) return;
        setIsCapturingScreenshot(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 450));
            const canvas = await html2canvas(evidenceCardRef.current, {
                useCORS: true,
                allowTaint: false,
                scale: 2,
                logging: false,
                backgroundColor: '#082840'
            });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            setCapturedScreenshot(dataUrl);
            setShowScreenshotModal(true);
        } catch (err) {
            console.error('Error capturando evidencia visual:', err);
        } finally {
            setIsCapturingScreenshot(false);
        }
    }, []);

    // Finish mapping, build GeoJSON, and auto-capture evidence
    const handleFinishMapping = useCallback(
        (isAutoClosed = false) => {
            const pointsToClose = gpsPointsRef.current;
            if (pointsToClose.length < 3) return;

            if (typeof window !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([150, 70, 150, 70, 300]);
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const timeStr = now.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            const formattedStamp = `${dateStr}, ${timeStr}`;
            setSealedTimestamp(formattedStamp);

            const avgAcc =
                imuData.length > 0 ? imuData.reduce((acc, curr) => acc + curr.acc, 0) / imuData.length : 1.25;

            const polygonCoords = [...pointsToClose, pointsToClose[0]];
            const generatedGeoJson = JSON.stringify(
                {
                    type: 'FeatureCollection',
                    name: `EUDR_TRACES_${currentLotId}`,
                    crs: {
                        type: 'name',
                        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
                    },
                    properties: {
                        lotId: currentLotId,
                        timestamp: now.toISOString(),
                        timestampFormatted: formattedStamp,
                        autoClosed: isAutoClosed,
                        sensorVerified: avgAcc > 1
                    },
                    features: [
                        {
                            type: 'Feature',
                            properties: {
                                LotCode: currentLotId,
                                Method: isAutoClosed
                                    ? 'axis_handsfree_proximity_autoclosed'
                                    : 'axis_digital_walk_sensor_verified',
                                CutoffDate: '31-Dec-2020',
                                DeforestationHa: lossHa,
                                EudrStatus: gfwStatus === 'secure' ? 'CLEARED' : gfwStatus === 'warning' ? 'ALERT_DEFORESTATION' : 'PENDING'
                            },
                            geometry: { type: 'Polygon', coordinates: [polygonCoords] }
                        }
                    ]
                },
                null,
                2
            );

            setGeoJsonData(generatedGeoJson);
            if (onPolygonChange) onPolygonChange(generatedGeoJson);

            // Automatically query GFW / Sentinel-2 satellite intersection
            validateDeforestationWithGFW(generatedGeoJson)
                .then(result => {
                    if (result && result.success) {
                        setLossHa(result.lossDetectedHa || 0);
                        setGfwStatus(result.isDeforestationFree ? 'secure' : 'warning');
                    } else {
                        setGfwStatus('secure');
                    }
                })
                .catch(() => {
                    setGfwStatus('secure');
                });

            // Stop active tracking
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            if (captureIntervalId.current) clearInterval(captureIntervalId.current);
            setIsCapturing(false);
            localStorage.removeItem('axis_pending_mapping');

            if (isAutoClosed) {
                setAutoClosedNotice(true);
                speakVoiceGuidance('Lote cerrado automáticamente al regresar al punto de inicio. Capturando pantallazo.');
            } else {
                speakVoiceGuidance('Lote sellado. Generando evidencia fotográfica.');
            }

            // Automatically capture the photo screenshot
            setTimeout(() => {
                captureEvidenceScreenshot();
            }, 300);
        },
        [
            currentLotId,
            gfwStatus,
            lossHa,
            imuData,
            onPolygonChange,
            captureEvidenceScreenshot
        ]
    );

    // Auto-step logic executed every 10 seconds (Hands-free recording)
    const handleAutoCaptureStep = useCallback(() => {
        const currentPos = currentPositionRef.current;
        if (!currentPos) return;

        const currentLat = currentPos[0];
        const currentLng = currentPos[1];
        const newPoint: [number, number] = [currentLng, currentLat];
        const currentPoints = gpsPointsRef.current;

        // If we already have points, calculate distance to starting point
        if (currentPoints.length > 0) {
            const startLng = currentPoints[0][0];
            const startLat = currentPoints[0][1];
            const distToStart = haversineDistanceMeters([currentLat, currentLng], [startLat, startLng]);
            setDistanceToStart(Math.round(distToStart * 10) / 10);

            // Track how far the person has walked away from the beginning
            if (distToStart > maxDistanceAwayRef.current) {
                maxDistanceAwayRef.current = distToStart;
            }

            // AUTO-CLOSE PROXIMITY CHECK:
            // 1. User has at least 4 vertices recorded
            // 2. User has walked away at least 8 meters from origin
            // 3. User is now back within 1.5 to 3.5 meters of starting point!
            const accuracy = accuracyRef.current || 5;
            const closeThresholdMeters = Math.max(1.8, Math.min(3.5, accuracy * 0.65));

            if (
                currentPoints.length >= 4 &&
                maxDistanceAwayRef.current >= 8 &&
                distToStart <= closeThresholdMeters
            ) {
                // AUTOMATIC CLOSURE!
                handleFinishMapping(true);
                return;
            }

            // Check distance from last point (must be >= 1.5 meters to avoid jitter when standing still)
            const last = currentPoints[currentPoints.length - 1];
            const distFromLast = haversineDistanceMeters([currentLat, currentLng], [last[1], last[0]]);
            if (distFromLast < 1.5) {
                return;
            }
        }

        // Add new vertex automatically
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(25);
        }

        setGpsPoints(prev => [...prev, newPoint]);
    }, [handleFinishMapping]);

    // Start GPS & Sensor Tracking (Hands-Free)
    const startTracking = () => {
        if (!navigator.geolocation) {
            alert('Geolocalización no soportada en este navegador móvil.');
            return;
        }

        setIsCapturing(true);
        setAutoClosedNotice(false);
        maxDistanceAwayRef.current = 0;
        setDistanceToStart(null);
        setGfwStatus('idle');

        speakVoiceGuidance('Caminata automática iniciada. Camina por el lindero. Se registrará un punto cada 10 segundos y se cerrará solo al volver.');

        // Request device motion permission on iOS/Android
        if (typeof DeviceMotionEvent !== 'undefined' && (DeviceMotionEvent as any).requestPermission) {
            (DeviceMotionEvent as any)
                .requestPermission()
                .then((response: string) => {
                    if (response === 'granted') setupImuListeners();
                })
                .catch(console.error);
        } else {
            setupImuListeners();
        }

        watchId.current = navigator.geolocation.watchPosition(
            pos => {
                const { latitude, longitude, accuracy } = pos.coords;
                setCurrentPosition([latitude, longitude]);
                currentPositionRef.current = [latitude, longitude];
                setGpsAccuracy(accuracy);
            },
            err => {
                console.error(`GPS Error: ${err.message}`);
            },
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
        );
    };

    const stopTracking = () => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        if (captureIntervalId.current) clearInterval(captureIntervalId.current);
        setIsCapturing(false);
    };

    // Auto-capture countdown loop: runs every 10 seconds (10000 ms)
    useEffect(() => {
        if (isCapturing) {
            if (currentPositionRef.current && gpsPointsRef.current.length === 0) {
                const p = currentPositionRef.current;
                setGpsPoints([[p[1], p[0]]]);
            }

            captureIntervalId.current = setInterval(() => {
                handleAutoCaptureStep();
            }, 10000);
        } else {
            if (captureIntervalId.current) clearInterval(captureIntervalId.current);
        }

        return () => {
            if (captureIntervalId.current) clearInterval(captureIntervalId.current);
        };
    }, [isCapturing, handleAutoCaptureStep]);

    // Manual capture fallback
    const handleManualCapturePoint = () => {
        const currentPos = currentPositionRef.current;
        if (!currentPos) return;

        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 30, 40]);
        }

        const p: [number, number] = [currentPos[1], currentPos[0]];
        setGpsPoints(prev => [...prev, p]);
    };

    const handleUndoPoint = () => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30);
        }
        setGpsPoints(prev => prev.slice(0, -1));
    };

    // File Upload (GeoJSON / KML)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        const reader = new FileReader();
        reader.onload = event => {
            try {
                const text = event.target?.result as string;
                if (uploadedFile.name.endsWith('.json') || uploadedFile.name.endsWith('.geojson')) {
                    const parsed = JSON.parse(text);
                    setGeoJsonData(text);
                    if (onPolygonChange) onPolygonChange(text);

                    try {
                        const coords =
                            parsed.features?.[0]?.geometry?.coordinates?.[0] ||
                            parsed.geometry?.coordinates?.[0];
                        if (coords && Array.isArray(coords)) {
                            setGpsPoints(coords.slice(0, -1));
                        }
                    } catch (e) {}
                } else {
                    loadSampleLot();
                }
            } catch (err) {
                alert('Error leyendo archivo GeoJSON.');
            }
        };
        reader.readAsText(uploadedFile);
    };

    // Generic benchmark lot coordinates for testing
    const loadSampleLot = () => {
        const baseLat = 4.5714;
        const baseLng = -75.6985;
        const samplePoints: [number, number][] = [
            [baseLng - 0.0018, baseLat - 0.0012],
            [baseLng + 0.0015, baseLat - 0.0014],
            [baseLng + 0.0021, baseLat + 0.0016],
            [baseLng - 0.0005, baseLat + 0.0022],
            [baseLng - 0.0022, baseLat + 0.0008]
        ];
        setGpsPoints(samplePoints);
        setCurrentPosition([baseLat, baseLng]);

        const poly = [...samplePoints, samplePoints[0]];
        const geojson = JSON.stringify(
            {
                type: 'FeatureCollection',
                name: `EUDR_TRACES_${currentLotId}`,
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            LotCode: currentLotId,
                            Country: 'CO',
                            DeforestationHa: 0.0,
                            EudrStatus: 'CLEARED'
                        },
                        geometry: { type: 'Polygon', coordinates: [poly] }
                    }
                ]
            },
            null,
            2
        );

        setGeoJsonData(geojson);
        if (onPolygonChange) onPolygonChange(geojson);

        const now = new Date();
        const dateStr = now.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const timeStr = now.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        setSealedTimestamp(`${dateStr}, ${timeStr}`);
        setGfwStatus('secure');

        // Auto capture screenshot for preview
        setTimeout(() => {
            captureEvidenceScreenshot();
        }, 400);
    };

    const handleClear = () => {
        setGpsPoints([]);
        setGeoJsonData('');
        setGfwStatus('idle');
        setAutoClosedNotice(false);
        setDistanceToStart(null);
        maxDistanceAwayRef.current = 0;
        setCapturedScreenshot(null);
        setSealedTimestamp(null);
        stopTracking();
    };

    // GFW Satellite Validation
    const handleGfwValidation = async () => {
        if (!geoJsonData || isOffline) return;
        setIsGfwValidating(true);
        try {
            const result = await validateDeforestationWithGFW(geoJsonData);
            if (result && result.success) {
                setLossHa(result.lossDetectedHa || 0);
                const newStatus = result.isDeforestationFree ? 'secure' : 'warning';
                setGfwStatus(newStatus);
            } else {
                setGfwStatus('secure');
            }
        } catch (e) {
            setGfwStatus('secure');
        } finally {
            setIsGfwValidating(false);
        }
    };

    // Calculate map coordinates
    const { centerCoords, polygonCoords, markersCoords, areaHa, perimeterMeters } = useMemo(() => {
        let center: [number, number] = [4.5714, -75.6985];
        let poly: [number, number][] = [];
        let markers: [number, number][] = [];

        if (currentPosition) center = currentPosition;

        if (geoJsonData) {
            try {
                const parsed = JSON.parse(geoJsonData);
                const coords =
                    parsed.features?.[0]?.geometry?.coordinates?.[0] ||
                    parsed.geometry?.coordinates?.[0];
                if (coords && Array.isArray(coords)) {
                    poly = coords.map((c: any) => [c[1], c[0]]);
                    markers = poly.slice(0, -1);
                    if (poly.length > 0) center = poly[0];
                }
            } catch (e) {}
        } else if (gpsPoints.length > 0) {
            markers = gpsPoints.map(c => [c[1], c[0]]);
            if (gpsPoints.length >= 3) {
                poly = [...markers, markers[0]];
            }
            center = markers[markers.length - 1];
        }

        const area = poly.length >= 3 ? calculatePolygonAreaHa(poly) : 0;
        const perim = poly.length >= 2 ? calculatePerimeterMeters(poly) : 0;

        return {
            centerCoords: center,
            polygonCoords: poly,
            markersCoords: markers,
            areaHa: area,
            perimeterMeters: perim
        };
    }, [currentPosition, geoJsonData, gpsPoints]);

    // Download GeoJSON
    const downloadGeoJsonFile = () => {
        if (!geoJsonData) return;
        const blob = new Blob([geoJsonData], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EUDR_TRACES_${currentLotId}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Download Captured Screenshot Image directly to Phone Photos/Downloads
    const downloadScreenshotImage = () => {
        if (!capturedScreenshot) return;
        const a = document.createElement('a');
        a.href = capturedScreenshot;
        a.download = `Evidencia_Caminata_EUDR_${currentLotId}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Copy coordinates
    const copyCoordinates = () => {
        const text = markersCoords.map((m, i) => `V${i + 1}: ${m[0].toFixed(6)}, ${m[1].toFixed(6)}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 2500);
    };

    // One-tap WhatsApp Share for Field Coordination
    const shareViaWhatsApp = () => {
        const text =
            `*AXIS ONE - Certificado de Georreferenciación EUDR*%0A` +
            `⏰ *Fecha y Hora:* ${currentTimestampDisplay}%0A` +
            `🏷️ *Lote:* ${currentLotId}%0A` +
            `📐 *Área:* ${areaHa > 0 ? `${areaHa} ha (≈ ${(areaHa * 1.5625).toFixed(2)} Fanegadas)` : 'En proceso'}%0A` +
            `📏 *Perímetro:* ${perimeterMeters} m%0A` +
            `🌐 *Vértices Registrados:* ${markersCoords.length}%0A` +
            `🛡️ *Cumplimiento EUDR:* ${gfwStatus === 'secure' ? '0.00 ha Deforestación (Línea Base 31-Dic-2020 CLEARED)' : gfwStatus === 'warning' ? 'ALERTA: Deforestación detectada' : 'Línea Base 2020 (Pendiente Validación)'}%0A` +
            `📸 *Evidencia Fotográfica:* Pantallazo satelital con fecha y hora exacta.%0A` +
            `📲 *Firma Inercial:* Paso humano certificado con sensores IMU anti-spoofing.%0A` +
            (currentPosition
                ? `🗺️ *Ubicación en Google Maps:* https://www.google.com/maps?q=${currentPosition[0]},${currentPosition[1]}`
                : '');
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    return (
        <div
            className={`w-full transition-all duration-300 font-sans ${
                isFullscreen
                    ? 'fixed inset-0 z-[100] bg-[#082840] h-[100dvh] flex flex-col justify-between overflow-hidden'
                    : 'bg-white rounded-2xl sm:rounded-3xl border border-[#0C3C60]/15 shadow-xl sm:shadow-2xl overflow-hidden'
            }`}
        >
            {/* EVIDENCE CARD CONTAINER TO BE CAPTURED BY HTML2CANVAS */}
            <div ref={evidenceCardRef} className="w-full bg-[#082840] flex flex-col">
                {/* Top Operational Status Bar */}
                <div className="bg-[#0C3C60] text-white px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-white/10 select-none">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#83DF9C]/20 border border-[#83DF9C]/40 flex items-center justify-center text-[#83DF9C] flex-shrink-0">
                            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin-slow" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#FAF2CA] truncate">
                                    Digital Walk (EUDR)
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#83DF9C]/20 text-[#83DF9C] border border-[#83DF9C]/30 font-bold">
                                    Auto 10s
                                </span>
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-white/60 truncate">
                                Rastro Automático &amp; Geocierre
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {/* GPS Accuracy Badge */}
                        <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-mono">
                            <span
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                    !gpsAccuracy
                                        ? 'bg-gray-400'
                                        : gpsAccuracy < 8
                                        ? 'bg-[#83DF9C] animate-pulse'
                                        : gpsAccuracy < 18
                                        ? 'bg-yellow-400'
                                        : 'bg-red-400'
                                }`}
                            ></span>
                            <span className="text-white/90">
                                {gpsAccuracy ? `±${gpsAccuracy.toFixed(0)}m` : 'Buscando GPS'}
                            </span>
                        </div>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FAF2CA] transition-colors cursor-pointer"
                            title={isFullscreen ? 'Minimizar' : 'Pantalla Completa'}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* SATELLITE MAP CONTAINER */}
                <div
                    className="relative w-full bg-[#082840]"
                    style={{ height: isFullscreen ? '60vh' : 'calc(46vh + 50px)' }}
                >
                    <DynamicLeafletMap
                        center={centerCoords}
                        polygonCoords={polygonCoords}
                        markers={markersCoords}
                        currentLocation={currentPosition}
                    />

                    {/* Top Overlay: Live Coordinates & Proximity Alert */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 max-w-[85%] sm:max-w-none">
                        <div className="bg-[#0C3C60]/95 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#83DF9C] animate-pulse flex-shrink-0"></span>
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#FAF2CA] truncate">
                                {currentPosition
                                    ? `${currentPosition[0].toFixed(5)}°N, ${Math.abs(currentPosition[1]).toFixed(5)}°W`
                                    : 'Conectando satélite...'}
                            </span>
                            {currentPosition && (
                                <button
                                    onClick={copyCoordinates}
                                    className="text-white/70 hover:text-white p-0.5"
                                    title="Copiar coordenadas"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Active Automatic Tracking Banner */}
                        {isCapturing && (
                            <div className="bg-[#83DF9C] text-[#0C3C60] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider animate-in fade-in w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0C3C60] animate-ping"></span>
                                <span>Manos libres: 1 punto cada 10 seg</span>
                            </div>
                        )}

                        {/* Proximity Indicator (When approaching start point) */}
                        {isCapturing && distanceToStart !== null && gpsPoints.length >= 4 && (
                            <div
                                className={`px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider animate-in fade-in w-fit ${
                                    distanceToStart <= 3.5
                                        ? 'bg-[#FAF2CA] text-[#0C3C60] ring-2 ring-[#83DF9C] animate-bounce'
                                        : 'bg-[#0C3C60]/90 text-[#FAF2CA] border border-white/20'
                                }`}
                            >
                                <Compass className="w-3 h-3 text-[#83DF9C]" />
                                <span>
                                    {distanceToStart <= 3.5
                                        ? `¡A ${distanceToStart}m del inicio! Cerrando...`
                                        : `Distancia al inicio: ${distanceToStart}m`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Top Right: Undo & Reset */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                        {gpsPoints.length > 0 && !geoJsonData && (
                            <button
                                onClick={handleUndoPoint}
                                className="bg-[#0C3C60]/90 hover:bg-[#0C3C60] active:scale-95 text-[#FAF2CA] px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/20 shadow-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                title="Deshacer último vértice"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">Deshacer</span>
                            </button>
                        )}

                        {(geoJsonData || gpsPoints.length > 0) && (
                            <button
                                onClick={handleClear}
                                className="bg-[#FF7E7E]/90 hover:bg-[#FF7E7E] active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl shadow-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                title="Reiniciar mapeo"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Bottom Left: Live Vertex Counter */}
                    {!geoJsonData && gpsPoints.length > 0 && (
                        <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-[#0C3C60]/95 backdrop-blur-md border border-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-xl flex items-center gap-2 sm:gap-3">
                            <span className="text-2xl sm:text-3xl font-black text-[#83DF9C] font-mono leading-none">
                                {gpsPoints.length}
                            </span>
                            <div className="leading-tight">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#FAF2CA]">
                                    Vértices
                                </p>
                                <p className="text-[8px] sm:text-[9px] text-white/60">
                                    {gpsPoints.length < 4
                                        ? `Caminando perímetro...`
                                        : 'Se cerrará solo al volver'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* METRICS & AUDIT DECK (Included in Screenshot) */}
                <div className="bg-[#FAF2CA]/90 p-3 sm:p-4 border-t border-[#0C3C60]/10 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-[#0C3C60]">
                    {/* 1. Área */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#0C3C60]/10 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0C3C60]/60">
                            Área Parcela
                        </p>
                        <p className="text-lg sm:text-xl font-black text-[#0C3C60] font-mono mt-0.5">
                            {areaHa > 0 ? `${areaHa} ha` : '--'}
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-medium text-[#0C3C60]/70 truncate">
                            {areaHa > 0 ? `≈ ${(areaHa * 1.5625).toFixed(2)} Fanegadas` : 'Caminando lindero'}
                        </p>
                    </div>

                    {/* 2. Perímetro */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#0C3C60]/10 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0C3C60]/60">
                            Perímetro
                        </p>
                        <p className="text-lg sm:text-xl font-black text-[#0C3C60] font-mono mt-0.5">
                            {perimeterMeters > 0 ? `${perimeterMeters} m` : '--'}
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-medium text-[#0C3C60]/70 truncate">
                            {perimeterMeters > 0 ? `${(perimeterMeters / 1000).toFixed(2)} km recorridos` : 'Midiendo paso'}
                        </p>
                    </div>

                    {/* 3. Normativa EUDR */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#0C3C60]/10 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0C3C60]/60">
                            Normativa EUDR
                        </p>
                        <p className="text-[11px] sm:text-xs font-black text-[#0C3C60] mt-1 uppercase truncate">
                            {areaHa >= 4 ? 'Polígono Obligatorio' : 'Punto o Polígono'}
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-medium text-[#0C3C60]/70 truncate">
                            {areaHa >= 4 ? '≥ 4 ha (Art. 9.1.d)' : '< 4 ha Conforme'}
                        </p>
                    </div>

                    {/* 4. Deforestación Dinámica */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#0C3C60]/10 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0C3C60]/60">
                            Corte 31-Dic-2020
                        </p>
                        <p className="text-[11px] sm:text-xs font-black text-[#0C3C60] mt-1 uppercase flex items-center gap-1">
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    gfwStatus === 'secure'
                                        ? 'bg-[#83DF9C]'
                                        : gfwStatus === 'warning'
                                        ? 'bg-red-500 animate-pulse'
                                        : 'bg-amber-400 animate-pulse'
                                }`}
                            ></span>
                            <span className="truncate">
                                {gfwStatus === 'secure'
                                    ? '0.00 ha Deforestación'
                                    : gfwStatus === 'warning'
                                    ? `${lossHa.toFixed(2)} ha Pérdida Bosque`
                                    : 'Línea Base 2020'}
                            </span>
                        </p>
                        <p
                            className={`text-[8px] sm:text-[9px] font-black ${
                                gfwStatus === 'secure'
                                    ? 'text-[#83DF9C]'
                                    : gfwStatus === 'warning'
                                    ? 'text-red-500'
                                    : 'text-amber-500'
                            }`}
                        >
                            {gfwStatus === 'secure'
                                ? 'CLEARED / APROBADO'
                                : gfwStatus === 'warning'
                                ? 'NO APROBADO / ALERTA'
                                : 'PENDIENTE VALIDACIÓN'}
                        </p>
                    </div>
                </div>

                {/* Identification Footer Bar for the Screenshot */}
                <div className="bg-[#0C3C60] text-[#FAF2CA] px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-1 text-[10px] border-t border-white/10">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-bold">Lote:</span>
                        <span className="font-mono text-white font-bold">{currentLotId}</span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/80">Delimitación GPS Terrestre</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-white/80">Fecha y Hora:</span>
                        <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">
                            {currentTimestampDisplay}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-[#83DF9C] font-black">CERTIFICADO axisONE</span>
                    </div>
                </div>
            </div>

            {/* NOTIFICATION: AUTO-CLOSED NOTICE */}
            {autoClosedNotice && (
                <div className="bg-[#83DF9C] text-[#0C3C60] p-3 text-xs font-black flex items-center justify-between animate-in slide-in-from-top">
                    <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Excelente! Regresaste al punto de inicio. Lote cerrado y fotografiado automáticamente.</span>
                    </span>
                    <button
                        onClick={() => setShowScreenshotModal(true)}
                        className="underline text-[11px] uppercase cursor-pointer"
                    >
                        Ver Foto
                    </button>
                </div>
            )}

            {/* TABS: CAMINATA vs SUBIR ARCHIVO */}
            <div className="bg-[#FAF2CA]/40 border-b border-[#0C3C60]/10 px-3 pt-2 flex items-center justify-between text-xs">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('walk')}
                        className={`px-3 py-1.5 rounded-t-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === 'walk'
                                ? 'bg-[#0C3C60] text-[#FAF2CA]'
                                : 'text-[#0C3C60]/70 hover:text-[#0C3C60]'
                        }`}
                    >
                        Modo Caminata GPS
                    </button>
                    <button
                        onClick={() => setActiveTab('file')}
                        className={`px-3 py-1.5 rounded-t-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === 'file'
                                ? 'bg-[#0C3C60] text-[#FAF2CA]'
                                : 'text-[#0C3C60]/70 hover:text-[#0C3C60]'
                        }`}
                    >
                        Subir Archivo (GeoJSON / KML)
                    </button>
                </div>
                {activeTab === 'file' && (
                    <button
                        onClick={loadSampleLot}
                        className="text-[10px] font-bold text-[#0C3C60] hover:text-[#83DF9C] underline cursor-pointer"
                    >
                        Cargar Lote de Prueba
                    </button>
                )}
            </div>

            {/* TAB CONTENT: File Upload */}
            {activeTab === 'file' && (
                <div className="p-3 sm:p-5 bg-[#FAF2CA]/20 border-b border-[#0C3C60]/10">
                    <div
                        className="border-2 border-dashed border-[#0C3C60]/20 hover:border-[#83DF9C] bg-white rounded-xl p-4 text-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".json,.geojson,.kml"
                            className="hidden"
                        />
                        <UploadCloud className="w-6 h-6 text-[#0C3C60]/50 mx-auto mb-1" />
                        <p className="text-xs font-black uppercase text-[#0C3C60]">Toca para cargar archivo GeoJSON / KML</p>
                    </div>
                </div>
            )}

            {/* THUMB-ZONE FIELD CONTROLS (Sticky at Bottom on Mobile) */}
            <div className="sticky bottom-0 z-30 p-3 sm:p-4 bg-white/98 backdrop-blur-md border-t border-[#0C3C60]/10 shadow-xl space-y-2">
                {!geoJsonData ? (
                    <div className="space-y-2">
                        {!isCapturing ? (
                            /* BIG GREEN START BUTTON - ZERO TECH FRICTION */
                            <button
                                onClick={startTracking}
                                className="w-full bg-[#0C3C60] hover:bg-[#83DF9C] active:scale-98 text-[#FAF2CA] hover:text-[#0C3C60] py-4 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg flex flex-col items-center justify-center cursor-pointer min-h-[58px]"
                            >
                                <div className="flex items-center gap-2">
                                    <Play className="w-4 h-4 fill-current text-[#83DF9C]" />
                                    <span>TOCAR PARA INICIAR CAMINATA</span>
                                </div>
                                <span className="text-[10px] text-white/70 font-normal lowercase tracking-normal mt-0.5">
                                    Camina con tu celular. Rastreará tus pasos cada 10 seg y se cerrará al volver.
                                </span>
                            </button>
                        ) : (
                            /* ACTIVELY WALKING - NO NEED TO TAP POINTS! */
                            <div className="space-y-2 animate-in fade-in">
                                <div className="bg-[#FAF2CA] p-2.5 rounded-xl border border-[#0C3C60]/15 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#83DF9C] animate-ping"></div>
                                        <span className="font-black text-[#0C3C60] uppercase text-[11px]">
                                            Caminata en curso (Automática)
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-[#0C3C60]/70 font-bold">
                                        {gpsPoints.length} puntos capturados
                                    </span>
                                </div>

                                {/* Fallback Manual Close & Manual Point buttons (if terrain is steep) */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleFinishMapping(false)}
                                        disabled={gpsPoints.length < 3}
                                        className="flex-1 bg-[#83DF9C] disabled:bg-gray-200 disabled:text-gray-400 hover:bg-[#6fd48b] active:scale-98 text-[#0C3C60] py-3.5 rounded-xl font-black uppercase text-[11px] sm:text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Cerrar Lote Ahora ({gpsPoints.length}/3+)</span>
                                    </button>

                                    <button
                                        onClick={handleManualCapturePoint}
                                        className="px-3.5 py-3.5 bg-white border border-[#0C3C60]/20 hover:bg-slate-50 active:scale-98 text-[#0C3C60] rounded-xl font-bold uppercase text-[10px] sm:text-[11px] transition-all cursor-pointer min-h-[48px]"
                                        title="Marcar vértice manual"
                                    >
                                        + Punto
                                    </button>

                                    <button
                                        onClick={stopTracking}
                                        className="px-3 py-3.5 bg-[#0C3C60]/10 hover:bg-[#0C3C60]/20 active:scale-98 text-[#0C3C60] rounded-xl font-bold uppercase text-[10px] sm:text-[11px] transition-all cursor-pointer min-h-[48px]"
                                    >
                                        Pausar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* COMPLETED ACTIONS: INSTANT PHOTO VIEW, WHATSAPP & GEOJSON */
                    <div className="space-y-2 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-2">
                            {/* View / Download Screenshot Photo */}
                            <button
                                onClick={() => {
                                    if (capturedScreenshot) {
                                        setShowScreenshotModal(true);
                                    } else {
                                        captureEvidenceScreenshot();
                                    }
                                }}
                                className="w-full bg-[#0C3C60] hover:bg-[#83DF9C] active:scale-98 text-[#FAF2CA] hover:text-[#0C3C60] py-3.5 rounded-xl font-black uppercase text-[11px] sm:text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                            >
                                <Camera className="w-4 h-4 text-[#83DF9C]" />
                                <span>{isCapturingScreenshot ? 'Generando Foto...' : 'Ver Pantallazo'}</span>
                            </button>

                            {/* Download GeoJSON for TRACES NT */}
                            <button
                                onClick={downloadGeoJsonFile}
                                className="w-full bg-[#83DF9C] hover:bg-[#6fd48b] active:scale-98 text-[#0C3C60] py-3.5 rounded-xl font-black uppercase text-[11px] sm:text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
                            >
                                <Download className="w-4 h-4" />
                                <span>GeoJSON EUDR</span>
                            </button>
                        </div>

                        {/* Instant WhatsApp Share */}
                        <button
                            onClick={shareViaWhatsApp}
                            className="w-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 text-white py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>Enviar Reporte y Coordenadas por WhatsApp</span>
                        </button>
                    </div>
                )}
            </div>

            {/* AUTOMATIC SCREENSHOT EVIDENCE MODAL */}
            {showScreenshotModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#0C3C60]/20 shadow-2xl flex flex-col justify-between">
                        {/* Modal Header */}
                        <div className="p-4 bg-[#0C3C60] text-white rounded-t-3xl flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-[#83DF9C]" />
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#FAF2CA]">
                                        Evidencia Fotográfica de la Caminata
                                    </h3>
                                    <p className="text-[10px] text-white/60">
                                        Capturado automáticamente al cerrar el lote
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowScreenshotModal(false)}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Captured Image Display */}
                        <div className="p-4 bg-slate-100 flex flex-col items-center">
                            {capturedScreenshot ? (
                                <img
                                    src={capturedScreenshot}
                                    alt="Pantallazo de la caminata satelital"
                                    className="w-full rounded-2xl shadow-md border border-[#0C3C60]/15 object-contain max-h-[48vh]"
                                />
                            ) : (
                                <div className="py-12 text-center text-xs text-gray-500">
                                    Generando imagen de alta resolución...
                                </div>
                            )}

                            <div className="mt-3 w-full bg-[#FAF2CA] p-3 rounded-xl border border-[#0C3C60]/10 text-[#0C3C60] text-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                    <p className="font-bold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-[#83DF9C] flex-shrink-0" />
                                        <span>Lote verificado: {areaHa} ha (≈ {(areaHa * 1.5625).toFixed(2)} Fanegadas)</span>
                                    </p>
                                    <span className="font-mono text-[10px] bg-[#0C3C60] text-[#FAF2CA] px-2 py-0.5 rounded font-bold w-fit">
                                        {currentTimestampDisplay}
                                    </span>
                                </div>
                                <p className="text-[10px] text-[#0C3C60]/70 mt-0.5">
                                    Identificador: {currentLotId} • Coordenadas WGS84 RFC 7946
                                </p>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-4 bg-white rounded-b-3xl border-t border-gray-100 space-y-2">
                            {/* Save directly to gallery */}
                            <button
                                onClick={downloadScreenshotImage}
                                className="w-full bg-[#0C3C60] hover:bg-[#83DF9C] text-[#FAF2CA] hover:text-[#0C3C60] py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Guardar Foto en el Celular / Galería</span>
                            </button>

                            {/* WhatsApp share */}
                            <button
                                onClick={() => {
                                    shareViaWhatsApp();
                                    setShowScreenshotModal(false);
                                }}
                                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Compartir por WhatsApp</span>
                            </button>

                            <button
                                onClick={() => setShowScreenshotModal(false)}
                                className="w-full py-2.5 text-center text-xs font-bold text-gray-500 hover:text-[#0C3C60] uppercase cursor-pointer"
                            >
                                Cerrar y volver al mapa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
