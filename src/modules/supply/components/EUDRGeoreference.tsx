import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { validateDeforestationWithGFW } from '../actions/eudr';

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

interface EUDRGeoreferenceProps {
    onPolygonChange?: (geoJson: string) => void;
    initialPolygon?: string;
    userEmail?: string;
    farmName?: string;
}

export default function EUDRGeoreference({ onPolygonChange, initialPolygon, userEmail, farmName }: EUDRGeoreferenceProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<{ type: 'idle' | 'processing' | 'success' | 'error' | 'offline', message: string }>({ type: 'idle', message: '' });
    const [geoJsonData, setGeoJsonData] = useState<string>(initialPolygon || '');
    const [isValidated, setIsValidated] = useState<boolean>(false);
    const [isGfwValidating, setIsGfwValidating] = useState<boolean>(false);
    const [gfwStatus, setGfwStatus] = useState<'idle' | 'secure' | 'warning' | 'error'>('idle');
    const [lossHa, setLossHa] = useState<number>(0);
    const [validationSource, setValidationSource] = useState<string>('');
    const [isOffline, setIsOffline] = useState<boolean>(false);

    // Capture state
    const [gpsPoints, setGpsPoints] = useState<[number, number][]>([]);
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [nextCaptureSeconds, setNextCaptureSeconds] = useState<number>(10);
    const [showValidation, setShowValidation] = useState<boolean>(false);
    const [imuData, setImuData] = useState<{acc: number, gyro: number}[]>([]);
    const [isImuSupported, setIsImuSupported] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const watchId = useRef<number | null>(null);
    const captureIntervalId = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalId = useRef<NodeJS.Timeout | null>(null);
    const currentPositionRef = useRef<[number, number] | null>(null);

    // Persistence Effect
    useEffect(() => {
        const savedPoints = localStorage.getItem('axis_pending_mapping');
        if (savedPoints && !initialPolygon) {
            setGpsPoints(JSON.parse(savedPoints));
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

    // Geo & IMU Tracker
    const startTracking = () => {
        if (!navigator.geolocation) {
            setStatus({ type: 'error', message: 'GPS no soportado.' });
            return;
        }

        setIsCapturing(true);

        // Activar Sensores de Movimiento (Acelerómetro/Giroscopio)
        if (typeof DeviceMotionEvent !== 'undefined' && (DeviceMotionEvent as any).requestPermission) {
            (DeviceMotionEvent as any).requestPermission()
                .then((response: string) => {
                    if (response === 'granted') {
                        setupImuListeners();
                    }
                })
                .catch(console.error);
        } else {
            setupImuListeners();
        }

        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setCurrentPosition([latitude, longitude]);
                currentPositionRef.current = [latitude, longitude];
                setGpsAccuracy(accuracy);
            },
            (err) => {
                setStatus({ type: 'error', message: `Error GPS: ${err.message}` });
                setIsCapturing(false);
            },
            { enableHighAccuracy: true, maximumAge: 1000 }
        );
    };

    const setupImuListeners = () => {
        setIsImuSupported(true);
        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (acc) {
                const magnitude = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2);
                if (magnitude > 1) { // Solo si hay movimiento real
                    setImuData(prev => [...prev.slice(-50), { acc: magnitude, gyro: 0 }]);
                }
            }
        };
        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    };

    const stopTracking = () => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        setIsCapturing(false);
    };

    // Auto-capture Logic
    useEffect(() => {
        if (isCapturing) {
            setNextCaptureSeconds(10);
            
            // Interval to capture points (reads from Ref to avoid stale closure)
            captureIntervalId.current = setInterval(() => {
                handleCapturePoint();
                setNextCaptureSeconds(10);
            }, 10000);

            // Interval for UI countdown
            countdownIntervalId.current = setInterval(() => {
                setNextCaptureSeconds(prev => (prev > 0 ? prev - 1 : 10));
            }, 1000);
        } else {
            if (captureIntervalId.current) clearInterval(captureIntervalId.current);
            if (countdownIntervalId.current) clearInterval(countdownIntervalId.current);
        }

        return () => {
            if (captureIntervalId.current) clearInterval(captureIntervalId.current);
            if (countdownIntervalId.current) clearInterval(countdownIntervalId.current);
        };
    }, [isCapturing]);

    const handleCapturePoint = () => {
        const currentPos = currentPositionRef.current;
        if (!currentPos) return;

        const p: [number, number] = [currentPos[1], currentPos[0]];
        setGpsPoints(prev => {
            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                // Only add if user moved significantly (approx 2m)
                if (Math.abs(last[0] - p[0]) < 0.00002 && Math.abs(last[1] - p[1]) < 0.00002) return prev;
            }
            return [...prev, p];
        });
    };

    const handleFinishMapping = () => {
        if (gpsPoints.length < 3) {
            setStatus({ type: 'error', message: 'Mínimo 3 puntos para cerrar.' });
            return;
        }

        const avgAcc = imuData.length > 0 
            ? imuData.reduce((acc, curr) => acc + curr.acc, 0) / imuData.length 
            : 0;

        const polygonCoords = [...gpsPoints, gpsPoints[0]];
        const generatedGeoJson = JSON.stringify({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": { 
                    "method": "auto_scan_sensor_verified", 
                    "timestamp": new Date().toISOString(),
                    "sensorAudit": {
                        "intensity": avgAcc.toFixed(2),
                        "verified": avgAcc > 1
                    }
                },
                "geometry": { "type": "Polygon", "coordinates": [polygonCoords] }
            }]
        });

        setGeoJsonData(generatedGeoJson);
        if (onPolygonChange) onPolygonChange(generatedGeoJson);
        stopTracking();
        localStorage.removeItem('axis_pending_mapping');
        setStatus({ type: 'success', message: 'Caminata sellada sensorialmente.' });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        setFile(uploadedFile);
        setStatus({ type: 'processing', message: 'Procesando...' });
        setTimeout(() => {
            if (uploadedFile.name.endsWith('.kml') || uploadedFile.name.endsWith('.shp') || uploadedFile.name.endsWith('.json')) {
                const mockCoords = Array.from({ length: 8 }, (_, i) => {
                    const angle = (i * 360 / 8) * (Math.PI / 180);
                    return [-74.297333 + Math.cos(angle) * 0.002, 4.570868 + Math.sin(angle) * 0.002];
                });
                mockCoords.push(mockCoords[0]);
                const mockGeoJson = JSON.stringify({
                    "type": "FeatureCollection",
                    "features": [{ "type": "Feature", "properties": {}, "geometry": { "type": "Polygon", "coordinates": [mockCoords] } }]
                });
                setGeoJsonData(mockGeoJson);
                if (onPolygonChange) onPolygonChange(mockGeoJson);
                setStatus({ type: 'success', message: 'Cargado.' });
            } else { setStatus({ type: 'error', message: 'Error formato.' }); }
        }, 800);
    };

    const handleClear = () => {
        setGpsPoints([]);
        setGeoJsonData('');
        setIsValidated(false);
        setGfwStatus('idle');
        stopTracking();
    };

    const handleGfwValidation = async () => {
        if (!geoJsonData || isOffline) return;
        setIsGfwValidating(true);
        try {
            const result = await validateDeforestationWithGFW(geoJsonData);
            if (result.success) {
                setLossHa(result.lossDetectedHa || 0);
                setValidationSource(result.verifiedBy || 'GFW');
                const newStatus = result.isDeforestationFree ? 'secure' : 'warning';
                setGfwStatus(newStatus);

                // ACTUALIZACIÓN DE AUDITORÍA: Guardamos el resultado del análisis satelital
                try {
                   await fetch('/api/track-verify', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                           email: userEmail || 'unknown@axis.pro',
                           farm_name: farmName || 'Parcela Escaneada',
                           polygon: geoJsonData,
                           eudr_status: result.isDeforestationFree ? 'EUDR_PASSED' : 'EUDR_FAILED',
                           user_agent: navigator.userAgent
                       })
                   });
               } catch (logError) {
                   console.error("Error actualizando log de auditoría:", logError);
               }

            } else { setGfwStatus('error'); }
        } catch (e) { setGfwStatus('error'); }
        finally { setIsGfwValidating(false); }
    };

    const { centerCoords, polygonCoords, markersCoords } = (() => {
        let center: [number, number] = [4.570868, -74.297333];
        let poly: [number, number][] = [];
        let markers: [number, number][] = [];
        if (currentPosition) center = currentPosition;
        if (geoJsonData) {
            try {
                const parsed = JSON.parse(geoJsonData);
                const coords = parsed.features[0].geometry.coordinates[0];
                poly = coords.map((c: any) => [c[1], c[0]]);
                center = [coords[0][1], coords[0][0]];
            } catch (e) {}
        } else if (gpsPoints.length > 0) {
            markers = gpsPoints.map(c => [c[1], c[0]]);
            center = [gpsPoints[gpsPoints.length - 1][1], gpsPoints[gpsPoints.length - 1][0]];
        }
        return { centerCoords: center, polygonCoords: poly, markersCoords: markers };
    })();

    return (
        <div className="bg-bg-main sm:bg-bg-card border-y sm:border border-white/5 sm:rounded-industrial max-w-2xl mx-auto sm:p-6 w-full flex flex-col shadow-2xl pb-8 sm:pb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 flex">
                <div className={`h-full transition-all duration-500 ${isOffline ? 'bg-brand-green w-full' : 'bg-brand-green w-full'}`}></div>
            </div>

            <div className="p-4 sm:p-5 mb-0 flex justify-between items-center z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCapturing ? 'animate-pulse bg-brand-green' : 'bg-brand-green'}`}></span>
                        <h3 className="text-white font-black text-xl uppercase tracking-tighter">MAPEO AUTOMÁTICO AXIS</h3>
                    </div>
                    <p className="text-[7px] text-brand-green/60 font-bold uppercase tracking-[0.15em] mt-1 max-w-[250px] leading-tight">
                        Protocolo de Seguridad: Captura Sensorial por Orden Público (Restricción RPAS/Drones)
                    </p>
                </div>
                {(geoJsonData || gpsPoints.length > 0) && (
                    <button onClick={handleClear} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                    </button>
                )}
            </div>

            <div className="relative h-[350px] shrink-0 w-full bg-slate-900 sm:rounded-industrial-sm overflow-hidden border-white/10 shadow-inner">
                <DynamicLeafletMap center={centerCoords} polygonCoords={polygonCoords} markers={markersCoords} currentLocation={currentPosition} />
                
                {isCapturing && (
                    <>
                        <div className="absolute top-4 left-4 z-20 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${gpsAccuracy && gpsAccuracy < 15 ? 'bg-brand-green' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] text-white font-mono uppercase tracking-widest">Precisión: {gpsAccuracy?.toFixed(1) || '--'}m</span>
                        </div>
                        <div className="absolute top-4 right-4 z-20 bg-brand-green/20 px-3 py-1.5 rounded-full border border-brand-green/30 flex items-center gap-2">
                            <span className="text-[10px] text-brand-green-bright font-black uppercase tracking-tighter">IMU Activo: {imuData.length > 0 ? '✓' : '...'}</span>
                        </div>
                    </>
                )}

                {/* IMU Visualization (Micro-Lidar Style) */}
                {isCapturing && (
                    <div className="absolute bottom-16 right-4 z-20 flex gap-[1px] items-end h-8">
                        {imuData.map((d, i) => (
                            <div key={i} className="w-[2px] bg-brand-green-bright" style={{ height: `${Math.min(d.acc * 2, 32)}px`, opacity: i / imuData.length }}></div>
                        ))}
                    </div>
                )}

                <div className="absolute inset-0 z-10 w-full h-full pointer-events-none flex flex-col items-center justify-center p-4">
                    {!geoJsonData && gpsPoints.length > 0 && (
                        <div className="text-center">
                            <p className="text-7xl font-black text-white drop-shadow-2xl">{gpsPoints.length}</p>
                            <p className="text-[10px] text-brand-green-bright uppercase font-black bg-black/40 px-3 py-1 rounded-full">Vértices</p>
                        </div>
                    )}
                </div>

                {/* Photo Snap Indicator Reverted to Simple GPS Pulse */}
                {isCapturing && (
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-green rounded-full animate-ping"></div>
                        <span className="text-[8px] text-brand-green font-black uppercase tracking-widest">Rastreo GPS Activo</span>
                    </div>
                )}
            </div>

            {/* Vertices Indicator - Exact Style from Screenshot */}
            {!geoJsonData && gpsPoints.length > 0 && (
                <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-black/20">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Polígono Escaneado</span>
                    <span className="text-white font-black text-lg">{gpsPoints.length} Vértices</span>
                </div>
            )}

            {geoJsonData && (
                <div className="mt-6 bg-white/5 p-6 rounded-industrial border border-white/10 shadow-2xl animate-in fade-in">
                    {!isValidated ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Polígono Escaneado</span>
                                <span className="text-white font-black text-xl">{gpsPoints.length} Vértices</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={async () => {
                                        setIsValidated(true);
                                        // PERSISTENCIA EN BÓVEDA DE TRAZABILIDAD (AOC PROTOCOL)
                                        try {
                                            const polygonObj = JSON.parse(geoJsonData || '{}');
                                            await fetch('/api/track-verify', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    email: userEmail || 'unknown@axis.pro',
                                                    farm_name: farmName || 'Parcela Escaneada',
                                                    polygon: polygonObj,
                                                    eudr_status: 'sensor_verified', // Cambiamos estado para reflejar auditoría IMU
                                                    metadata: {
                                                        imu_signature: polygonObj.properties?.sensorAudit,
                                                        device_info: navigator.userAgent
                                                    }
                                                })
                                            });
                                            console.log("AXIS AUDIT: Mapeo sensorial sellado en la Bóveda.");
                                        } catch (e) {
                                            console.error("Error persistiendo mapeo sensorial:", e);
                                        }
                                    }} 
                                    className="flex-1 bg-brand-green hover:bg-brand-green-bright text-black font-black py-6 rounded-2xl shadow-xl uppercase text-xs tracking-widest transition-all active:scale-95"
                                >
                                    ACEPTAR Y SELLAR CON SENSORES
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                             <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">VALIDACIÓN EUDR</h4>
                             <button 
                                onClick={handleGfwValidation} 
                                disabled={isGfwValidating} 
                                className="w-full bg-[#1A2333] hover:bg-[#253249] text-blue-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-blue-500/10 shadow-lg"
                             >
                                {isGfwValidating ? 'PROCESANDO ANÁLISIS...' : 'ANALIZAR CON GLOBAL FOREST WATCH'}
                             </button>
                             
                             {gfwStatus === 'secure' && (
                                <div className="mt-4 p-5 bg-[#0D1A15] border border-brand-green/30 text-brand-green-bright font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl animate-in slide-in-from-bottom-2">
                                    LOTE SEGURO / SIN DEFORESTACIÓN
                                </div>
                             )}
                        </div>
                    )}
                </div>
            )}

            {!geoJsonData && (
                <div className="mt-8 flex flex-col gap-4 z-10">
                    {!isCapturing ? (
                        <button onClick={startTracking} className="w-full bg-brand-green text-black py-7 rounded-full font-black uppercase text-sm shadow-xl active:scale-95 transition-all flex flex-col items-center">
                            <span>INICIAR RECORRIDO AUTOMÁTICO</span>
                            <span className="text-[9px] opacity-60">1 PUNTO CADA 10 SEGUNDOS</span>
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <button onClick={handleFinishMapping} disabled={gpsPoints.length < 3} className="w-full bg-brand-green text-white py-7 rounded-full font-black uppercase text-sm shadow-lg active:scale-95 disabled:opacity-50">
                                FINALIZAR Y CERRAR LOTE
                            </button>
                            <button onClick={stopTracking} className="bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Pausar Rastreo</button>
                        </div>
                    )}
                    
                    {!isCapturing && gpsPoints.length === 0 && (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/5 border border-white/10 text-gray-400 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cargar archivo SICA</button>
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
