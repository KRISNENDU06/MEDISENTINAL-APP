import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { AreaSummary } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Layers,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Flame,
  ShieldAlert,
  ChevronRight,
  Info,
  Activity,
} from 'lucide-react';

interface RealWorldSurveillanceMapProps {
  areas: AreaSummary[];
  selectedArea: AreaSummary | null;
  onSelectArea: (area: AreaSummary) => void;
}

// 1. Comprehensive High-Precision Geocoding Table for all Districts, Sub-Divisions & Wards in Odisha
const ODISHA_GEO_COORDS: Record<string, [number, number]> = {
  // Pilot Wards
  'area-1': [20.2883, 85.8456], // Saheed Nagar, Bhubaneswar
  'area-2': [20.3588, 85.8166], // Patia, Bhubaneswar
  'area-3': [20.4789, 85.8364], // CDA Sector 6, Cuttack
  'area-4': [19.8135, 85.8312], // Grand Road, Puri
  'area-5': [20.1834, 85.6179], // Industrial Estate, Khurda

  // 1. Angul District Sub-Locations & Blocks
  pallahara: [21.4333, 85.1833],
  pallahada: [21.4333, 85.1833],
  'pal lahara': [21.4333, 85.1833],
  khalari: [20.9333, 85.1000],
  khulari: [20.9333, 85.1000],
  talcher: [20.9500, 85.2167],
  kaniha: [21.0833, 85.0667],
  'ntpc kaniha': [21.0833, 85.0667],
  athmallik: [20.7167, 84.5333],
  athamallik: [20.7167, 84.5333],
  chhendipada: [21.0833, 84.8667],
  bantala: [20.7333, 85.0167],
  'nalco nagar': [20.8500, 85.1800],
  khamar: [21.3167, 85.1667],
  kishorenagar: [20.8833, 84.5833],
  angul: [20.8444, 85.1511],
  anugul: [20.8444, 85.1511],

  // 2. Bhubaneswar & Khordha Localities & Wards
  dumduma: [20.2450, 85.7860],
  dumuduma: [20.2450, 85.7860],
  'saheed nagar': [20.2883, 85.8456],
  patia: [20.3588, 85.8166],
  nayapalli: [20.2980, 85.8180],
  'irc village': [20.3050, 85.8250],
  chandrasekharpur: [20.3240, 85.8180],
  'cs pur': [20.3240, 85.8180],
  khandagiri: [20.2600, 85.7870],
  jagamara: [20.2580, 85.7920],
  'old town': [20.2400, 85.8330],
  lingaraj: [20.2400, 85.8330],
  rasulgarh: [20.2950, 85.8650],
  mancheswar: [20.3300, 85.8500],
  baramunda: [20.2780, 85.7950],
  'kalinga nagar': [20.2700, 85.7500],
  ghatikia: [20.2750, 85.7650],
  'jaydev vihar': [20.3000, 85.8200],
  jatni: [20.1600, 85.7000],
  khurda: [20.1834, 85.6179],
  khordha: [20.1834, 85.6179],
  bhubaneswar: [20.2961, 85.8245],

  // 3. Cuttack Localities & Sub-Divisions
  'cda sector': [20.4789, 85.8364],
  cda: [20.4789, 85.8364],
  badambadi: [20.4500, 85.8750],
  choudwar: [20.5333, 85.9167],
  jagatpur: [20.5000, 85.9300],
  'buxi bazaar': [20.4630, 85.8750],
  mangalabag: [20.4700, 85.8900],
  'scb medical': [20.4700, 85.8900],
  'college square': [20.4600, 85.8950],
  chauliaganj: [20.4650, 85.9050],
  athagarh: [20.5167, 85.6333],
  banki: [20.3800, 85.5300],
  cuttack: [20.4625, 85.8828],

  // 4. Puri Localities & Sub-Divisions
  'grand road': [19.8135, 85.8312],
  'bada danda': [19.8135, 85.8312],
  'sea beach': [19.7980, 85.8250],
  konark: [19.8876, 86.0945],
  pipili: [20.1167, 85.8333],
  satyabadi: [19.9500, 85.8200],
  sakshigopal: [19.9500, 85.8200],
  nimapada: [20.0800, 86.0100],
  brahmagiri: [19.8000, 85.6500],
  astaranga: [19.9800, 86.2600],
  puri: [19.8135, 85.8312],

  // 5. Sundargarh / Rourkela Sub-Locations
  rourkela: [22.2604, 84.8536],
  panposh: [22.2400, 84.8300],
  uditnagar: [22.2400, 84.8300],
  chhend: [22.2450, 84.8150],
  koira: [21.9167, 85.2333],
  rajgangpur: [22.2000, 84.5800],
  biramitrapur: [22.4000, 84.7333],
  bonai: [21.7500, 84.9667],
  sundargarh: [22.1200, 84.0300],
  sundergarh: [22.1200, 84.0300],

  // 6. Sambalpur Sub-Locations
  burla: [21.5000, 83.8700],
  vimsar: [21.5000, 83.8700],
  hirakud: [21.5200, 83.8700],
  dhanupali: [21.4700, 83.9800],
  ainthapali: [21.4800, 83.9800],
  rairakhol: [21.0667, 84.3500],
  kuchinda: [21.7500, 84.3500],
  sambalpur: [21.4669, 83.9812],

  // 7. Balasore (Baleswar)
  chandipur: [21.4700, 87.0200],
  jaleswar: [21.8000, 87.2167],
  soro: [21.2800, 86.6900],
  nilagiri: [21.4600, 86.7600],
  basta: [21.7000, 87.0500],
  balasore: [21.4934, 86.9135],
  baleswar: [21.4934, 86.9135],

  // 8. Ganjam / Berhampur
  berhampur: [19.3149, 84.7941],
  brahmapur: [19.3149, 84.7941],
  mkcg: [19.3149, 84.7941],
  gopalpur: [19.2600, 84.9000],
  chhatrapur: [19.3500, 84.9800],
  hinjilicut: [19.4800, 84.7400],
  hinjili: [19.4800, 84.7400],
  aska: [19.6100, 84.6600],
  bhanjanagar: [19.9300, 84.5800],
  ganjam: [19.3800, 85.0500],

  // 9. Bhadrak
  dhamra: [20.8000, 86.9000],
  dhamara: [20.8000, 86.9000],
  basudevpur: [21.1400, 86.7500],
  chandbali: [20.7800, 86.7400],
  bhandaripokhari: [20.9500, 86.3700],
  bhadrak: [21.0544, 86.4957],

  // 10. Mayurbhanj
  baripada: [21.9322, 86.7233],
  rairangpur: [22.2700, 86.1700],
  karanjia: [21.7800, 85.9700],
  udala: [21.5700, 86.5700],
  jashipur: [21.9700, 86.0800],
  mayurbhanj: [21.9322, 86.7233],

  // 11. Keonjhar (Kendujhar)
  barbil: [22.1200, 85.4000],
  joda: [22.0200, 85.4300],
  anandapur: [21.2200, 86.1200],
  champua: [22.0800, 85.6700],
  keonjhar: [21.6289, 85.5817],
  kendujhar: [21.6289, 85.5817],

  // 12. Jharsuguda
  brajarajnagar: [21.8200, 83.9200],
  belpahar: [21.8600, 83.8600],
  jharsuguda: [21.8554, 84.0062],

  // 13. Koraput
  jeypore: [18.8500, 82.5700],
  sunabeda: [18.7300, 82.8300],
  damanjodi: [18.7700, 82.9000],
  kotpad: [19.1400, 82.3200],
  koraput: [18.8135, 82.7123],

  // 14. Rayagada
  gunupur: [19.0800, 83.8200],
  muniguda: [19.6300, 83.4900],
  'bissam cuttack': [19.5200, 83.5200],
  rayagada: [19.1678, 83.4158],

  // 15. Kalahandi
  bhawanipatna: [19.9075, 83.1656],
  kesinga: [20.2000, 83.2300],
  dharamgarh: [19.8700, 82.7800],
  junagarh: [19.8600, 82.9300],
  lanjigarh: [19.7200, 83.3700],
  kalahandi: [19.9075, 83.1656],

  // 16. Bolangir (Balangir)
  titilagarh: [20.3000, 83.1500],
  patnagarh: [20.7200, 83.1300],
  kantabanji: [20.4800, 82.8400],
  bolangir: [20.7107, 83.4867],
  balangir: [20.7107, 83.4867],

  // 17. Bargarh
  padampur: [20.9800, 83.0700],
  attabira: [21.3800, 83.8000],
  barpali: [21.1800, 83.5800],
  bargarh: [21.3333, 83.6167],

  // 18. Dhenkanal
  kamakhyanagar: [20.9300, 85.5600],
  bhuban: [20.8800, 85.8300],
  hindol: [20.6000, 85.2000],
  dhenkanal: [20.6586, 85.5967],

  // 19. Jajpur
  vyasanagar: [20.9500, 86.1300],
  'jajpur road': [20.9500, 86.1300],
  chandikhole: [20.6800, 86.1500],
  sukinda: [20.9700, 85.9200],
  jajpur: [20.8522, 86.3333],

  // 20. Kendrapara
  pattamundai: [20.5700, 86.5700],
  rajnagar: [20.5800, 86.8500],
  bhitarkanika: [20.5800, 86.8500],
  aul: [20.6700, 86.6300],
  kendrapara: [20.4994, 86.4230],

  // 21. Jagatsinghpur
  paradip: [20.3167, 86.6167],
  tirtol: [20.3300, 86.3300],
  kujang: [20.3000, 86.5400],
  jagatsinghpur: [20.2667, 86.1667],

  // 22. Nayagarh
  odagaon: [19.9800, 84.9700],
  khandapada: [20.2700, 85.1800],
  daspalla: [20.3300, 84.8500],
  nayagarh: [20.1333, 85.1000],

  // 23. Kandhamal
  phulbani: [20.1333, 84.1500],
  baliguda: [20.2000, 83.8200],
  daringbadi: [19.9000, 84.1300],
  'g. udayagiri': [20.1300, 84.3700],
  kandhamal: [20.1333, 84.1500],

  // 24. Boudh
  kantamal: [20.6500, 83.7300],
  harbhanga: [20.8200, 84.6000],
  boudh: [20.8333, 84.3167],

  // 25. Subarnapur (Sonepur)
  birmaharajpur: [20.8800, 84.0700],
  tarbha: [20.7300, 83.7500],
  sonepur: [20.8333, 83.9167],
  subarnapur: [20.8333, 83.9167],

  // 26. Nabarangpur
  umerkote: [19.6700, 82.2000],
  khatiguda: [19.3300, 82.6800],
  nabarangpur: [19.2319, 82.5511],

  // 27. Nuapada
  khariar: [20.2800, 82.7700],
  sinapali: [20.1500, 82.5200],
  nuapada: [20.8333, 82.5333],

  // 28. Malkangiri
  balimela: [18.2500, 82.1300],
  chitrakonda: [18.1200, 82.0800],
  malkangiri: [18.3500, 81.9000],

  // 29. Gajapati
  paralakhemundi: [18.8089, 84.1539],
  mohana: [19.4300, 84.2800],
  gajapati: [18.8089, 84.1539],

  // 30. Deogarh (Debagarh)
  barkote: [21.5500, 85.0200],
  reamal: [21.3700, 84.6700],
  deogarh: [21.5333, 84.7333],
  debagarh: [21.5333, 84.7333],
};

