import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

interface RealWorldSurveillanceMapProps {
  areas: AreaSummary[];
  selectedArea: AreaSummary | null;
  onSelectArea: (area: AreaSummary) => void;
}

// Real Odisha Geographic Coordinates for pilot wards
const WARD_GEO_COORDS: Record<string, [number, number]> = {
  'area-1': [20.2883, 85.8456], // Saheed Nagar, Bhubaneswar
  'area-2': [20.3588, 85.8166], // Patia, Bhubaneswar
  'area-3': [20.4789, 85.8364], // CDA Sector 6, Cuttack
  'area-4': [19.8135, 85.8312], // Grand Road, Puri
  'area-5': [20.1834, 85.6179], // Industrial Estate, Khurda
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

  // Tile layer URLs
  const getTileUrl = (style: 'dark' | 'streets' | 'satellite') => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.2961, 85.8245], // Bhubaneswar / Odisha center
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      const tiles = L.tileLayer(getTileUrl(mapStyle), {
        maxZoom: 18,
        subdomains: 'abcd',
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

  // Update Markers, Risk Zones, and Spatial Diffusion Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Draw transmission lines between connected neighbor wards
    const saheedCoord = WARD_GEO_COORDS['area-1'];
    const patiaCoord = WARD_GEO_COORDS['area-2'];
    const cdaCoord = WARD_GEO_COORDS['area-3'];
    const khurdaCoord = WARD_GEO_COORDS['area-5'];
    const puriCoord = WARD_GEO_COORDS['area-4'];

    const connections: [number, number][][] = [
      [saheedCoord, patiaCoord],
      [saheedCoord, cdaCoord],
      [saheedCoord, khurdaCoord],
      [saheedCoord, puriCoord],
    ];

    connections.forEach((lineCoords) => {
      L.polyline(lineCoords, {
        color: '#f59e0b',
        weight: 1.5,
        opacity: 0.45,
        dashArray: '5, 8',
      }).addTo(group);
    });

    // 2. Render each area marker and risk circle
    areas.forEach((area) => {
      const coords = WARD_GEO_COORDS[area.id] || [20.2961, 85.8245];
      const isHigh = area.riskLevel === 'HIGH';
      const isMedium = area.riskLevel === 'MEDIUM';

      const color = isHigh ? '#f43f5e' : isMedium ? '#f59e0b' : '#10b981';
      const fillColor = isHigh ? '#f43f5e' : isMedium ? '#f59e0b' : '#10b981';
      const radius = isHigh ? 3800 : isMedium ? 2800 : 2000;

      // Risk Halo Circle
      L.circle(coords, {
        radius: radius,
        color: color,
        weight: isHigh ? 2 : 1,
        fillColor: fillColor,
        fillOpacity: isHigh ? 0.22 : 0.12,
      }).addTo(group);

      // Custom HTML Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        iconSize: [140, 50],
        iconAnchor: [70, 25],
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              background: ${isHigh ? 'rgba(225, 29, 72, 0.95)' : isMedium ? 'rgba(217, 119, 6, 0.95)' : 'rgba(16, 185, 129, 0.95)'};
              color: white;
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 4px 14px rgba(0,0,0,0.5);
              border: 1.5px solid rgba(255,255,255,0.4);
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              transform: translateY(${isHigh ? '-4px' : '0px'});
            ">
              <span>${area.name.split('(')[1]?.replace(')', '') || area.name}</span>
              <span style="background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 4px;">
                ${area.riskScore}
              </span>
            </div>
            <div style="
              width: 8px;
              height: 8px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              margin-top: 2px;
              box-shadow: 0 0 10px ${color};
            "></div>
          </div>
        `,
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(group);

      // Popup with immediate action to drill down
      const popupHtml = `
        <div style="font-family: inherit; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px;">${area.name}</div>
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 8px;">District: ${area.district}</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 8px;">
            <div style="background: rgba(255,255,255,0.06); padding: 4px; border-radius: 6px;">
              <strong>Risk Score:</strong> ${area.riskScore}/100
            </div>
            <div style="background: rgba(255,255,255,0.06); padding: 4px; border-radius: 6px;">
              <strong>Risk Status:</strong> ${area.riskLevel}
            </div>
            <div style="background: rgba(255,255,255,0.06); padding: 4px; border-radius: 6px;">
              <strong>Meds Spike:</strong> ${area.signals.medicineDemand.deviation}
            </div>
            <div style="background: rgba(255,255,255,0.06); padding: 4px; border-radius: 6px;">
              <strong>Fever Spike:</strong> ${area.signals.feverIndicators.deviation}
            </div>
          </div>

          <div style="
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.3);
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

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('click', () => {
        onSelectArea(area);
        setActiveAreaFocus(area.id);
      });
    });
  }, [areas, onSelectArea]);

  // Focus Map on Selected Area
  const focusOnArea = (area: AreaSummary) => {
    const coords = WARD_GEO_COORDS[area.id];
    if (mapInstanceRef.current && coords) {
      mapInstanceRef.current.flyTo(coords, 13, { duration: 1.2 });
      setActiveAreaFocus(area.id);
      onSelectArea(area);
    }
  };

  // Return to Full Overview
  const resetToOverview = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20.2961, 85.8245], 11, { duration: 1.0 });
      setActiveAreaFocus(null);
    }
  };

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
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
              <span>← Return to Full Map View</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-950/80 border border-slate-800 shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-World Geospatial Mesh (Odisha Wards)</span>
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
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 overflow-x-auto pb-1 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Focus Ward:</span>
          {areas.map((area) => {
            const isSelected = selectedArea?.id === area.id;
            const isHigh = area.riskLevel === 'HIGH';
            return (
              <button
                key={area.id}
                onClick={() => focusOnArea(area)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? isHigh
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-brand-500 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isHigh ? 'bg-rose-300 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <span>{area.name.split('(')[1]?.replace(')', '') || area.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({area.riskScore})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

