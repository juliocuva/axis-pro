import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

interface EUDRGeoreferenceProps {
    onPolygonChange?: (geoJson: string) => void;
    initialPolygon?: string;
}

export default function EUDRGeoreference({ onPolygonChange, initialPolygon }: EUDRGeoreferenceProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<{ type: 'idle' | 'processing' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
    const [geoJsonData, setGeoJsonData] = useState<string>(initialPolygon || '');
    const [isValidated, setIsValidated] = useState<boolean>(false);

    // For manual point capture
    const [gpsPoints, setGpsPoints] = useState<[number, number][]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setStatus({ type: 'processing', message: 'Procesando archivo SICA...' });

        // Simulated processing
        setTimeout(() => {
            if (uploadedFile.name.endsWith('.kml') || uploadedFile.name.endsWith('.shp') || uploadedFile.name.endsWith('.json')) {
                // Generamos un polígono de prueba más realista (12 lados, variaciones randómicas pero convexas)
                const mockCoords = Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 360 / 12) * (Math.PI / 180);
                    // Rango de la finca: ~150-350 metros del centro
                    const radius = 0.0015 + Math.random() * 0.002;
                    return [-74.297333 + Math.cos(angle) * radius, 4.570868 + Math.sin(angle) * radius];
                });
                mockCoords.push(mockCoords[0]); // Cerramos el polígono

                const mockGeoJson = JSON.stringify({
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [mockCoords]
                        }
                    }]
                });
                setGeoJsonData(mockGeoJson);
                if (onPolygonChange) onPolygonChange(mockGeoJson);
                setStatus({ type: 'success', message: 'Polígono generado (WGS84).' });
                setGpsPoints([]); // Clear manual points
            } else {
                setStatus({ type: 'error', message: 'Formato inválido (.kml, .shp o .json).' });
            }
        }, 1200);
    };

    const handleCapturePoint = () => {
        // Mock capture of current GPS location
        const baseLat = 4.570868;
        const baseLng = -74.297333;
        // Utilizamos matemáticas radiales para asegurar que los puntos rodeen a la finca 
        // sin cruzarse entre ellos, imitando a un caminante bordeando el lote.
        const angle = (gpsPoints.length * 360 / 12) * (Math.PI / 180);
        const radiusLat = 0.001 + Math.random() * 0.002;
        const radiusLng = 0.001 + Math.random() * 0.002;

        const newLat = baseLat + Math.sin(angle) * radiusLat;
        const newLng = baseLng + Math.cos(angle) * radiusLng;

        const newPoints = [...gpsPoints, [newLng, newLat] as [number, number]];
        setGpsPoints(newPoints);

        // If 12 or more points, we can form a polygon
        if (newPoints.length >= 12) {
            const polygonCoords = [...newPoints, newPoints[0]]; // close polygon
            const generatedGeoJson = JSON.stringify({
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [polygonCoords]
                    }
                }]
            });
            setGeoJsonData(generatedGeoJson);
            if (onPolygonChange) onPolygonChange(generatedGeoJson);
        }
    };

    const handleClear = () => {
        setGpsPoints([]);
        setGeoJsonData('');
        setFile(null);
        setStatus({ type: 'idle', message: '' });
        setIsValidated(false);
    };

    const { centerCoords, polygonCoords, markersCoords } = (() => {
        let centerCoords: [number, number] = [4.570868, -74.297333];
        let polygonCoords: [number, number][] = [];
        let markersCoords: [number, number][] = [];

        if (geoJsonData) {
            try {
                const parsed = JSON.parse(geoJsonData);
                const coords = parsed.features?.[0]?.geometry?.coordinates?.[0];
                if (coords && coords.length > 0) {
                    polygonCoords = coords.map((c: any) => [c[1], c[0]]);
                    centerCoords = [coords[0][1], coords[0][0]];
                }
            } catch (e) { }
        } else if (gpsPoints.length > 0) {
            if (gpsPoints.length >= 12) {
                polygonCoords = gpsPoints.map(c => [c[1], c[0]]);
            } else {
                markersCoords = gpsPoints.map(c => [c[1], c[0]]);
            }
            centerCoords = [gpsPoints[gpsPoints.length - 1][1], gpsPoints[gpsPoints.length - 1][0]];
        }
        return { centerCoords, polygonCoords, markersCoords };
    })();

    return (
        <div className="bg-bg-main sm:bg-bg-card border-y sm:border border-white/5 sm:rounded-industrial max-w-2xl mx-auto sm:p-6 w-full flex flex-col shadow-2xl pb-8 sm:pb-6 relative">
            {/* Header */}
            <div className="p-4 sm:p-0 mb-2 border-b border-white/5 sm:border-none flex justify-between items-center z-10 bg-bg-main sm:bg-transparent">
                <div>
                    <h3 className="text-brand-green-bright font-bold flex items-center gap-2 text-lg">
                        <span className="w-1.5 h-5 bg-brand-green rounded-full"></span>
                        Mapeo EUDR
                    </h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 ml-3.5">
                        Delimitación de Linderos
                    </p>
                </div>
                {geoJsonData && (
                    <button onClick={handleClear} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                )}
            </div>

            <div className="relative h-[300px] shrink-0 w-full bg-slate-200 sm:rounded-industrial-sm overflow-hidden border-y sm:border border-white/5 group z-0">
                <DynamicLeafletMap center={centerCoords} polygonCoords={polygonCoords} markers={markersCoords} />

                {/* Map Overlay content */}
                <div className="absolute inset-0 z-10 w-full h-full pointer-events-none flex flex-col items-center justify-center p-4">
                    {!geoJsonData && gpsPoints.length === 0 && status.type !== 'processing' ? (
                        <div className="text-center bg-white/80 backdrop-blur-md p-6 rounded-industrial border border-gray-300 shadow-2xl pointer-events-auto">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <p className="text-sm text-gray-800 font-bold mb-1">Área sin definir</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                                Capture puntos caminando <br />o cargue archivo SICA
                            </p>
                        </div>
                    ) : status.type === 'processing' ? (
                        <div className="text-center bg-black/60 backdrop-blur-md p-6 rounded-industrial border border-brand-green/30">
                            <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs text-brand-green-bright uppercase font-bold tracking-widest">Calculando...</p>
                        </div>
                    ) : gpsPoints.length > 0 && !geoJsonData ? (
                        <div className="text-center">
                            <p className="text-4xl font-bold text-white drop-shadow-lg mb-2">{gpsPoints.length}</p>
                            <p className="text-[10px] bg-black/60 px-3 py-1 rounded-full text-brand-green-bright uppercase tracking-widest backdrop-blur-sm border border-brand-green/30">
                                Puntos Capturados
                            </p>
                            {gpsPoints.length < 12 && (
                                <p className="text-[10px] text-white mt-4 bg-red-500/20 px-3 py-1 rounded backdrop-blur-sm">
                                    Faltan {12 - gpsPoints.length} puntos para cerrar
                                </p>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Visual interface node for initial mock placement point */}
                {gpsPoints.length === 0 && !geoJsonData && status.type !== 'processing' && (
                    <div className="absolute w-4 h-4 rounded-full bg-brand-green/30 border border-white/30 shadow-[0_0_10px_#00df9a] animate-pulse"
                        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    </div>
                )}
            </div>

            {/* Validation Panel (Movido afuera para no tapar el mapa) */}
            {geoJsonData && (
                <div className="mt-4 sm:mt-6 bg-black/80 p-5 rounded-industrial border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20 animate-in slide-in-from-top-4 duration-500 w-full">
                    {!isValidated ? (
                        <>
                            <h4 className="text-brand-green-bright font-bold mb-2 uppercase tracking-wide text-center">Validar Linderos</h4>
                            <p className="text-xs text-gray-300 mb-5 leading-relaxed text-center">¿Es este el lote de su finca? Por favor revise el polígono trazado en el mapa superior.</p>

                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={() => setIsValidated(true)}
                                    className="flex-1 bg-brand-green hover:bg-brand-green-bright text-black font-bold text-[11px] py-4 rounded-industrial-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                                >
                                    SÍ, CONFIRMAR LOTE
                                </button>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <button
                                    onClick={handleClear}
                                    className="text-gray-400 hover:text-red-400 font-bold text-[9px] uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                    Modificar/Corregir
                                </button>
                                <a href={`https://www.openstreetmap.org/?mlat=${centerCoords[0]}&mlon=${centerCoords[1]}#map=16/${centerCoords[0]}/${centerCoords[1]}`} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                                    Ver en Maps
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-green/30 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-white mb-2 tracking-tight">Lote Confirmado</p>
                            <div className="flex justify-center gap-2 mb-4">
                                <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-[9px] rounded uppercase font-bold tracking-wider">WGS84</span>
                                <span className="px-2 py-0.5 bg-brand-green/20 text-brand-green-bright text-[9px] rounded uppercase font-bold tracking-wider">Cumple EUDR</span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono bg-black/50 p-2 rounded truncate border border-white/5 mx-4">
                                {gpsPoints.length > 0 ? `${gpsPoints.length} Vértices (GPS)` : `Linderos (.${file?.name?.split('.').pop() || 'kml'})`}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Controls (Bottom Section) - ESCONDIDO SI YA ESTÁ VALIDADO */}
            {!geoJsonData && (
                <div className="p-4 sm:p-0 sm:pt-6 flex flex-col gap-3 z-10 bg-bg-main sm:bg-transparent">

                    {/* GPS Capture Button (Primary Action) */}
                    <button
                        type="button"
                        onClick={handleCapturePoint}
                        disabled={!!geoJsonData}
                        className="w-full relative group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-brand-green rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-brand-green hover:bg-brand-green-bright text-white w-full py-5 rounded-full font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg shadow-brand-green/20">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            {gpsPoints.length === 0 ? 'Iniciar Caminata (Punto 1)' : 'Grabar Siguiente Punto'}
                        </div>
                    </button>

                    {/* File Upload Option (Secondary Action) */}
                    <div className=" relative flex items-center justify-center mt-2">
                        <div className="absolute w-full h-px bg-white/10"></div>
                        <span className="relative bg-bg-main sm:bg-bg-card px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">o importar</span>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".kml,.shp,.json"
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-industrial-sm font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        Cargar Archivo SICA
                    </button>
                </div>
            )}

            {/* Status messages for SICA */}
            {status.type === 'error' && (
                <div className="absolute top-4 right-4 left-4 bg-red-500/90 text-white text-xs p-3 rounded-industrial-sm shadow-xl font-bold flex items-center gap-2 animate-in slide-in-from-top-2 z-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {status.message}
                </div>
            )}
        </div>
    );
}
