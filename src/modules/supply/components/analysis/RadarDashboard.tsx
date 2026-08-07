'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

const MapControllerInternal = React.memo(({ useMap, useMapEvents, isGlobalProjection, viewMode }: any) => {
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
});


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
    SYDNEY: [-33.8688, 151.2093],
    GENOA: [44.4056, 8.9211]
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
        id: 'global-evidence-dash',
        lot_number: 'PO-2026-08-001',
        farmer_name: 'Consolidated Commercial Blend',
        farm_name: 'Axis One Export Network',
        region: 'COLOMBIA MULTI-REGION',
        variety: 'COMMERCIAL BLEND',
        process: 'Excelso EP 10',
        purchase_weight: 21000,
        q_score: 84.5,
        latitude: 4.5709,
        longitude: -74.2973,
        is_global: true,
        destinations: ['HAMBURG'],
        attributes: {
            fermentation: 'Standard Washed',
            ph: '4.00 / 14.5°Bx',
            secado: 'Silo Secado Mecánico',
            notes: 'Perfil limpio, chocolate con leche, acidez media.'
        }
    },
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
        id: 'global-ethiopia-sidama',
        lot_number: 'AX1-ETH-SIDA-04',
        farmer_name: 'Kenenisa Bekele',
        farm_name: 'Sidama Organic Farmers',
        region: 'SIDAMA, ETHIOPIA',
        variety: 'HEIRLOOM',
        process: 'Natural Anaeróbico',
        purchase_weight: 12500,
        q_score: 89.8,
        latitude: 6.784,
        longitude: 38.385,
        is_global: true,
        destinations: ['TOKYO', 'DUBAI'],
        attributes: {
            fermentation: '120h Anaeróbica Seca en Cereza',
            ph: '3.70 / 17.5°Bx',
            secado: 'Camas Africanas Elevadas',
            notes: 'Notas florales intensas, arándano maduro, jazmín y acidez sedosa.'
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
        id: 'global-brazil-minas',
        lot_number: 'AX1-BRA-MINAS-52',
        farmer_name: 'Aline Silva',
        farm_name: 'Fazenda Vista Alegre',
        region: 'SUL DE MINAS, BRAZIL',
        variety: 'YELLOW BOURBON',
        process: 'Pulped Natural',
        purchase_weight: 28000,
        q_score: 85.8,
        latitude: -21.802,
        longitude: -45.864,
        is_global: true,
        destinations: ['HAMBURG', 'ROTTERDAM'],
        attributes: {
            fermentation: 'Despulpado Directo con Mucílago',
            ph: '4.15 / 15.0°Bx',
            secado: 'Patio Sol Pleno Controlado',
            notes: 'Dulce caramelo, vainilla, cuerpo cremoso y acidez suave.'
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
        id: 'global-indonesia-bali',
        lot_number: 'AX1-IDN-BALI-18',
        farmer_name: 'Wayan Gede',
        farm_name: 'Kintamani Highlands',
        region: 'BALI, INDONESIA',
        variety: 'KARTIKA',
        process: 'Full Honey',
        purchase_weight: 8400,
        q_score: 87.5,
        latitude: -8.244,
        longitude: 115.342,
        is_global: true,
        destinations: ['SYDNEY', 'SHANGHAI'],
        attributes: {
            fermentation: '36h Honey en Tanques de Concreto',
            ph: '3.90 / 16.0°Bx',
            secado: 'Secado Lento en Camas Africanas',
            notes: 'Sabor exótico a mandarina dulce, clavo de olor y notas de cacao.'
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
        destinations: ['GENOA', 'ROTTERDAM'],
        attributes: {
            fermentation: '48h Cereza Entera + 24h Mucílago',
            ph: '3.75 / 19.5°Bx',
            secado: 'Marquesinas Sombreadas Secado Lento',
            notes: 'Exótico perfil floral, melocotón maduro, miel silvestre y final persistente.'
        }
    }
];

const TRENDS_DATA = {
    ANAEROBICO: [
        { name: 'Ene', value: 120 },
        { name: 'Feb', value: 135 },
        { name: 'Mar', value: 150 },
        { name: 'Abr', value: 172 },
        { name: 'May', value: 195 },
        { name: 'Jun', value: 210 },
    ],
    GEISHA: [
        { name: 'Ene', value: 45 },
        { name: 'Feb', value: 52 },
        { name: 'Mar', value: 68 },
        { name: 'Abr', value: 74 },
        { name: 'May', value: 89 },
        { name: 'Jun', value: 105 },
    ],
    HONEY: [
        { name: 'Ene', value: 80 },
        { name: 'Feb', value: 85 },
        { name: 'Mar', value: 92 },
        { name: 'Abr', value: 110 },
        { name: 'May', value: 115 },
        { name: 'Jun', value: 130 },
    ]
};

const BUYERS_DIRECTORY = [
    { name: 'Hamburgo Import Co.', country: 'Alemania 🇩🇪', preference: 'Naturales / Anaeróbicos', vol: '15 cont/año', contact: 'hamburg-import.de' },
    { name: 'Solberg & Hansen', country: 'Noruega 🇳🇴', preference: 'Lavados de alta puntuación', vol: '6 cont/año', contact: 'solberghansen.no' },
    { name: 'Blue Bottle Roasters', country: 'EE.UU. 🇺🇸', preference: 'Orgánicos y Honey', vol: '40 cont/año', contact: 'bluebottlecoffee.com' },
    { name: 'The Barn Coffee Roast', country: 'Alemania 🇩🇪', preference: 'Anaeróbicos / Varietales Exóticos', vol: '4 cont/año', contact: 'thebarn.de' },
    { name: 'Gardelli Specialty', country: 'Italia 🇮🇹', preference: 'Lotes SCA 88+ Exóticos', vol: '2 cont/año', contact: 'gardellicoffee.com' },
    { name: 'Onyx Coffee Lab', country: 'EE.UU. 🇺🇸', preference: 'Procesos de Co-fermentación', vol: '8 cont/año', contact: 'onyxcoffeelab.com' }
];

const SEARCH_SIGNALS = [
    { term: 'Pink Bourbon', growth: '+45%', type: 'up' },
    { term: 'Choque Térmico', growth: '+68%', type: 'up' },
    { term: 'Castillo Lavado', growth: '-5%', type: 'down' },
    { term: 'Sidra Honey', growth: '+30%', type: 'up' },
    { term: 'Gesha Natural', growth: '+25%', type: 'up' }
];

const getLotCoordinates = (lot: any, seedIndex: number) => {
    const regionStr = (lot.region || '').toUpperCase();
    
    // Deterministic pseudo-random offsets based on index so dots remain perfectly stable on re-renders
    const seedLat = Math.sin(seedIndex * 12.9898) * 43758.5453;
    const jitterLat = (seedLat - Math.floor(seedLat) - 0.5) * 0.22;

    const seedLon = Math.cos(seedIndex * 78.233) * 43758.5453;
    const jitterLon = (seedLon - Math.floor(seedLon) - 0.5) * 0.22;
    
    // 1. Explicit manual coordinates fallback (highest priority)
    if (lot.latitude && lot.longitude) {
        return { lat: Number(lot.latitude), lon: Number(lot.longitude) };
    }
    if (lot.process_data?.latitude && lot.process_data?.longitude) {
        return { lat: Number(lot.process_data.latitude), lon: Number(lot.process_data.longitude) };
    }

    // 2. Prioritize high-precision department coordinates dictionary for simulated lots
    for (const [dept, coords] of Object.entries(REGION_COORDINATES)) {
        if (regionStr.includes(dept)) {
            return { lat: coords.lat + jitterLat, lon: coords.lon + jitterLon };
        }
    }

    // Default to the Central Colombian Coffee Axis with a wider default spread
    const baseLat = 4.60;
    const baseLon = -75.60;
    const fallbackJitterLat = (seedLat - Math.floor(seedLat) - 0.5) * 0.8;
    const fallbackJitterLon = (seedLon - Math.floor(seedLon) - 0.5) * 0.8;
    
    return { lat: baseLat + fallbackJitterLat, lon: baseLon + fallbackJitterLon };
};

export default function RadarDashboard({ user, onClose }: { user: any; onClose?: () => void }) {
    const [showSidebar, setShowSidebar] = useState(true);
    const [selectedTrend, setSelectedTrend] = useState<'ANAEROBICO' | 'GEISHA' | 'HONEY'>('ANAEROBICO');
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
    const [filterPreset, setFilterPreset] = useState<'ALL' | 'SIMULACION' | 'COMPETENCIA' | 'REAL' | 'EVIDENCE_DASH'>('EVIDENCE_DASH');

    // Vista: ORIGEN (Colombia), LOGISTICA (Puertos), CONSUMO (Escaneos Deep), MARKET (Terminal de Datos)
    const [viewMode, setViewMode] = useState<'ORIGEN' | 'LOGISTICA' | 'CONSUMO' | 'MARKET'>('LOGISTICA');
    const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

    // Controles de Presentación Global Exclusivos de Super Admin Julio César
    const [isGlobalProjection, setIsGlobalProjection] = useState(true);
    const [showMaritimalLines, setShowMaritimalLines] = useState(true);
    const [showConsumerScans, setShowConsumerScans] = useState(true);
    const [showSimTransit, setShowSimTransit] = useState(true);
    const [showAllGlobalRoutes, setShowAllGlobalRoutes] = useState(false);

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
                .select('*, physical_analysis(*)')
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
                if (filterPreset === 'REAL') return lot.lot_number?.includes('DM-');
                if (filterPreset === 'EVIDENCE_DASH') return lot.lot_number?.includes('PO-2026-');
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
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans text-neutral-200">
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
                    background: rgba(23, 23, 23, 0.9) !important;
                    border: 1px solid rgba(0, 255, 178, 0.3) !important;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5) !important;
                    color: #00FFB2 !important;
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
                    background: #0a0a0a !important;
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
                    background: rgba(23, 23, 23, 0.95) !important;
                    color: #e5e5e5 !important;
                    border: 1.5px solid rgba(0, 255, 178, 0.5);
                    backdrop-filter: blur(12px);
                    border-radius: 12px !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
                }
                .custom-popup .leaflet-popup-tip {
                    background: rgba(23, 23, 23, 0.95) !important;
                    border: 1.5px solid rgba(0, 255, 178, 0.5);
                }
                /* Sleek Neon Zoom Controls */
                .leaflet-bar {
                    border: none !important;
                    box-shadow: none !important;
                }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background-color: rgba(23, 23, 23, 0.95) !important;
                    color: #00FFB2 !important;
                    border: 1px solid rgba(0, 255, 178, 0.3) !important;
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
                    background-color: #00FFB2 !important;
                    color: #0a0a0a !important;
                    box-shadow: 0 0 15px rgba(0, 255, 178, 0.4) !important;
                    border-color: #00FFB2 !important;
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
            <aside className={`${showSidebar ? 'w-96 p-6 border-r border-neutral-800/80' : 'w-0 p-0 border-r-0 overflow-hidden'} bg-neutral-900/95 backdrop-blur-xl flex flex-col gap-4 z-[2000] shadow-2xl relative transition-all duration-300 sidebar-scroll text-neutral-200`}>
                {showSidebar && (
                    <div className="flex flex-col gap-4 h-full">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center text-[12px] transition-all font-bold shadow-sm"
                                    title="Ocultar Panel"
                                >
                                    ◀
                                </button>
                                {onClose && (
                                    <button 
                                        onClick={onClose}
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg text-[9px] font-black uppercase transition-all shadow-sm border border-red-500/20 hover:border-red-500"
                                        title="Cerrar Radar"
                                    >
                                        Cerrar Radar
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-right">
                                <div>
                                    <h2 className="text-xs font-black uppercase text-white tracking-wider">Control Center</h2>
                                    <p className="text-[9px] text-brand-green font-bold uppercase tracking-widest">Global Logistics</p>
                                </div>
                            </div>
                        </div>

                {/* 1. CONFIGURACIONES (TOP) */}
                <div className="bg-neutral-800/50 border border-neutral-700/60 p-5 rounded-2xl space-y-4 backdrop-blur-md">
                    <div>
                        <h4 className="text-[9px] font-black uppercase text-[#00FFB2] tracking-wider mb-3">Preestablecidos</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setFilterPreset('EVIDENCE_DASH')}
                                className={`col-span-2 text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'EVIDENCE_DASH' ? 'bg-[#00FFB2] border-[#00FFB2] text-black shadow-[0_0_15px_rgba(0,255,178,0.3)]' : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:border-[#00FFB2] hover:text-[#00FFB2]'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Evidence Dashboard</p>
                            </button>
                            <button
                                onClick={() => setFilterPreset('SIMULACION')}
                                className={`text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'SIMULACION' ? 'bg-[#00FFB2] border-[#00FFB2] text-black shadow-[0_0_15px_rgba(0,255,178,0.3)]' : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:border-[#00FFB2] hover:text-[#00FFB2]'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Simulación</p>
                            </button>
                            <button
                                onClick={() => setFilterPreset('COMPETENCIA')}
                                className={`text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'COMPETENCIA' ? 'bg-[#00FFB2] border-[#00FFB2] text-black shadow-[0_0_15px_rgba(0,255,178,0.3)]' : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:border-[#00FFB2] hover:text-[#00FFB2]'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Competencia</p>
                            </button>
                            <button
                                onClick={() => setFilterPreset('ALL')}
                                className={`col-span-2 text-center px-3 py-2 rounded-lg border transition-all ${filterPreset === 'ALL' ? 'bg-[#00FFB2] border-[#00FFB2] text-black shadow-[0_0_15px_rgba(0,255,178,0.3)]' : 'bg-neutral-900/80 border-neutral-700 text-neutral-300 hover:border-[#00FFB2] hover:text-[#00FFB2]'}`}
                            >
                                <p className="text-[9px] font-black uppercase tracking-wide">Mostrar Todos</p>
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2 border-t border-neutral-700/80">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Varietal</label>
                            <select 
                                value={filterVariety}
                                onChange={(e) => setFilterVariety(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-[9px] font-bold text-neutral-200 outline-none focus:border-[#00FFB2] transition-all"
                            >
                                <option value="ALL" className="bg-neutral-900">ALL</option>
                                <option value="GEISHA" className="bg-neutral-900">Geisha</option>
                                <option value="BOURBON" className="bg-neutral-900">Bourbon</option>
                                <option value="CATURRA" className="bg-neutral-900">Caturra</option>
                                <option value="CASTILLO" className="bg-neutral-900">Castillo</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Proceso</label>
                            <select 
                                value={filterProcess}
                                onChange={(e) => setFilterProcess(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-[9px] font-bold text-neutral-200 outline-none focus:border-[#00FFB2] transition-all"
                            >
                                <option value="ALL" className="bg-neutral-900">ALL</option>
                                <option value="LAVADO" className="bg-neutral-900">Lavado</option>
                                <option value="HONEY" className="bg-neutral-900">Honey</option>
                                <option value="NATURAL" className="bg-neutral-900">Natural</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2 border-t border-neutral-700/80">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setViewMode('ORIGEN')} 
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'ORIGEN' ? 'bg-[#00FFB2]/20 text-[#00FFB2] border-[#00FFB2] shadow-[0_0_15px_rgba(0,255,178,0.2)]' : 'border-neutral-700 text-neutral-400 hover:text-[#00FFB2] hover:border-[#00FFB2]/50 bg-neutral-900/50'}`}
                            >
                                Origen
                            </button>
                            <button 
                                onClick={() => setViewMode('LOGISTICA')} 
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'LOGISTICA' ? 'bg-[#00FFB2]/20 text-[#00FFB2] border-[#00FFB2] shadow-[0_0_15px_rgba(0,255,178,0.2)]' : 'border-neutral-700 text-neutral-400 hover:text-[#00FFB2] hover:border-[#00FFB2]/50 bg-neutral-900/50'}`}
                            >
                                Logística
                            </button>
                        </div>
                        <button 
                            onClick={() => setViewMode('CONSUMO')} 
                            className={`w-full py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'CONSUMO' ? 'bg-[#00FFB2]/20 text-[#00FFB2] border-[#00FFB2] shadow-[0_0_20px_rgba(0,255,178,0.2)]' : 'border-neutral-700 text-neutral-400 hover:text-[#00FFB2] hover:border-[#00FFB2]/50 bg-neutral-900/50'}`}
                        >
                            Deep Trace (Escaneos)
                        </button>
                        <button 
                            onClick={() => setViewMode('MARKET')} 
                            className={`w-full py-2.5 rounded-lg text-[9px] font-black uppercase border transition-all ${viewMode === 'MARKET' ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-500/50 bg-neutral-900/50'}`}
                        >
                            ⚡ Coffee Radar Terminal
                        </button>
                    </div>
                </div>

                {/* 2. MÉTRICAS (SMALLER & COMPACT) */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/80 shadow-sm">
                        <p className="text-neutral-400 text-[9px] font-black uppercase mb-1">Masa Crítica</p>
                        <p className="text-lg font-black text-white">{(stats.totalWeight / 1000).toFixed(1)} <span className="text-[11px] text-[#00FFB2] font-bold">T</span></p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/80 shadow-sm">
                        <p className="text-neutral-400 text-[9px] font-black uppercase mb-1">Calidad (AVG)</p>
                        <p className="text-lg font-black text-white">{stats.avgScore} <span className="text-[11px] text-[#00FFB2] font-bold">PTS</span></p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/80 col-span-2 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-neutral-400 text-[9px] font-black uppercase mb-0.5">Cumplimiento Regulatorio</p>
                            <p className="text-sm font-black text-white">{stats.complianceRate}% <span className="text-[9px] text-[#00FFB2] font-bold">EUDR</span></p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00FFB2]/10 text-[#00FFB2] flex items-center justify-center border border-[#00FFB2]/30">
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
                </div>
                )}
            </aside>

            <main className={`flex-1 relative ${viewMode === 'MARKET' ? 'bg-[#0a0a0a] overflow-y-auto' : ''}`}>
                 {!showSidebar && (
                     <div className="absolute top-6 left-6 z-[1001] flex items-center gap-2 bg-white/95 dark:bg-neutral-900/95 border border-gray-200 dark:border-neutral-800 rounded-full p-1.5 shadow-xl backdrop-blur-md no-print">
                         {onClose && (
                             <button
                                 onClick={onClose}
                                 className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white rounded-full text-[9px] font-black uppercase transition-all active:scale-95"
                             >
                                 ← Cerrar Radar
                             </button>
                         )}
                         <button
                             onClick={() => setShowSidebar(true)}
                             className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center text-[10px] transition-all font-bold"
                             title="Mostrar Panel"
                         >
                             ▶
                         </button>
                     </div>
                 )}
                 {viewMode === 'MARKET' ? (
                    <div className="p-8 space-y-8 text-neutral-200 animate-in fade-in duration-300">
                        {/* Header Terminal */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
                            <div>
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                                    Terminal de Inteligencia Comercial
                                </span>
                                <h1 className="text-3xl font-black tracking-tight text-white mt-2">COFFEE RADAR</h1>
                                <p className="text-xs text-neutral-400 mt-1 uppercase font-bold tracking-wide">
                                    Monitoreo de Ofertas, Tendencias de Consumo y Directorio Activo de Compradores
                                </p>
                            </div>
                            
                            {/* NY C Price Ticker */}
                            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex items-center gap-6 shadow-xl backdrop-blur-md">
                                <div className="border-r border-neutral-800 pr-6">
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Bolsa NY Contrato C</p>
                                    <p className="text-lg font-black text-white mt-0.5">228.45 <span className="text-xs font-bold text-neutral-400">¢/lb</span></p>
                                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5">
                                        ▲ +2.15% (Hoy)
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Diferencial Colombia</p>
                                    <p className="text-lg font-black text-amber-500 mt-0.5">+38.00 <span className="text-xs font-bold text-neutral-400">¢/lb</span></p>
                                    <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest mt-1 block">
                                        Premium FNC
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Fila 1: Métricas Críticas de Mercado */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                                <p className="text-neutral-500 text-[9px] font-black uppercase tracking-wider mb-2">Compradores Activos</p>
                                <p className="text-3xl font-black text-white">87 Tostadores</p>
                                <p className="text-[10px] text-neutral-400 mt-1 uppercase font-semibold">
                                    Buscando Naturales en Alemania y EE.UU.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                                <p className="text-neutral-500 text-[9px] font-black uppercase tracking-wider mb-2">Proceso Líder</p>
                                <p className="text-3xl font-black text-emerald-500">Anaeróbicos</p>
                                <p className="text-[10px] text-neutral-400 mt-1 uppercase font-semibold">
                                    +75% de presencia en menús retail
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                                <p className="text-neutral-500 text-[9px] font-black uppercase tracking-wider mb-2">Origen Más Buscado</p>
                                <p className="text-3xl font-black text-white">Colombia</p>
                                <p className="text-[10px] text-neutral-400 mt-1 uppercase font-semibold">
                                    Seguido de Etiopía y Costa Rica
                                </p>
                            </div>
                        </div>

                        {/* Fila 2: Gráfico de Tendencias y Señales de Búsqueda */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Trend Chart (2/3 de ancho) */}
                            <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 backdrop-blur-md">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-sm font-black uppercase text-white tracking-wider">Histórico de Ofertas en Tostadores</h3>
                                        <p className="text-[10px] text-neutral-500 uppercase font-semibold mt-0.5">Frecuencia de aparición de procesos en menús globales</p>
                                    </div>
                                    <div className="flex gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                                        {(['ANAEROBICO', 'GEISHA', 'HONEY'] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setSelectedTrend(t)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedTrend === t ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="w-full">
                                    <ResponsiveContainer width="100%" height={240}>
                                        <AreaChart data={TRENDS_DATA[selectedTrend]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={selectedTrend === 'GEISHA' ? '#10b981' : '#f59e0b'} stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor={selectedTrend === 'GEISHA' ? '#10b981' : '#f59e0b'} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                                            <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} />
                                            <YAxis stroke="#525252" fontSize={10} tickLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke={selectedTrend === 'GEISHA' ? '#10b981' : '#f59e0b'} 
                                                strokeWidth={2} 
                                                fillOpacity={1} 
                                                fill="url(#colorValue)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Search Intent */}
                            <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-md">
                                <div>
                                    <h3 className="text-sm font-black uppercase text-white tracking-wider mb-1">Señales de Búsqueda</h3>
                                    <p className="text-[10px] text-neutral-500 uppercase font-semibold mb-4">Palabras clave con mayor crecimiento global</p>
                                    
                                    <div className="space-y-3">
                                        {SEARCH_SIGNALS.map((sig, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/80 border border-neutral-800/60 rounded-xl">
                                                <span className="text-xs font-bold text-neutral-200">{sig.term}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sig.type === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {sig.type === 'up' ? '▲' : '▼'} {sig.growth}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-neutral-800/60">
                                    <p className="text-[9px] text-neutral-500 uppercase font-bold text-center">Datos recopilados de Google Trends e Instagram Specialty Coffee Tags</p>
                                </div>
                            </div>
                        </div>

                        {/* Fila 3: Directorio Vivo de Compradores */}
                        <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 backdrop-blur-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-sm font-black uppercase text-white tracking-wider">Directorio Vivo de Compradores</h3>
                                    <p className="text-[10px] text-neutral-500 uppercase font-semibold mt-0.5">Tostadores e importadores activos y sus preferencias actuales</p>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por país o proceso..." 
                                        className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs w-64 focus:outline-none focus:border-amber-500 transition-all text-white"
                                    />
                                    <span className="absolute right-3 top-2.5 text-neutral-600 text-xs">🔍</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
                                            <th className="pb-3 pl-2">Comprador</th>
                                            <th className="pb-3">País de Destino</th>
                                            <th className="pb-3">Preferencia de Café</th>
                                            <th className="pb-3">Volumen Est.</th>
                                            <th className="pb-3">Web / Contacto</th>
                                            <th className="pb-3 text-right pr-2">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900">
                                        {BUYERS_DIRECTORY.map((buyer, i) => (
                                            <tr key={i} className="hover:bg-neutral-900/30 transition-all">
                                                <td className="py-4 pl-2 font-black text-white">{buyer.name}</td>
                                                <td className="py-4 text-neutral-300">{buyer.country}</td>
                                                <td className="py-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                                                        {buyer.preference}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-neutral-300 font-bold">{buyer.vol}</td>
                                                <td className="py-4 text-neutral-500 underline font-mono">{buyer.contact}</td>
                                                <td className="py-4 text-right pr-2">
                                                    <button className="bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-[9px] px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-amber-600/10">
                                                        Ofrecer Lote
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Fila 4: Coffee Radar Weekly - Newsletter Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                                <div className="space-y-2">
                                    <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                        Newsletter Premium
                                    </span>
                                    <h4 className="text-base font-black text-white">Coffee Radar Weekly — Edición Vol. 42</h4>
                                    <p className="text-xs text-neutral-400 leading-relaxed">
                                        "El impacto de la sequía en el diferencial de cafés naturales de Brasil y cómo la demanda alemana de procesos de fermentación anaeróbica está abriendo una ventana de oportunidad única para los productores del Huila en este tercer trimestre..."
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800">
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Publicado hace 2 días</span>
                                    <button className="text-amber-500 text-[10px] font-black uppercase tracking-wider hover:underline flex items-center gap-1">
                                        Leer Edición Completa ➔
                                    </button>
                                </div>
                            </div>

                            <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-md">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase text-white tracking-wider">Suscripción Activa</h4>
                                    <p className="text-[10px] text-neutral-400 uppercase font-semibold leading-relaxed">
                                        Acceso completo ilimitado a la base de datos de tostadores y el boletín analítico semanal.
                                    </p>
                                </div>
                                <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 mt-4 text-center">
                                    <span className="text-[9px] text-neutral-500 uppercase font-black tracking-wider block">Tu tarifa actual</span>
                                    <span className="text-2xl font-black text-white block mt-1">USD 49<span className="text-xs text-neutral-500">/mes</span></span>
                                    <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider mt-1 block">Facturación Activa vía Stripe</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 ) : (
                    L && (
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
                        {leafletHooks?.useMap && leafletHooks?.useMapEvents && (
                            <MapControllerInternal 
                                useMap={leafletHooks.useMap} 
                                useMapEvents={leafletHooks.useMapEvents} 
                                isGlobalProjection={isGlobalProjection} 
                                viewMode={viewMode} 
                            />
                        )}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
                            const destinationsToRender = isGlobal ? (lot.destinations || [destName]) : (lot.lot_number?.includes('DM-') ? ['GENOA'] : [destName]);

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
                                        <Tooltip direction="top" className="custom-map-tooltip">
                                            <span className="font-bold">{lot.lot_number}</span>
                                        </Tooltip>
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
                    )
                )}

                {/* PANEL LATERAL DERECHO ESTÁTICO (Side Panel) */}
                {selectedLotId && (
                    <div className="absolute top-10 right-10 w-80 bg-neutral-900/90 border border-[#00FFB2]/30 rounded-2xl p-5 shadow-2xl z-[1000] backdrop-blur-md overflow-y-auto max-h-[85vh] animate-in slide-in-from-right-10 duration-300">
                        {(() => {
                            const lot = projectedLots.find(l => l.id === selectedLotId);
                            if (!lot) return null;
                            const isGlobal = !!lot.destinations;
                            // Recalcular destinationsToRender igual que en el marcador
                            const destNames = Object.keys(PORTS_GLOBAL);
                            const index = projectedLots.indexOf(lot);
                            const dName = isGlobal ? lot.destinations?.[0] : (lot.lot_number?.includes('DM-') ? 'GENOA' : 'ROTTERDAM');
                            const destinationsToRender = isGlobal ? (lot.destinations || [dName]) : (lot.lot_number?.includes('DM-') ? ['GENOA'] : [dName]);
                            
                            return (
                                <div className="space-y-4 text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-black uppercase text-[#00FFB2] tracking-wider border-b border-[#00FFB2]/20 pb-1">
                                                {lot.lot_number} {isGlobal && <span className="text-[9px] bg-[#00FFB2]/10 text-[#00FFB2] px-1.5 py-0.5 rounded font-black ml-2 uppercase tracking-wider">Global</span>}
                                            </p>
                                        </div>
                                        <button onClick={() => setSelectedLotId(null)} className="text-gray-400 hover:text-white cursor-pointer bg-neutral-800 rounded p-1">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                        </button>
                                    </div>
                                    <div className="text-xs space-y-1.5">
                                        <p><span className="text-neutral-400 font-bold uppercase">Productor:</span> <span className="font-black text-white">{lot.farmer_name}</span></p>
                                        <p><span className="text-neutral-400 font-bold uppercase">Finca:</span> <span className="font-black text-white">{lot.farm_name}</span></p>
                                        <p><span className="text-neutral-400 font-bold uppercase">Variedad:</span> <span className="font-bold text-[#00FFB2]">{lot.variety}</span></p>
                                        <p><span className="text-neutral-400 font-bold uppercase">Proceso:</span> <span className="font-bold text-[#00FFB2]">{lot.process}</span></p>
                                        <p><span className="text-neutral-400 font-bold uppercase">Peso:</span> <span className="font-black text-white">{lot.purchase_weight} kg</span></p>
                                        {isGlobal && lot.q_score && (
                                            <p><span className="text-neutral-400 font-bold uppercase">Calidad Q-Score:</span> <span className="font-black text-[#00FFB2]">{lot.q_score} PTS</span></p>
                                        )}
                                        <div className="pt-2 border-t border-neutral-700/50 mt-2 space-y-1.5">
                                            <p><span className="text-neutral-400 font-bold uppercase">Salida:</span> <span className="font-bold text-white">{isGlobal ? 'Origen Directo' : (['TOKYO', 'SHANGHAI', 'SINGAPORE', 'SYDNEY', 'SAN_FRANCISCO'].some(d => destinationsToRender.includes(d)) ? 'Buenaventura' : 'Cartagena')}</span></p>
                                            <p><span className="text-neutral-400 font-bold uppercase">Llegada:</span> <span className="font-bold text-white">{destinationsToRender.join(', ')}</span></p>
                                        </div>
                                    </div>
                                    
                                    {(isGlobal && lot.attributes) || lot.process_data ? (
                                        <div className="text-[10px] bg-neutral-950/80 p-3 rounded-lg border border-[#00FFB2]/20 space-y-1 mt-4 shadow-inner">
                                            <p className="text-[9px] font-black text-[#00FFB2] uppercase tracking-widest mb-1.5">Parámetros Críticos</p>
                                            {isGlobal && lot.attributes ? (
                                                <>
                                                    <p><span className="text-neutral-400 font-bold">Fermentación:</span> <span className="text-neutral-200 font-semibold">{lot.attributes.fermentation}</span></p>
                                                    <p><span className="text-neutral-400 font-bold">pH / Brix:</span> <span className="text-neutral-200 font-semibold">{lot.attributes.ph}</span></p>
                                                    <p><span className="text-neutral-400 font-bold">Secado:</span> <span className="text-neutral-200 font-semibold">{lot.attributes.secado}</span></p>
                                                    <p className="text-[9px] text-[#00FFB2] italic mt-1.5 font-bold">"{lot.attributes.notes}"</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p><span className="text-neutral-400 font-bold">Humedad:</span> <span className="text-neutral-200 font-semibold">{Array.isArray(lot.physical_analysis) ? lot.physical_analysis[0]?.moisture_pct : lot.physical_analysis?.moisture_pct ?? 'N/A'}%</span></p>
                                                    <p><span className="text-neutral-400 font-bold">aW:</span> <span className="text-neutral-200 font-semibold">{Array.isArray(lot.physical_analysis) ? lot.physical_analysis[0]?.water_activity : lot.physical_analysis?.water_activity ?? 'N/A'}</span></p>
                                                    <p><span className="text-neutral-400 font-bold">Densidad:</span> <span className="text-neutral-200 font-semibold">{Array.isArray(lot.physical_analysis) ? lot.physical_analysis[0]?.density_gl : lot.physical_analysis?.density_gl ?? 'N/A'} g/L</span></p>
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })()}
                    </div>
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
