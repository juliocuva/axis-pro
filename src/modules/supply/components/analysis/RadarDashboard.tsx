'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const HUB_BOGOTA = [4.711, -74.072];
const PORT_BUENAVENTURA = [3.880, -77.031];
const PORT_CARTAGENA = [10.391, -75.479];

// Global Destinations (Consumo Mundial)
const PORTS_GLOBAL = {
    ROTTERDAM: [51.9225, 4.47917],
    NEW_YORK: [40.7128, -74.0060],
    TOKYO: [35.6895, 139.6917],
    HAMBURG: [53.5511, 9.9937],
    SHANGHAI: [31.2304, 121.4737],
    SAN_FRANCISCO: [37.7749, -122.4194],
    DUBAI: [25.0112, 55.0611],
    SINGAPORE: [1.2762, 103.8000],
    LONDON: [51.5074, 0.1278],
    SYDNEY: [-33.8688, 151.2093]
};

const CONSUMER_NODES = {
    MADRID: [40.4168, -3.7038],
    BRUSSELS: [50.8503, 4.3517],
    BERLIN: [52.5200, 13.4050],
    PARIS: [48.8566, 2.3522],
    MILAN: [45.4642, 9.1899],
    OSLO: [59.9139, 10.7522]
};

const REGION_COORDINATES: Record<string, { lat: number; lon: number }> = {
    'HUILA': { lat: 2.15, lon: -75.95 },      // Acevedo / Pitalito
    'CAUCA': { lat: 2.45, lon: -76.60 },      // Popayán
    'NARIÑO': { lat: 1.45, lon: -77.20 },     // Pasto / Buesaco
    'ANTIOQUIA': { lat: 6.15, lon: -75.75 },  // Fredonia / Andes
    'TOLIMA': { lat: 3.95, lon: -75.35 },     // Planadas
    'CALDAS': { lat: 5.06, lon: -75.50 },     // Manizales
    'QUINDÍO': { lat: 4.53, lon: -75.68 },    // Armenia
    'RISARALDA': { lat: 4.81, lon: -75.69 },  // Pereira
    'SANTANDER': { lat: 6.90, lon: -73.20 },  // Socorro / San Gil
    'VALLE': { lat: 3.90, lon: -76.30 },      // Sevilla
    'CUNDINAMARCA': { lat: 4.70, lon: -73.90 } // Fusagasugá
};

// Orígenes Globales de Proyección para Presentación de Julio César
const GLOBAL_ORIGINS = [
    {
        id: 'global-ethiopia',
        lot_number: 'AX1-ETH-YIRG-09',
        farmer_name: 'Abebe Bikila',
        farm_name: 'Yirgacheffe Cooperative',
        region: 'YIRGACHEFFE, ETHIOPIA',
        variety: 'SL28',
        process: 'Lavado / Anaeróbico',
        purchase_weight: 18200,
        q_score: 91.0,
        latitude: 6.162,
        longitude: 38.241,
        is_global: true,
        destinations: ['ROTTERDAM', 'LONDON'],
        attributes: {
            fermentation: '72h Anaeróbica Hermética',
            ph: '3.62 / 16.5°Bx',
            secado: 'Camas Africanas Bajo Sombra',
            notes: 'Notas cítricas limpias, jazmín, bergamota refinada y acidez brillante.'
        }
    },
    {
        id: 'global-brazil',
        lot_number: 'AX1-BRA-CERR-22',
        farmer_name: 'Thiago Pereira',
        farm_name: 'Fazenda Cerrado Grande',
        region: 'CERRADO MINEIRO, BRAZIL',
        variety: 'MUNDO NOVO',
        process: 'Natural',
        purchase_weight: 32000,
        q_score: 86.5,
        latitude: -18.604,
        longitude: -46.518,
        is_global: true,
        destinations: ['NEW_YORK', 'SAN_FRANCISCO'],
        attributes: {
            fermentation: 'Tradicional Natural Seco',
            ph: '4.10 / 14.0°Bx',
            secado: 'Patios de Concreto Expuestos',
            notes: 'Cuerpo denso almibarado, notas marcadas a chocolate y avellanas.'
        }
    },
    {
        id: 'global-costarica',
        lot_number: 'AX1-CRC-TARR-15',
        farmer_name: 'María Elizondo',
        farm_name: 'Finca El Laurel',
        region: 'TARRAZÚ, COSTA RICA',
        variety: 'CATURRA',
        process: 'Red Honey',
        purchase_weight: 9500,
        q_score: 88.8,
        latitude: 9.682,
        longitude: -84.025,
        is_global: true,
        destinations: ['NEW_YORK', 'LONDON'],
        attributes: {
            fermentation: '36h Honey en Tanque Tapado',
            ph: '3.85 / 18.0°Bx',
            secado: 'Marquesinas Parabólicas Controladas',
            notes: 'Dulzura profunda a miel de caña, manzana roja y acidez elegante.'
        }
    },
    {
        id: 'global-sumatra',
        lot_number: 'AX1-IDN-MAND-41',
        farmer_name: 'Dian Wijaya',
        farm_name: 'Mandheling Smallholders',
        region: 'SUMATRA, INDONESIA',
        variety: 'TYPICA',
        process: 'Giling Basah (Wet Hulled)',
        purchase_weight: 15400,
        q_score: 87.2,
        latitude: -0.533,
        longitude: 101.447,
        is_global: true,
        destinations: ['TOKYO', 'SYDNEY'],
        attributes: {
            fermentation: 'Húmeda Semi-lavada',
            ph: '4.20 / 13.5°Bx',
            secado: 'Patio Abierto Rápido',
            notes: 'Cuerpo robusto, notas terrosas de cedro, tabaco dulce y especias.'
        }
    },
    {
        id: 'global-colombia',
        lot_number: 'AX1-COL-HUIL-88',
        farmer_name: 'Julio César Aruba',
        farm_name: 'Finca La Esmeralda Alta',
        region: 'PITALITO, HUILA, COLOMBIA',
        variety: 'GEISHA',
        process: 'Doble Fermentación Lavado',
        purchase_weight: 4200,
        q_score: 89.5,
        latitude: 2.152,
        longitude: -75.954,
        is_global: true,
        destinations: ['TOKYO', 'ROTTERDAM'],
        attributes: {
            fermentation: '48h Cereza Entera + 24h Mucílago',
            ph: '3.75 / 19.5°Bx',
            secado: 'Marquesinas Sombreadas Secado Lento',
            notes: 'Exótico perfil floral, melocotón maduro, miel silvestre y final persistente.'
        }
    }
];

