'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip 
} from 'recharts';

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

    // Hooks de react-leaflet (Client-only)
    const [leafletHooks, setLeafletHooks] = useState<any>(null);
    useEffect(() => {
        import('react-leaflet').then(mod => {
            setLeafletHooks({ useMap: mod.useMap, useMapEvents: mod.useMapEvents });
        });
    }, []);

    const [L, setL] = useState<any>(null);
    const [lots, setLots] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalWeight: 0,
        avgScore: 0,
        activeAssociations: 0,
        complianceRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    
    // Filtros Avanzados
    const [filterVariety, setFilterVariety] = useState('ALL');
    const [filterProcess, setFilterProcess] = useState('ALL');
    // Vista: ORIGEN (Colombia), LOGISTICA (Puertos), CONSUMO (Escaneos Deep)
    const [viewMode, setViewMode] = useState<'ORIGEN' | 'LOGISTICA' | 'CONSUMO'>('ORIGEN');
    const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

    const createSignalIcon = (scale = 1, isPulsing = false, color = '#00df9a') => {
        if (!L) return null;
        return L.divIcon({
            className: 'custom-pulse-icon',
            html: `<div class="pulse-container ${isPulsing ? 'is-pulsing' : ''}" style="transform: scale(${scale}); color: ${color}">
                    <div class="pulse-dot"></div>
                  </div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    };

    // Controlador para bloquear el pan en zoom mínimo
    const MapController = () => {
        const { useMap: _useMap, useMapEvents: _useMapEvents } = leafletHooks || {};
        if (!_useMap || !_useMapEvents) return null;

        return <MapControllerInternal useMap={_useMap} useMapEvents={_useMapEvents} />;
    };

    const MapControllerInternal = ({ useMap, useMapEvents }: any) => {
        const map = useMap();
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
                
                // Calcular estadísticas de "Torre de Control"
                const weight = data.reduce((acc, curr) => acc + Number(curr.purchase_weight || 0), 0);
                const scores = data.map(l => (l.process_data?.axis_score || 84.5)); // Mock de score si no hay
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                const uniqueAssocs = new Set(data.map(l => l.company_id)).size;

                setStats({
                    totalWeight: weight,
                    avgScore: Math.round(avg * 10) / 10,
                    activeAssociations: uniqueAssocs,
                    complianceRate: 98.4 // Simulado para impacto
                });
            }
        } catch (err) {
            console.error("Radar Error:", err);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-10">
                <div className="w-20 h-20 border-4 border-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-4xl font-black">!</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Acceso Denegado</h1>
                <p className="text-gray-500 uppercase text-xs tracking-widest mt-2">Esta terminal requiere credenciales de Alta Gerencia FNC / AXIS ADMIN.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans text-white">
            <style jsx global>{`
                .pulse-container {
                    position: relative;
                    width: 12px;
                    height: 12px;
                    display: flex;
                    items-center;
                    justify-center;
                }
                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: currentColor;
                    opacity: 0.6;
                }
                .pulse-container.is-pulsing .pulse-dot {
                    animation: pulse-intensity 1.5s ease-in-out infinite;
                    opacity: 1;
                }
                @keyframes pulse-intensity {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(2); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
                .coffee-transit-icon {
                    display: flex;
                    align-items: center;
                    justify-center;
                    filter: drop-shadow(0 0 5px #00df9a);
                }
                .leaflet-container {
                    background: #0a0a0a !important;
                }
                .sidebar-scroll::-webkit-scrollbar {
                    display: none;
                }
                .sidebar-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-popup .leaflet-popup-content-wrapper {
                    background: rgba(0,0,0,0.8) !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                }
                .custom-popup .leaflet-popup-tip {
                    background: rgba(0,0,0,0.8) !important;
                }
            `}</style>

            {/* Side Control Tower (Métricas) */}
            <aside className="w-96 bg-[#111] border-r border-white/5 p-6 flex flex-col gap-4 z-[2000] shadow-2xl relative overflow-y-auto sidebar-scroll">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 bg-[#00df9a] rounded-lg flex items-center justify-center text-black font-black">AX</div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tighter">Control Center</h2>
                        <p className="text-[10px] text-[#00df9a] font-bold uppercase tracking-widest">Global Logistics Radar</p>
                    </div>
                </div>

                {/* 1. CONFIGURACIONES (TOP) */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                    <div>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Preestablecidos</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Exotic Gold', var: 'GEISHA', proc: 'HONEY' },
                                { label: 'Regional', var: 'ALL', proc: 'NATURAL' },
                                { label: 'High Vol', var: 'CASTILLO', proc: 'LAVADO' },
                                { label: 'Reset', var: 'ALL', proc: 'ALL' }
                            ].map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setFilterVariety(preset.var);
                                        setFilterProcess(preset.proc);
                                    }}
                                    className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#00df9a]/50 hover:bg-[#00df9a]/5 transition-all group"
                                >
                                    <p className="text-[8px] font-black text-gray-400 group-hover:text-white uppercase tracking-tighter">{preset.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2 border-t border-white/5">
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Varietal</label>
                            <select 
                                value={filterVariety}
                                onChange={(e) => setFilterVariety(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-[9px] font-bold text-white outline-none"
                            >
                                <option value="ALL">ALL</option>
                                <option value="GEISHA">Geisha</option>
                                <option value="BOURBON">Bourbon</option>
                                <option value="CATURRA">Caturra</option>
                                <option value="CASTILLO">Castillo</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Proceso</label>
                            <select 
                                value={filterProcess}
                                onChange={(e) => setFilterProcess(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-[9px] font-bold text-white outline-none"
                            >
                                <option value="ALL">ALL</option>
                                <option value="LAVADO">Lavado</option>
                                <option value="HONEY">Honey</option>
                                <option value="NATURAL">Natural</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2 border-t border-white/5">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setViewMode('ORIGEN')} 
                                className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${viewMode === 'ORIGEN' ? 'bg-[#00df9a] text-black border-[#00df9a]' : 'border-white/10 text-gray-500'}`}
                            >
                                Origen
                            </button>
                            <button 
                                onClick={() => setViewMode('LOGISTICA')} 
                                className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${viewMode === 'LOGISTICA' ? 'bg-[#00df9a] text-black border-[#00df9a]' : 'border-white/10 text-gray-500'}`}
                            >
                                Logística
                            </button>
                        </div>
                        <button 
                            onClick={() => setViewMode('CONSUMO')} 
                            className={`w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${viewMode === 'CONSUMO' ? 'bg-[#ffde59] text-black border-[#ffde59]' : 'border-white/10 text-gray-500 hover:border-[#ffde59]/50'}`}
                        >
                            Deep Trace (Escaneos)
                        </button>
                    </div>
                </div>

                {/* 2. MÉTRICAS (SMALLER & COMPACT) */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest mb-1">Masa Crítica</p>
                        <p className="text-lg font-black tracking-tighter">{(stats.totalWeight / 1000).toFixed(1)} <span className="text-[10px] text-[#00df9a]">T</span></p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest mb-1">Calidad (AVG)</p>
                        <p className="text-lg font-black tracking-tighter">{stats.avgScore} <span className="text-[10px] text-[#00df9a]">PTS</span></p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 col-span-2 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest mb-0.5">Cumplimiento Regulatorio</p>
                            <p className="text-sm font-black tracking-tighter">{stats.complianceRate}% <span className="text-[9px] text-[#00df9a]">EUDR</span></p>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-[#00df9a]/20 border-t-[#00df9a] animate-spin"></div>
                    </div>
                </div>

                <div className="mt-auto space-y-3">
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#00df9a] transition-all"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        Acceso Viewer
                    </button>
                    
                    <div className="bg-[#00df9a]/5 border border-[#00df9a]/20 p-4 rounded-2xl relative overflow-hidden">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[#00df9a] mb-1">Sistema Live</h4>
                        <p className="text-[8px] text-gray-400 leading-tight uppercase font-bold">{stats.activeAssociations} Asociaciones en Red.</p>
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
                        zoomControl={false}
                        attributionControl={false}
                        worldCopyJump={true}
                    >
                        <MapController />
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {lots
                          .filter(lot => filterVariety === 'ALL' || lot.variety?.toUpperCase() === filterVariety)
                          .filter(lot => filterProcess === 'ALL' || lot.process?.toUpperCase()?.includes(filterProcess))
                          .map((lot, index) => {
                            const lat = lot.latitude || (4 + Math.random() * 4);
                            const lon = lot.longitude || (-76 + Math.random() * 3);
                            
                            // Trayectoria Internacional con Lógica Marítima
                            const destNames = Object.keys(PORTS_GLOBAL);
                            const destName = destNames[index % destNames.length];
                            const finalDestination = PORTS_GLOBAL[destName as keyof typeof PORTS_GLOBAL];
                            
                            // Determinamos puerto de salida según destino
                            const isPacific = ['TOKYO', 'SHANGHAI', 'SINGAPORE', 'SYDNEY', 'SAN_FRANCISCO'].includes(destName);
                            const portColombia = isPacific ? PORT_BUENAVENTURA : PORT_CARTAGENA;

                            // Punto en el mar (Tránsito lógico)
                            const midLat = (portColombia[0] + finalDestination[0]) / 2 + (isPacific ? -8 : 5);
                            const midLon = (portColombia[1] + finalDestination[1]) / 2;

                            return (
                                <React.Fragment key={lot.id}>
                                    {/* Origen */}
                                    <Marker 
                                        position={[lat, lon]} 
                                        icon={createSignalIcon(1, selectedLotId === lot.id)}
                                        eventHandlers={{
                                            click: () => setSelectedLotId(lot.id === selectedLotId ? null : lot.id)
                                        }}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="p-2">
                                                <p className="text-[10px] font-black uppercase tracking-tighter">{lot.lot_number}</p>
                                                <p className="text-[9px] font-bold text-[#00df9a] mt-1">{lot.variety} • {lot.process}</p>
                                            </div>
                                        </Popup>
                                    </Marker>

                                    {/* Ruta a Puerto Nacional (Solo si está seleccionado) */}
                                    {selectedLotId === lot.id && (
                                        <Polyline 
                                            positions={[[lat, lon], portColombia as any]} 
                                            pathOptions={{ color: '#00df9a', weight: 2, opacity: 0.6, dashArray: '5, 10' }} 
                                        />
                                    )}

                                    {/* Ruta Internacional y Consumo (Diferenciado por modo) */}
                                    {(viewMode === 'LOGISTICA' || viewMode === 'CONSUMO') && selectedLotId === lot.id && (
                                        <>
                                            {/* Trayectoria Base (Logística) */}
                                            <Polyline 
                                                positions={[portColombia as any, [midLat, midLon], finalDestination as any]} 
                                                pathOptions={{ 
                                                    color: '#00df9a', 
                                                    weight: 3, 
                                                    opacity: 1, 
                                                    dashArray: '10, 20'
                                                }} 
                                            />
                                            
                                            <Marker position={[midLat, midLon]} icon={createSignalIcon(0.6, false, '#ffffff')}>
                                                <Popup>En Tránsito: {lot.lot_number}</Popup>
                                            </Marker>

                                            <Marker position={finalDestination as any} icon={createSignalIcon(1.5, true)}>
                                                <Popup>Nodo de Desembarque: {lot.lot_number}</Popup>
                                            </Marker>

                                            {/* Solo mostrar Consumo si el modo es CONSUMO */}
                                            {viewMode === 'CONSUMO' && (
                                                <>
                                                    {Object.entries(CONSUMER_NODES).slice(index % 3, (index % 3) + 1).map(([cityName, cityCoords]) => (
                                                        <React.Fragment key={cityName}>
                                                            <Polyline 
                                                                positions={[finalDestination as any, cityCoords as any]} 
                                                                pathOptions={{ color: '#ffde59', weight: 1.5, opacity: 0.6, dashArray: '3, 6' }} 
                                                            />
                                                            <Marker position={cityCoords as any} icon={createSignalIcon(1, true, '#ffde59')}>
                                                                <Popup className="custom-popup">
                                                                    <div className="p-2">
                                                                        <p className="text-[10px] font-black uppercase text-[#ffde59]">Consumer Scan Active</p>
                                                                        <p className="text-[9px] font-bold mt-1">{cityName} • Cafetería de Especialidad</p>
                                                                        <p className="text-[8px] text-gray-400 mt-0.5">Escaneo de QR detectado • Trazabilidad Deep</p>
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

                        {/* Puertos Nacionales - Permanentes (Signal Icons) */}
                        <Marker position={PORT_BUENAVENTURA as any} icon={createSignalIcon(1, false, '#ffffff')}>
                            <Popup>Puerto de Buenaventura</Popup>
                        </Marker>
                        <Marker position={PORT_CARTAGENA as any} icon={createSignalIcon(1, false, '#ffffff')}>
                            <Popup>Puerto de Cartagena</Popup>
                        </Marker>

                        {/* Nodos de Consumo Mundial - Permanentes (Signal Icons) */}
                        {Object.entries(PORTS_GLOBAL).map(([name, coords]) => (
                            <Marker key={name} position={coords as any} icon={createSignalIcon(0.8, false, '#00df9a')}>
                                <Popup>Puerto Global: {name}</Popup>
                            </Marker>
                        ))}

                        {/* Nodos de Consumidor Final - Deep Traceability (Signal Icons) */}
                        {Object.entries(CONSUMER_NODES).map(([name, coords]) => (
                            <Marker key={name} position={coords as any} icon={createSignalIcon(0.6, false, '#ffde59')}>
                                <Popup>Punto de Consumo: {name}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* Overlays de Interfaz (HUD) */}
                <div className="absolute top-8 right-8 z-[1000] flex flex-col gap-4">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Global Status</p>
                            <p className="text-[10px] font-black text-[#00df9a] uppercase">Operational Hub Active</p>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex gap-2">
                            {['UTC', 'BOG', 'AMS', 'NYC'].map(tz => (
                                <div key={tz} className="text-[9px] font-black text-white/40 px-2 py-1 border border-white/5 rounded bg-white/5">{tz}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 right-8 z-[1000] w-96 bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-[32px]">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-[0.2em]">Logistics Velocity (24h)</p>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { t: '00:00', v: 20 }, { t: '04:00', v: 35 }, { t: '08:00', v: 65 }, 
                                { t: '12:00', v: 45 }, { t: '16:00', v: 80 }, { t: '20:00', v: 55 }
                            ]}>
                                <Area type="monotone" dataKey="v" stroke="#00df9a" fill="url(#colorV)" />
                                <defs>
                                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00df9a" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#00df9a" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MODAL COMPARTIR ESTILO DRIVE */}
                {showShareModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl p-10 shadow-3xl text-center space-y-6">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-[#00df9a]">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Compartir Radar</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Concede permisos de "Solo Lectura" a este panel de control.</p>
                            
                            <div className="space-y-2 text-left">
                                <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Email del Invitado</label>
                                <input 
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="ej: gerencia@federacion.org"
                                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm focus:border-[#00df9a] transition-all outline-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowShareModal(false)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleInvite}
                                    disabled={isInviting}
                                    className="flex-2 bg-[#00df9a] text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00df9a]-bright transition-all disabled:opacity-50"
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