// 2. Reliable Coordinate Resolver with Longest-Prefix Matching
export const getAreaCoordinates = (area: AreaSummary): [number, number] => {
  // 1. Direct explicit backend coordinates
  if (
    typeof area.latitude === 'number' &&
    typeof area.longitude === 'number' &&
    area.latitude > 15 &&
    area.latitude < 25 &&
    area.longitude > 80 &&
    area.longitude < 90
  ) {
    return [area.latitude, area.longitude];
  }

  // 2. Search district and name strings with longest match first
  const combined = `${area.name || ''} ${area.district || ''}`.toLowerCase();
  const sortedKeys = Object.keys(ODISHA_GEO_COORDS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (combined.includes(key)) {
      return ODISHA_GEO_COORDS[key];
    }
  }

  // 3. Lookup by Area ID (area-1, area-2, etc.)
  if (ODISHA_GEO_COORDS[area.id]) {
    return ODISHA_GEO_COORDS[area.id];
  }

  // 4. Fallback: Center of Odisha state
  return [20.8444, 85.1511];
};

export const RealWorldSurveillanceMap: React.FC<RealWorldSurveillanceMapProps> = ({
  areas,
  selectedArea,
  onSelectArea,
}) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>(() =>
    theme === 'light' ? 'streets' : 'dark'
  );
  const [activeAreaFocus, setActiveAreaFocus] = useState<string | null>(null);

  // Sync default map style with theme changes
  useEffect(() => {
    if (theme === 'light') {
      setMapStyle('streets');
    } else {
      setMapStyle('dark');
    }
  }, [theme]);

  // Tile layer URLs (100% Free, High Resolution, Zero API Key required)
  const getTileUrl = (style: 'dark' | 'streets' | 'satellite') => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'dark':
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    }
  };

  // Initialize Leaflet Map Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.8444, 85.1511], // Geographic Center of Odisha (Angul Hub)
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
      });

      const tiles = L.tileLayer(getTileUrl(mapStyle), {
        maxZoom: 18,
        subdomains: 'abc',
      }).addTo(map);

      tileLayerRef.current = tiles;
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Style Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(mapStyle));
  }, [mapStyle]);

  // Render Markers, Halos, and Dynamic Transmission Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group || !Array.isArray(areas) || areas.length === 0) return;

    group.clearLayers();

    // Map each area to its resolved coordinates
    const areaCoordsMap: { area: AreaSummary; coords: [number, number] }[] = areas.map((a) => ({
      area: a,
      coords: getAreaCoordinates(a),
    }));

    // 1. Dynamic Spatial Transmission Network Lines
    for (let i = 0; i < areaCoordsMap.length; i++) {
      for (let j = i + 1; j < areaCoordsMap.length; j++) {
        const itemA = areaCoordsMap[i];
        const itemB = areaCoordsMap[j];
        const distLat = itemA.coords[0] - itemB.coords[0];
        const distLng = itemA.coords[1] - itemB.coords[1];
        const distDegree = Math.sqrt(distLat * distLat + distLng * distLng);

        // Connect areas within ~2.5 degrees (~250km)
        if (distDegree < 2.5) {
          const isEitherElevated =
            itemA.area.riskLevel === 'HIGH' ||
            itemA.area.riskLevel === 'MEDIUM' ||
            itemB.area.riskLevel === 'HIGH' ||
            itemB.area.riskLevel === 'MEDIUM';

          L.polyline([itemA.coords, itemB.coords], {
            color: isEitherElevated ? '#f59e0b' : '#38bdf8',
            weight: isEitherElevated ? 1.8 : 1.0,
            opacity: isEitherElevated ? 0.55 : 0.25,
            dashArray: isEitherElevated ? '6, 8' : '3, 6',
          }).addTo(group);
        }
      }
    }

    // 2. Render Wards on Map
    const allLatLngs: [number, number][] = [];

    areaCoordsMap.forEach(({ area, coords }) => {
      allLatLngs.push(coords);

      const isHigh = area.riskLevel === 'HIGH';
      const isMedium = area.riskLevel === 'MEDIUM';
      const isSelected = selectedArea?.id === area.id;

      const color = isHigh ? '#f43f5e' : isMedium ? '#f59e0b' : '#10b981';
      const fillColor = isHigh ? '#f43f5e' : isMedium ? '#f59e0b' : '#10b981';
      const radius = isHigh ? 8000 : isMedium ? 6000 : 4500;

      // Risk Halo Circle
      L.circle(coords, {
        radius: radius,
        color: color,
        weight: isSelected ? 3 : isHigh ? 2 : 1,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.35 : isHigh ? 0.24 : 0.12,
      }).addTo(group);

      // Clean displayName
      const rawName = area.name.includes('(')
        ? area.name.split('(')[1]?.replace(')', '') || area.name
        : area.name;

      // Custom HTML Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        iconSize: [160, 50],
        iconAnchor: [80, 25],
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              background: ${
                isHigh
                  ? 'rgba(225, 29, 72, 0.95)'
                  : isMedium
                  ? 'rgba(217, 119, 6, 0.95)'
                  : 'rgba(16, 185, 129, 0.95)'
              };
              color: white;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 6px 18px rgba(0,0,0,0.6);
              border: ${isSelected ? '2.5px solid #ffffff' : '1.5px solid rgba(255,255,255,0.4)'};
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              transform: ${isSelected ? 'scale(1.1) translateY(-6px)' : isHigh ? 'translateY(-4px)' : 'none'};
              transition: all 0.2s ease;
            ">
              <span>${rawName} (${area.district})</span>
              <span style="background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; font-mono: true;">
                ${area.riskScore}
              </span>
            </div>
            <div style="
              width: ${isSelected ? '12px' : '9px'};
              height: ${isSelected ? '12px' : '9px'};
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              margin-top: 2px;
              box-shadow: 0 0 12px ${color};
            "></div>
          </div>
        `,
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(group);

      // Popup with immediate action to drill down
      const popupHtml = `
        <div style="font-family: inherit; padding: 4px;">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px; color: #f8fafc;">${area.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            District: <strong style="color: #cbd5e1;">${area.district}</strong> • Lat: ${coords[0].toFixed(2)}, Lon: ${coords[1].toFixed(2)}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
            <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px; color: #f1f5f9;">
              <strong>Risk Score:</strong> <span style="color: ${color};">${area.riskScore}/100</span>
            </div>
            <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px; color: #f1f5f9;">
              <strong>Status:</strong> ${area.riskLevel}
            </div>
            <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px; color: #f1f5f9;">
              <strong>Medicine:</strong> ${area.signals?.medicineDemand?.deviation || '+0%'}
            </div>
            <div style="background: rgba(255,255,255,0.08); padding: 5px; border-radius: 6px; color: #f1f5f9;">
              <strong>Fever:</strong> ${area.signals?.feverIndicators?.deviation || '+0%'}
            </div>
          </div>

          <div style="
            background: rgba(34, 197, 94, 0.18);
            border: 1px solid rgba(34, 197, 94, 0.35);
            color: #4ade80;
            padding: 6px;
            border-radius: 8px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          ">
            Click to View Full Drill-Down →
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        onSelectArea(area);
        setActiveAreaFocus(area.id);
      });
    });

    // Automatically fit map view to enclose all active area pins
    if (allLatLngs.length > 0 && !activeAreaFocus) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [areas, selectedArea, onSelectArea, activeAreaFocus]);

  // Focus Map on Selected Area
  const focusOnArea = (area: AreaSummary) => {
    const coords = getAreaCoordinates(area);
    if (mapInstanceRef.current && coords) {
      mapInstanceRef.current.flyTo(coords, 12, { duration: 1.2 });
      setActiveAreaFocus(area.id);
      onSelectArea(area);
    }
  };

  // Return to Full Overview
  const resetToOverview = () => {
    if (mapInstanceRef.current && Array.isArray(areas) && areas.length > 0) {
      const allCoords = areas.map((a) => getAreaCoordinates(a));
      const bounds = L.latLngBounds(allCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
      setActiveAreaFocus(null);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20.8444, 85.1511], 8, { duration: 1.0 });
      setActiveAreaFocus(null);
    }
  };

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Return / Back to Overview Option */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {activeAreaFocus ? (
            <button
              onClick={resetToOverview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
              <span>← View Entire State of Odisha ({areas.length} Wards)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-950/80 border border-slate-800 shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Geospatial Mesh: {areas.length} Active Wards Monitored</span>
            </div>
          )}
        </div>

        {/* Layer Switcher & Zoom */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              mapStyle === 'dark'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Tile
          </button>
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              mapStyle === 'streets'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Streets
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              mapStyle === 'satellite'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bottom Floating Ward Selector Pills */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center gap-2 overflow-x-auto pb-1 pointer-events-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase text-slate-400 px-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-400" />
            Focus ({areas.length}):
          </span>
          {areas.map((area) => {
            const isSelected = selectedArea?.id === area.id;
            const isHigh = area.riskLevel === 'HIGH';
            const isMedium = area.riskLevel === 'MEDIUM';
            const rawName = area.name.includes('(')
              ? area.name.split('(')[1]?.replace(')', '') || area.name
              : area.name;

            return (
              <button
                key={area.id}
                onClick={() => focusOnArea(area)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? isHigh
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-white/50'
                      : isMedium
                      ? 'bg-amber-600 text-white shadow-md ring-2 ring-white/50'
                      : 'bg-brand-600 text-white shadow-md ring-2 ring-white/50'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isHigh
                      ? 'bg-rose-300 animate-pulse'
                      : isMedium
                      ? 'bg-amber-300'
                      : 'bg-emerald-400'
                  }`}
                />
                <span>{rawName}</span>
                <span className="text-[10px] opacity-80 font-mono">
                  ({area.riskScore}/100)
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