const getLotCoordinates = (lot: any, seedIndex: number) => {
    const regionStr = (lot.region || '').toUpperCase();
    
    // Deterministic pseudo-random offsets based on index so dots remain perfectly stable on re-renders
    const seedLat = Math.sin(seedIndex * 12.9898) * 43758.5453;
    const jitterLat = (seedLat - Math.floor(seedLat) - 0.5) * 0.22;

    const seedLon = Math.cos(seedIndex * 78.233) * 43758.5453;
    const jitterLon = (seedLon - Math.floor(seedLon) - 0.5) * 0.22;
    
    // Prioritize high-precision department coordinates dictionary for simulated lots
    for (const [dept, coords] of Object.entries(REGION_COORDINATES)) {
        if (regionStr.includes(dept)) {
            return { lat: coords.lat + jitterLat, lon: coords.lon + jitterLon };
        }
    }

    // Explicit manual coordinates fallback (if explicitly given)
    if (lot.latitude && lot.longitude) {
        return { lat: Number(lot.latitude), lon: Number(lot.longitude) };
    }
    if (lot.process_data?.latitude && lot.process_data?.longitude) {
        return { lat: Number(lot.process_data.latitude), lon: Number(lot.process_data.longitude) };
    }

    // Default to the Central Colombian Coffee Axis with a wider default spread
    const baseLat = 4.60;
    const baseLon = -75.60;
    const fallbackJitterLat = (seedLat - Math.floor(seedLat) - 0.5) * 0.8;
    const fallbackJitterLon = (seedLon - Math.floor(seedLon) - 0.5) * 0.8;
    
    return { lat: baseLat + fallbackJitterLat, lon: baseLon + fallbackJitterLon };
};

