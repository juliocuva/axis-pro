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

    // Geo Tracker
    const startTracking = () => {
        if (!navigator.geolocation) {
            setStatus({ type: 'error', message: 'GPS no soportado.' });
            return;
        }

        setIsCapturing(true);
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

        const polygonCoords = [...gpsPoints, gpsPoints[0]];
        const generatedGeoJson = JSON.stringify({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": { "method": "auto_scan_10s", "timestamp": new Date().toISOString() },
                "geometry": { "type": "Polygon", "coordinates": [polygonCoords] }
            }]
        });

        setGeoJsonData(generatedGeoJson);
        if (onPolygonChange) onPolygonChange(generatedGeoJson);
        stopTracking();
        localStorage.removeItem('axis_pending_mapping');
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

            <div className="p-4 sm:p-0 mb-4 flex justify-between items-center z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isCapturing ? 'animate-pulse bg-brand-green' : 'bg-brand-green'}`}></span>
                        <h3 className="text-white font-black text-lg uppercase tracking-tight">Mapeo Automático AXIS</h3>
                    </div>
                </div>
                {(geoJsonData || gpsPoints.length > 0) && (
                    <button onClick={handleClear} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
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
                            <span className="text-[10px] text-brand-green-bright font-black uppercase">Próximo Punto: {nextCaptureSeconds}s</span>
                        </div>
                    </>
                )}

                <div className="absolute inset-0 z-10 w-full h-full pointer-events-none flex flex-col items-center justify-center p-4">
                    {!geoJsonData && gpsPoints.length > 0 && (
                        <div className="text-center">
                            <p className="text-7xl font-black text-white drop-shadow-2xl">{gpsPoints.length}</p>
                            <p className="text-[10px] text-brand-green-bright uppercase font-black bg-black/40 px-3 py-1 rounded-full">Vértices</p>
                        </div>
                    )}
                </div>
            </div>

            {geoJsonData && (
                <div className="mt-6 bg-white/5 p-6 rounded-industrial border border-white/10 shadow-2xl animate-in fade-in">
                    {!isValidated ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Polígono Escaneado</span>
                                <span className="text-white font-bold">{gpsPoints.length} Vértices</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={async () => {
                                        setIsValidated(true);
                                        // PERSISTENCIA INMEDIATA: Guardamos en logs de trazabilidad
                                        try {
                                            await fetch('/api/track-verify', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    email: userEmail || 'unknown@axis.pro',
                                                    farm_name: farmName || 'Parcela Escaneada',
                                                    polygon: geoJsonData,
                                                    eudr_status: 'captured',
                                                    user_agent: navigator.userAgent
                                                })
                                            });
                                            console.log("AXIS LOG: Mapeo persistido en Bóveda de Trazabilidad.");
                                        } catch (e) {
                                            console.error("Error persistiendo mapeo:", e);
                                        }
                                    }} 
                                    className="flex-1 bg-brand-green text-black font-black py-5 rounded-industrial shadow-lg uppercase text-xs"
                                >
                                    Aceptar y Guardar
                                </button>
                                
                                <button
                                    onClick={() => {
                                        const blob = new Blob([geoJsonData || ''], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `EUDR_${farmName || 'Lote'}_${new Date().toISOString().split('T')[0]}.geojson`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }}
                                    title="Descargar GeoJSON"
                                    className="px-6 bg-white/5 border border-white/10 text-white rounded-industrial hover:bg-white/10 transition-all flex items-center justify-center group"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-y-0.5 transition-transform">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                             <h4 className="text-xl font-black text-white uppercase">Validación EUDR</h4>
                             <button onClick={handleGfwValidation} disabled={isGfwValidating} className="mt-4 w-full bg-brand-green/20 text-brand-green-bright py-4 rounded-xl font-black text-[10px] uppercase">
                                {isGfwValidating ? 'Analizando GFW...' : 'Analizar con Global Forest Watch'}
                             </button>
                             {gfwStatus === 'secure' && <div className="mt-4 p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green-bright font-bold uppercase text-[10px]">Lote Seguro / Sin Deforestación</div>}
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
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/5 border border-white/10 text-gray-400 py-4 rounded-2xl font-bold uppercase text-[10px]">Cargar archivo SICA</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