export default function RadarDashboard({ user }: { user: any }) {
    // Carga dinámica de componentes de mapa para evitar errores de SSR
    const MapContainer = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.MapContainer),
        { ssr: false }
    ), []);
    const TileLayer = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.TileLayer),
        { ssr: false }
    ), []);
    const Marker = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.Marker),
        { ssr: false }
    ), []);
    const Popup = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.Popup),
        { ssr: false }
    ), []);
    const Polyline = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.Polyline),
        { ssr: false }
    ), []);
    const CircleMarker = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.CircleMarker),
        { ssr: false }
    ), []);
    const Tooltip = useMemo(() => dynamic(
        () => import('react-leaflet').then((mod) => mod.Tooltip),
        { ssr: false }
    ), []);

    // Hooks de react-leaflet (Client-only)
    const [leafletHooks, setLeafletHooks] = useState<any>(null);
    useEffect(() => {
        import('react-leaflet').then(mod => {
            setLeafletHooks({ useMap: mod.useMap, useMapEvents: mod.useMapEvents });
        });
    }, []);

    const [L, setL] = useState<any>(null);
    const [lots, setLots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    
    // Filtros Avanzados
    const [filterVariety, setFilterVariety] = useState('ALL');
    const [filterProcess, setFilterProcess] = useState('ALL');
    const [filterPreset, setFilterPreset] = useState<'ALL' | 'SIMULACION' | 'COMPETENCIA'>('ALL');

    // Vista: ORIGEN (Colombia), LOGISTICA (Puertos), CONSUMO (Escaneos Deep)
    const [viewMode, setViewMode] = useState<'ORIGEN' | 'LOGISTICA' | 'CONSUMO'>('ORIGEN');
    const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

    // Controles de Presentación Global Exclusivos de Super Admin Julio César
    const [isGlobalProjection, setIsGlobalProjection] = useState(false);
    const [showMaritimalLines, setShowMaritimalLines] = useState(true);
    const [showConsumerScans, setShowConsumerScans] = useState(true);
    const [showSimTransit, setShowSimTransit] = useState(true);
    const [showAllGlobalRoutes, setShowAllGlobalRoutes] = useState(true);

    const createSignalIcon = (scale = 1, isPulsing = false, color = '#0C6056', isOutline = false) => {
        if (!L) return null;
        return L.divIcon({
            className: 'custom-pulse-icon',
            html: `<div class="pulse-container ${isPulsing ? 'is-pulsing' : ''} ${isOutline ? 'is-outline' : ''}" style="transform: scale(${scale}); color: ${color}">
                    <div class="pulse-dot" style="background-color: ${color} !important; ${isOutline ? `border: 2px solid ${color} !important; background-color: #ffffff !important;` : ''}"></div>
                  </div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    };

    // Controlador para bloquear el pan en zoom mínimo y flyTo automático en proyecciones
    const MapController = () => {
        const { useMap: _useMap, useMapEvents: _useMapEvents } = leafletHooks || {};
        if (!_useMap || !_useMapEvents) return null;

        return <MapControllerInternal useMap={_useMap} useMapEvents={_useMapEvents} />;
    };

    const MapControllerInternal = ({ useMap, useMapEvents }: any) => {
        const map = useMap();
        
        useEffect(() => {
            if (isGlobalProjection) {
                map.setView([20.0, 0.0], 2);
            } else if (viewMode === 'ORIGEN') {
                map.setView([4.5709, -74.2973], 6);
            } else {
                map.setView([20.0, 0.0], 2);
            }
        }, [viewMode, isGlobalProjection, map]);

        useMapEvents({
            zoomend: () => {
                const currentZoom = map.getZoom();
                if (currentZoom <= 2) {
                    map.dragging.disable();
                } else {
                    map.dragging.enable();
                }
            },
        });
        return null;
    };

    // Seguridad: Admin, Julio o Auditor (Viewer)
    const hasAccess = user?.role === 'admin' || user?.role === 'auditor' || user?.email?.toLowerCase().includes('julio') || user?.email?.toLowerCase().includes('main');
    const isSuperAdmin = user?.email?.toLowerCase().includes('julio') || user?.role === 'admin';

    useEffect(() => {
        // Inicializar Leaflet solo en el cliente
        if (typeof window !== 'undefined') {
            import('leaflet').then((leaflet) => {
                setL(leaflet.default);
            });
        }
        if (hasAccess) {
            fetchRadarData();
        }
    }, [hasAccess]);

    const fetchRadarData = async () => {
        try {
            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setLots(data);
            }
        } catch (err) {
            console.error("Radar Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Combinación en caliente de orígenes globales y locales según la proyección
    const projectedLots = useMemo(() => {
        const filteredNormal = lots
            .filter(lot => filterVariety === 'ALL' || lot.variety?.toUpperCase() === filterVariety)
            .filter(lot => filterProcess === 'ALL' || lot.process?.toUpperCase()?.includes(filterProcess))
            .filter(lot => {
                if (filterPreset === 'SIMULACION') return lot.is_simulated === true || lot.lot_number?.includes('SIM-');
                if (filterPreset === 'COMPETENCIA') return lot.lot_number?.includes('WCE-HUILA-');
                return true;
            });
            
        if (isGlobalProjection) {
            return [...filteredNormal, ...GLOBAL_ORIGINS];
        }
        return filteredNormal;
    }, [lots, filterVariety, filterProcess, filterPreset, isGlobalProjection]);

    // Estadísticas dinámicas de la torre de control recalibradas con la proyección global
    const stats = useMemo(() => {
        if (lots.length === 0) {
            return {
                totalWeight: 0,
                avgScore: 0,
                activeAssociations: 0,
                complianceRate: 0
            };
        }
        
        const weight = lots.reduce((acc, curr) => acc + Number(curr.purchase_weight || 0), 0);
        const scores = lots.map(l => (l.process_data?.axis_score || 84.5));
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const uniqueAssocs = new Set(lots.map(l => l.company_id)).size;

        if (isGlobalProjection) {
            const globalWeight = GLOBAL_ORIGINS.reduce((acc, curr) => acc + curr.purchase_weight, 0);
            const globalScores = GLOBAL_ORIGINS.map(o => o.q_score);
            const combinedWeight = weight + globalWeight;
            const combinedScores = [...scores, ...globalScores];
            const combinedAvg = combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length;
            
            return {
                totalWeight: combinedWeight,
                avgScore: Math.round(combinedAvg * 10) / 10,
                activeAssociations: uniqueAssocs + 4, 
                complianceRate: 99.4 
            };
        }

        return {
            totalWeight: weight,
            avgScore: Math.round(avg * 10) / 10,
            activeAssociations: uniqueAssocs,
            complianceRate: 98.4
        };
    }, [lots, isGlobalProjection]);

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setIsInviting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    email: inviteEmail.toLowerCase(),
                    full_name: 'Invitado Auditor (FNC)',
                    role: 'auditor',
                    company_id: 'AXIS_GLOBAL'
                }, { onConflict: 'email' });

            if (error) throw error;
            alert('Acceso de "Viewer" concedido con éxito. El usuario puede ingresar con su email.');
            setShowShareModal(false);
            setInviteEmail('');
        } catch (err: any) {
            alert('Error al compartir: ' + err.message);
        } finally {
            setIsInviting(false);
        }
    };

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-brand-navy p-10">
                <div className="w-20 h-20 border-4 border-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-4xl font-black">!</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-wide">Acceso Denegado</h1>
                <p className="text-brand-navy uppercase text-xs mt-2">Esta terminal requiere credenciales de Alta Gerencia FNC / AXIS ADMIN.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans text-neutral-800">
            <style jsx global>{`
                .pulse-container {
                    position: relative;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #0C6056;
                    opacity: 0.9;
                }
                .pulse-container.is-outline .pulse-dot {
                    background-color: #ffffff !important;
                    border: 2px solid #0C6056;
                }
                .pulse-container.is-pulsing .pulse-dot {
                    animation: pulse-intensity 1.2s ease-in-out infinite;
                    opacity: 1;
                }
                .pulse-container.is-outline.is-pulsing .pulse-dot {
                    animation: pulse-intensity-outline 1.2s ease-in-out infinite;
                    opacity: 1;
                }
                @keyframes pulse-intensity-outline {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.6); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
                @keyframes pulse-intensity {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.8); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
                .coffee-transit-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .custom-map-tooltip {
                    background: rgba(255, 255, 255, 0.9) !important;
                    border: 1px solid rgba(12, 96, 86, 0.3) !important;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05) !important;
                    color: #0C6056 !important;
                    font-family: inherit !important;
                    font-size: 8px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    border-radius: 4px !important;
                    padding: 2px 6px !important;
                }
                .custom-map-tooltip::before {
                    display: none !important;
                }
                .leaflet-container {
                    background: #f4f5f7 !important;
                    cursor: crosshair !important;
                }
                .leaflet-interactive {
                    cursor: pointer !important;
                }
                .leaflet-dragging .leaflet-container {
                    cursor: grabbing !important;
                }
                .sidebar-scroll::-webkit-scrollbar {
                    display: none;
                }
                .sidebar-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-popup .leaflet-popup-content-wrapper {
                    background: rgba(255, 255, 255, 0.95) !important;
                    color: #1a1a1a !important;
                    border: 1.5px solid rgba(12, 96, 86, 0.5);
                    backdrop-filter: blur(12px);
                    border-radius: 12px !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
                }
                .custom-popup .leaflet-popup-tip {
                    background: rgba(255, 255, 255, 0.95) !important;
                    border: 1.5px solid rgba(12, 96, 86, 0.5);
                }
                /* Sleek Neon Zoom Controls */
                .leaflet-bar {
                    border: none !important;
                    box-shadow: none !important;
                }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background-color: rgba(255, 255, 255, 0.95) !important;
                    color: #0C6056 !important;
                    border: 1px solid rgba(12, 96, 86, 0.3) !important;
                    transition: all 0.2s ease-in-out !important;
                    width: 30px !important;
                    height: 30px !important;
                    line-height: 30px !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                }
                .leaflet-control-zoom-in {
                    border-top-left-radius: 8px !important;
                    border-top-right-radius: 8px !important;
                    margin-bottom: 4px !important;
                }
                .leaflet-control-zoom-out {
                    border-bottom-left-radius: 8px !important;
                    border-bottom-right-radius: 8px !important;
                }
                .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
                    background-color: #0C6056 !important;
                    color: #ffffff !important;
                    box-shadow: 0 0 15px rgba(12, 96, 86, 0.4) !important;
                    border-color: #0C6056 !important;
                }
                /* Animate dashed maritime and shipping lines gracefully */
                @keyframes dash-flow {
                    from {
                        stroke-dashoffset: 120;
                    }
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                .animated-maritime-line {
                    stroke-dasharray: 8, 12;
                    animation: dash-flow 15s linear infinite !important;
                }
            `}</style>

            {/* Side Control Tower (Métricas) */}
            <aside className="w-96 bg-white border-r border-gray-200/80 p-6 flex flex-col gap-4 z-[2000] shadow-xl relative overflow-y-auto sidebar-scroll text-neutral-800">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-brand-green/20">AX</div>
                    <div>
                        <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider">Control Center</h2>
                        <p className="text-[11px] text-brand-green font-bold uppercase tracking-widest">Global Logistics Radar</p>
                    </div>
                </div>

                {/* 1. CONFIGURACIONES (TOP) */}
                <div className="bg-neutral-50/80 border border-gray-200/60 p-5 rounded-2xl space-y-4 backdrop-blur-md">
                    <div>
                        <h4 className="text-[9px] font-black uppercase text-brand-green tracking-wider mb-3">Preestablecidos</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setFilterPreset('SIMULACION')}
                                className={`text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'SIMULACION' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-gray-200 text-neutral-700 hover:border-brand-green hover:bg-brand-green/5'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Simulación</p>
                            </button>
                            <button
                                onClick={() => setFilterPreset('COMPETENCIA')}
                                className={`text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'COMPETENCIA' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-gray-200 text-neutral-700 hover:border-brand-green hover:bg-brand-green/5'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Competencia</p>
                            </button>
                            <button
                                onClick={() => setFilterPreset('ALL')}
                                className={`col-span-2 text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'ALL' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-gray-200 text-neutral-700 hover:border-brand-green hover:bg-brand-green/5'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Mostrar Todos</p>
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2 border-t border-gray-200/80">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Varietal</label>
                            <select 
                                value={filterVariety}
                                onChange={(e) => setFilterVariety(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-[9px] font-bold text-neutral-800 outline-none focus:border-brand-green transition-all"
                            >
                                <option value="ALL" className="bg-white">ALL</option>
                                <option value="GEISHA" className="bg-white">Geisha</option>
                                <option value="BOURBON" className="bg-white">Bourbon</option>
                                <option value="CATURRA" className="bg-white">Caturra</option>
                                <option value="CASTILLO" className="bg-white">Castillo</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Proceso</label>
                            <select 
                                value={filterProcess}
                                onChange={(e) => setFilterProcess(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-[9px] font-bold text-neutral-800 outline-none focus:border-brand-green transition-all"
                            >
                                <option value="ALL" className="bg-white">ALL</option>
                                <option value="LAVADO" className="bg-white">Lavado</option>
                                <option value="HONEY" className="bg-white">Honey</option>
                                <option value="NATURAL" className="bg-white">Natural</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2 border-t border-gray-200/80">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setViewMode('ORIGEN')} 
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'ORIGEN' ? 'bg-brand-green text-white border-brand-green shadow-[0_0_15px_rgba(12,96,86,0.3)]' : 'border-gray-200 text-gray-500 hover:text-brand-green hover:border-brand-green/45'}`}
                            >
                                Origen
                            </button>
                            <button 
                                onClick={() => setViewMode('LOGISTICA')} 
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'LOGISTICA' ? 'bg-brand-green text-white border-brand-green shadow-[0_0_15px_rgba(12,96,86,0.3)]' : 'border-gray-200 text-gray-500 hover:text-brand-green hover:border-brand-green/45'}`}
                            >
                                Logística
                            </button>
                        </div>
                        <button 
                            onClick={() => setViewMode('CONSUMO')} 
                            className={`w-full py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'CONSUMO' ? 'bg-brand-green text-white border-brand-green shadow-[0_0_20px_rgba(12,96,86,0.4)]' : 'border-gray-200 text-gray-500 hover:text-brand-green hover:border-brand-green/45'}`}
                        >
                            Deep Trace (Escaneos)
                        </button>
                    </div>
                </div>

                {/* 2. MÉTRICAS (SMALLER & COMPACT) */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
                        <p className="text-gray-500 text-[9px] font-black uppercase mb-1">Masa Crítica</p>
                        <p className="text-lg font-black text-neutral-900">{(stats.totalWeight / 1000).toFixed(1)} <span className="text-[11px] text-brand-green font-bold">T</span></p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
                        <p className="text-gray-500 text-[9px] font-black uppercase mb-1">Calidad (AVG)</p>
                        <p className="text-lg font-black text-neutral-900">{stats.avgScore} <span className="text-[11px] text-brand-green font-bold">PTS</span></p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 col-span-2 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-gray-500 text-[9px] font-black uppercase mb-0.5">Cumplimiento Regulatorio</p>
                            <p className="text-sm font-black text-neutral-900">{stats.complianceRate}% <span className="text-[9px] text-[#0C6056] font-bold">EUDR</span></p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#0C6056]/10 text-[#0C6056] flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 3. TERMINAL DE CONTROL DE PRESENTACIÓN GLOBAL (SUPER ADMIN ONLY) */}
                {isSuperAdmin && (
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4 shadow-lg text-white">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FFB2" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-200">Presentación Global</h4>
                            </div>
                            <span className="text-[8px] bg-[#00FFB2]/10 text-[#00FFB2] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Master</span>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-neutral-200">Expansión Global axisONE</p>
                                    <p className="text-[8px] text-neutral-500 uppercase font-semibold">Proyectar alcance internacional</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const nextVal = !isGlobalProjection;
                                        setIsGlobalProjection(nextVal);
                                        if (nextVal) {
                                            setViewMode('LOGISTICA');
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide transition-all ${isGlobalProjection ? 'bg-[#00FFB2] text-black border-[#00FFB2] shadow-[0_0_15px_rgba(0,255,178,0.4)]' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
                                >
                                    {isGlobalProjection ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {isGlobalProjection && (
                                <div className="space-y-2 pt-2 border-t border-neutral-800 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between text-[9px] text-neutral-300">
                                        <span className="font-bold uppercase">Ver Red Completa (Simultánea)</span>
                                        <input 
                                            type="checkbox" 
                                            checked={showAllGlobalRoutes}
                                            onChange={(e) => setShowAllGlobalRoutes(e.target.checked)}
                                            className="w-3.5 h-3.5 accent-[#00FFB2] bg-neutral-800 border-neutral-700 rounded focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-neutral-300">
                                        <span className="font-bold uppercase">Mostrar Rutas Marítimas</span>
                                        <input 
                                            type="checkbox" 
                                            checked={showMaritimalLines}
                                            onChange={(e) => setShowMaritimalLines(e.target.checked)}
                                            className="w-3.5 h-3.5 accent-[#00FFB2] bg-neutral-800 border-neutral-700 rounded focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-neutral-300">
                                        <span className="font-bold uppercase">Mostrar Escaneos de Consumo</span>
                                        <input 
                                            type="checkbox" 
                                            checked={showConsumerScans}
                                            onChange={(e) => setShowConsumerScans(e.target.checked)}
                                            className="w-3.5 h-3.5 accent-[#00FFB2] bg-neutral-800 border-neutral-700 rounded focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-neutral-300">
                                        <span className="font-bold uppercase">Simular Barcos en Tránsito</span>
                                        <input 
                                            type="checkbox" 
                                            checked={showSimTransit}
                                            onChange={(e) => setShowSimTransit(e.target.checked)}
                                            className="w-3.5 h-3.5 accent-[#00FFB2] bg-neutral-800 border-neutral-700 rounded focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-auto space-y-3">
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3 rounded-xl font-black text-[9px] uppercase hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        Acceso Viewer
                    </button>
                    
                    <div className="bg-brand-green/5 border border-brand-green/10 p-4 rounded-2xl relative overflow-hidden">
                        <h4 className="text-[9px] font-black uppercase text-brand-green mb-1">Sistema Live</h4>
                        <p className="text-[9px] text-neutral-700 leading-tight uppercase font-bold">{stats.activeAssociations} Asociaciones en Red.</p>
                    </div>
                </div>
            </aside>

            <main className="flex-1 relative">
                {L && (
                    <MapContainer 
                        center={viewMode === 'ORIGEN' ? [4.5709, -74.2973] as any : [20.0, 0.0] as any} 
                        zoom={viewMode === 'ORIGEN' ? 6 : 2} 
                        minZoom={2}
                        maxZoom={12}
                        className="w-full h-full"
                        zoomControl={true}
                        attributionControl={false}
                        worldCopyJump={true}
                    >
                        <MapController />
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        {projectedLots.map((lot, index) => {
                            const isGlobal = lot.is_global === true;
                            const { lat, lon } = isGlobal ? { lat: lot.latitude, lon: lot.longitude } : getLotCoordinates(lot, index);
                            
                            // Determinación de colores según si el lote es local o de proyección internacional
                            const routeColor = isGlobal ? '#00FFB2' : '#0C6056';

                            // Trayectoria Internacional con Lógica Marítima
                            const destNames = Object.keys(PORTS_GLOBAL);
                            const destName = destNames[index % destNames.length];
                            
                            // Los orígenes globales admiten múltiples puertos de destino simultáneamente para exhibir cobertura masiva
                            const destinationsToRender = isGlobal ? (lot.destinations || [destName]) : [destName];

                            return (
                                <React.Fragment key={lot.id}>
                                    {/* Marcador de Origen */}
                                    <Marker 
                                        position={[lat, lon]} 
                                        icon={createSignalIcon(1.2, selectedLotId === lot.id, routeColor)}
                                        eventHandlers={{
                                            click: () => setSelectedLotId(lot.id === selectedLotId ? null : lot.id)
                                        }}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="p-3 text-neutral-900 max-w-xs space-y-2">
                                                <p className="text-[12px] font-black uppercase text-brand-green tracking-wider border-b border-brand-green/20 pb-1">
                                                    {lot.lot_number} {isGlobal && <span className="text-[8px] bg-[#00FFB2]/10 text-brand-green px-1.5 py-0.5 rounded font-black float-right uppercase tracking-wider">Global</span>}
                                                </p>
                                                <div className="text-[10px] space-y-1">
                                                    <p><span className="text-gray-500 font-bold uppercase">Productor:</span> <span className="font-black text-neutral-800">{lot.farmer_name}</span></p>
                                                    <p><span className="text-gray-500 font-bold uppercase">Finca:</span> <span className="font-black text-neutral-800">{lot.farm_name}</span></p>
                                                    <p><span className="text-gray-500 font-bold uppercase">Variedad:</span> <span className="font-bold text-brand-green">{lot.variety}</span></p>
                                                    <p><span className="text-gray-500 font-bold uppercase">Proceso:</span> <span className="font-bold text-brand-green">{lot.process}</span></p>
                                                    <p><span className="text-gray-500 font-bold uppercase">Peso:</span> <span className="font-black text-neutral-800">{lot.purchase_weight} kg</span></p>
                                                    {isGlobal && lot.q_score && (
                                                        <p><span className="text-gray-500 font-bold uppercase">Calidad Q-Score:</span> <span className="font-black text-brand-green">{lot.q_score} PTS</span></p>
                                                    )}
                                                </div>
                                                
                                                {isGlobal && lot.attributes ? (
                                                    <div className="text-[9px] bg-gray-50 p-2 rounded-lg border border-brand-green/10 space-y-0.5">
                                                        <p className="text-[8px] font-black text-brand-green uppercase tracking-widest mb-1">Especificación Origen</p>
                                                        <p><span className="text-gray-400 font-bold">Fermentación:</span> <span className="text-gray-700 font-semibold">{lot.attributes.fermentation}</span></p>
                                                        <p><span className="text-gray-400 font-bold">pH / Brix:</span> <span className="text-gray-700 font-semibold">{lot.attributes.ph}</span></p>
                                                        <p><span className="text-gray-400 font-bold">Secado:</span> <span className="text-gray-700 font-semibold">{lot.attributes.secado}</span></p>
                                                        <p className="text-[8px] text-brand-green italic mt-1.5 font-bold">"{lot.attributes.notes}"</p>
                                                    </div>
                                                ) : lot.process_data ? (
                                                    <div className="text-[9px] bg-gray-50 p-2 rounded-lg border border-brand-green/10 space-y-0.5">
                                                        <p className="text-[8px] font-black text-brand-green uppercase tracking-widest mb-1">Parámetros Críticos</p>
                                                        <p><span className="text-gray-400 font-bold">Fermentación:</span> <span className="text-gray-700 font-semibold">{lot.process_data.duracion_fermentacion_horas}h ({lot.process_data.fermentation_style})</span></p>
                                                        <p><span className="text-gray-400 font-bold">pH final / Brix:</span> <span className="text-gray-700 font-semibold">{lot.process_data.ph_final} / {lot.process_data.brix_inicial}°Bx</span></p>
                                                        <p><span className="text-gray-400 font-bold">Secado:</span> <span className="text-gray-700 font-semibold">{lot.process_data.tipo_secado} ({lot.process_data.duracion_secado})</span></p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </Popup>
                                    </Marker>

                                    {/* Mapeo de múltiples destinos marítimos asignados */}
                                    {destinationsToRender.map((dName: string) => {
                                        const finalDestination = PORTS_GLOBAL[dName as keyof typeof PORTS_GLOBAL];
                                        if (!finalDestination) return null;

                                        // Determinación de puertos colombianos de salida
                                        const isPacific = ['TOKYO', 'SHANGHAI', 'SINGAPORE', 'SYDNEY', 'SAN_FRANCISCO'].includes(dName);
                                        const portColombia = isPacific ? PORT_BUENAVENTURA : PORT_CARTAGENA;

                                        // Si el origen es internacional, la ruta va directo desde su coordenada
                                        const startPoint = isGlobal ? [lat, lon] : portColombia;
                                        
                                        // Puntos geodésicos marinos de tránsito
                                        const midLat = (startPoint[0] + finalDestination[0]) / 2 + (isPacific ? -8 : 5);
                                        const midLon = (startPoint[1] + finalDestination[1]) / 2;
                                        const midPoint = [midLat, midLon];

                                        const showRoute = showAllGlobalRoutes || (selectedLotId === lot.id);

                                        return (
                                            <React.Fragment key={`${lot.id}-${dName}`}>
                                                {/* Ruta terrestre a puerto nacional (solo lotes locales colombianos) */}
                                                {!isGlobal && selectedLotId === lot.id && (
                                                    <Polyline 
                                                        positions={[[lat, lon], portColombia as any]} 
                                                        pathOptions={{ color: '#0C6056', weight: 2.5, opacity: 0.8, dashArray: '5, 8' }} 
                                                    />
                                                )}

                                                {/* Trazado Marítimo Internacional Principal */}
                                                {(viewMode === 'LOGISTICA' || viewMode === 'CONSUMO') && showRoute && showMaritimalLines && (
                                                    <>
                                                        <Polyline 
                                                            positions={[startPoint as any, midPoint as any, finalDestination as any]} 
                                                            pathOptions={{ 
                                                                className: 'animated-maritime-line',
                                                                color: routeColor, 
                                                                weight: isGlobal ? 2.5 : 2, 
                                                                opacity: 0.9, 
                                                                dashArray: '8, 12'
                                                            }} 
                                                        />
                                                        
                                                        {/* Barcos mercantes en tránsito simulados */}
                                                        {showSimTransit && (
                                                            <Marker position={midPoint as any} icon={createSignalIcon(0.8, true, routeColor)}>
                                                                <Popup className="custom-popup">
                                                                    <div className="p-2 text-neutral-900 space-y-1">
                                                                        <p className="text-[10px] font-black uppercase text-brand-green border-b border-brand-green/10 pb-0.5">En Tránsito Activo</p>
                                                                        <p className="text-[9px] font-bold">Lote: {lot.lot_number}</p>
                                                                        <p className="text-[9px] text-gray-500">Ruta: Origen hacia Puerto de {dName}</p>
                                                                    </div>
                                                                </Popup>
                                                            </Marker>
                                                        )}

                                                        {/* Nodo de Puerto de Desembarque en Destino */}
                                                        <Marker position={finalDestination as any} icon={createSignalIcon(1.4, true, routeColor, true)}>
                                                             <Tooltip permanent direction="top" className="custom-map-tooltip">
                                                                 {dName}
                                                             </Tooltip>
                                                            <Popup className="custom-popup">
                                                                <div className="p-2 text-neutral-900 space-y-1">
                                                                    <p className="text-[10px] font-black uppercase text-brand-green border-b border-brand-green/10 pb-0.5">Puerto de Destino</p>
                                                                    <p className="text-[9px] font-bold">{dName}</p>
                                                                    <p className="text-[9px] text-gray-500">Contenedor recibido bajo sello axisONE.</p>
                                                                </div>
                                                            </Popup>
                                                        </Marker>

                                                        {/* Escaneos Deep en Puntos de Consumo Final */}
                                                        {viewMode === 'CONSUMO' && showConsumerScans && (
                                                            <>
                                                                {Object.entries(CONSUMER_NODES).slice(index % 3, (index % 3) + 1).map(([cityName, cityCoords]) => (
                                                                    <React.Fragment key={cityName}>
                                                                        <Polyline 
                                                                            positions={[finalDestination as any, cityCoords as any]} 
                                                                            pathOptions={{ 
                                                                                className: 'animated-maritime-line',
                                                                                color: routeColor, 
                                                                                weight: 1.5, 
                                                                                opacity: 0.75, 
                                                                                dashArray: '4, 8' 
                                                                            }} 
                                                                        />
                                                                        <Marker position={cityCoords as any} icon={createSignalIcon(1, true, routeColor)}>
                                                                            <Popup className="custom-popup">
                                                                                <div className="p-3 text-neutral-900 max-w-xs space-y-1">
                                                                                    <p className="text-[11px] font-black uppercase text-brand-green border-b border-brand-green/20 pb-0.5">Escaneo QR de Consumo</p>
                                                                                    <p className="text-[9px] font-bold mt-1 text-neutral-800">{cityName} • Specialty Coffee Bar</p>
                                                                                    <p className="text-[9px] text-gray-500 mt-0.5">Historial técnico consultado por consumidor final.</p>
                                                                                </div>
                                                                            </Popup>
                                                                        </Marker>
                                                                    </React.Fragment>
                                                                ))}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {/* Puertos Nacionales - Permanentes (Signal Icons) */}
                        <Marker position={PORT_BUENAVENTURA as any} icon={createSignalIcon(1, false, '#0C6056', true)}>
                            <Popup>Puerto de Buenaventura</Popup>
                            <Tooltip permanent direction="right" className="custom-map-tooltip">
                                Buenaventura
                            </Tooltip>
                        </Marker>
                        <Marker position={PORT_CARTAGENA as any} icon={createSignalIcon(1, false, '#0C6056', true)}>
                            <Popup>Puerto de Cartagena</Popup>
                            <Tooltip permanent direction="right" className="custom-map-tooltip">
                                Cartagena
                            </Tooltip>
                        </Marker>

                        {/* Nodos de Consumo Mundial - Permanentes (Signal Icons) */}
                        {Object.entries(PORTS_GLOBAL).map(([name, coords]) => (
                            <Marker key={name} position={coords as any} icon={createSignalIcon(0.8, false, '#0C6056', true)}>
                                <Popup>Puerto Global: {name}</Popup>
                                <Tooltip permanent direction="top" className="custom-map-tooltip">
                                    {name}
                                </Tooltip>
                            </Marker>
                        ))}

                        {/* Nodos de Consumidor Final - Deep Traceability (Signal Icons) */}
                        {Object.entries(CONSUMER_NODES).map(([name, coords]) => (
                            <Marker key={name} position={coords as any} icon={createSignalIcon(0.6, false, '#0C6056')}>
                                <Popup>Punto de Consumo: {name}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* MODAL COMPARTIR ESTILO DRIVE */}
                {showShareModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-white/85 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-md rounded-3xl p-10 text-center space-y-6">
                            <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <h3 className="text-2xl font-black uppercase text-neutral-900 tracking-wide">Compartir Radar</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold ">Concede permisos de "Solo Lectura" a este panel de control.</p>
                            
                            <div className="space-y-2 text-left">
                                <label className="text-[9px] font-black uppercase text-gray-500 ml-4 ">Email del Invitado</label>
                                <input 
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="ej: gerencia@federacion.org"
                                    className="w-full bg-gray-50 border border-gray-200 shadow-sm p-4 rounded-2xl text-sm focus:border-brand-green transition-all outline-none text-neutral-800"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowShareModal(false)}
                                    className="flex-1 py-4 text-[11px] font-black uppercase text-gray-500 hover:text-brand-navy transition-all font-bold"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleInvite}
                                    disabled={isInviting}
                                    className="flex-2 bg-brand-green hover:bg-brand-green/90 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50 font-bold"
                                >
                                    {isInviting ? 'Otorgando...' : 'Dar Acceso Viewer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
