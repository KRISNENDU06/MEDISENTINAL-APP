import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRisk } from '../../context/useRisk';
import { HEALTHCARE_FACILITIES } from '../../data/mockRiskData';
import RiskBadge from '../common/RiskBadge';
import { ShieldAlert, Radio, Hospital } from 'lucide-react';

// Custom icons for health facilities
const createCustomIcon = (bgColor, label) => {
  return L.divIcon({
    className: 'custom-facility-icon',
    html: `<div style="background-color: ${bgColor}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${label}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const facilityIcons = {
  UPHC: createCustomIcon('#0284c7', 'H'),
  GOVT_HOSPITAL: createCustomIcon('#e11d48', '+'),
  TESTING_LAB: createCustomIcon('#7c3aed', 'L'),
};

const WARD_COORDINATES = {
  'area-1': [20.2925, 85.8475], // Saheed Nagar (Epicenter)
  'area-2': [20.3588, 85.8166], // Patia
  'area-3': [20.2444, 85.8340], // Old Town
  'area-4': [20.2588, 85.7925], // Khandagiri
};

export default function GeoRiskMap({ areas, selectedAreaId, onSelectArea }) {
  const { mapLayers, toggleMapLayer } = useRisk();
  const defaultCenter = [20.2961, 85.8245];

  const getColor = (level) => {
    switch (level) {
      case 'HIGH':
        return '#e11d48'; // Rose-600
      case 'MEDIUM':
        return '#d97706'; // Amber-600
      default:
        return '#059669'; // Emerald-600
    }
  };

  // Transmission vectors originating from high-risk epicenter (Saheed Nagar)
  const transmissionVectors = [
    {
      from: WARD_COORDINATES['area-1'],
      to: WARD_COORDINATES['area-2'],
      label: 'Vector: Saheed Nagar -> Patia (+25% mobility)',
      color: '#e11d48',
    },
    {
      from: WARD_COORDINATES['area-1'],
      to: WARD_COORDINATES['area-3'],
      label: 'Vector: Saheed Nagar -> Old Town (+40% mobility)',
      color: '#e11d48',
    },
    {
      from: WARD_COORDINATES['area-1'],
      to: WARD_COORDINATES['area-4'],
      label: 'Vector: Saheed Nagar -> Khandagiri (+15% mobility)',
      color: '#d97706',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
      {/* Header & Layer Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Geographic Risk Cluster & Spatial Contagion GIS
          </h3>
          <p className="text-xs text-slate-500">
            Micro-ward catchment surveillance &bull; Bhubaneswar Urban Region
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => toggleMapLayer('showVectors')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
              mapLayers.showVectors
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Radio size={12} /> Transmission Vectors
          </button>

          <button
            onClick={() => toggleMapLayer('showBuffers')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
              mapLayers.showBuffers
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <ShieldAlert size={12} /> Containment Rings
          </button>

          <button
            onClick={() => toggleMapLayer('showFacilities')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
              mapLayers.showFacilities
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Hospital size={12} /> Health Facilities
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-88 w-full rounded-xl overflow-hidden border border-slate-200 relative">
        <MapContainer
          center={defaultCenter}
          zoom={11.5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        >
          {/* Light-theme Carto Positron map tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Spatial Contagion Vector Arrows */}
          {mapLayers.showVectors &&
            transmissionVectors.map((vec, idx) => (
              <Polyline
                key={idx}
                positions={[vec.from, vec.to]}
                pathOptions={{
                  color: vec.color,
                  weight: 2.5,
                  dashArray: '6, 8',
                  opacity: 0.8,
                }}
              />
            ))}

          {/* Ward Risk Bubbles & Containment Zones */}
          {areas.map((area) => {
            const coords = WARD_COORDINATES[area.id] || defaultCenter;
            const isSelected = area.id === selectedAreaId;
            const isHigh = area.riskLevel === 'HIGH';
            const color = getColor(area.riskLevel);

            return (
              <React.Fragment key={area.id}>
                {/* 1km & 3km Containment Buffer Circles for High-Risk Epicenters */}
                {mapLayers.showBuffers && isHigh && (
                  <>
                    <Circle
                      center={coords}
                      radius={3500}
                      pathOptions={{
                        fillColor: '#f43f5e',
                        fillOpacity: 0.05,
                        color: '#f43f5e',
                        weight: 1,
                        dashArray: '2, 4',
                      }}
                    />
                    <Circle
                      center={coords}
                      radius={1800}
                      pathOptions={{
                        fillColor: '#f43f5e',
                        fillOpacity: 0.12,
                        color: '#e11d48',
                        weight: 1.5,
                        dashArray: '4, 4',
                      }}
                    />
                  </>
                )}

                {/* Main Ward Cluster Circle */}
                <Circle
                  center={coords}
                  radius={2200}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: isSelected ? 0.4 : 0.2,
                    color: color,
                    weight: isSelected ? 3 : 1.5,
                    dashArray: isSelected ? '4, 4' : undefined,
                  }}
                  eventHandlers={{
                    click: () => onSelectArea(area.id),
                  }}
                >
                  <Popup className="custom-map-popup">
                    <div className="p-1.5 bg-white text-slate-900 rounded text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                        <strong className="text-slate-900">{area.name}</strong>
                        <RiskBadge level={area.riskLevel} />
                      </div>
                      <p className="text-slate-600">
                        Composite Risk: <span className="font-mono text-rose-600 font-bold">{area.riskScore}/100</span>
                      </p>
                      <p className="text-slate-500 text-[10px]">
                        Pharmacy OTC Surge: <strong className="text-slate-700">{area.signals?.medicineDemand?.deviation || '0%'}</strong>
                      </p>
                      <p className="text-slate-500 text-[10px]">
                        Population at Risk: <span className="font-mono">{area.population ? area.population.toLocaleString() : '48,000'}</span>
                      </p>
                      <button
                        onClick={() => onSelectArea(area.id)}
                        className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold py-1 rounded transition cursor-pointer"
                      >
                        Focus Catchment Analytics
                      </button>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            );
          })}

          {/* Healthcare Facilities Layer */}
          {mapLayers.showFacilities &&
            HEALTHCARE_FACILITIES.map((fac) => (
              <Marker
                key={fac.id}
                position={fac.coordinates}
                icon={facilityIcons[fac.type] || facilityIcons.UPHC}
              >
                <Popup>
                  <div className="p-1 bg-white text-slate-900 rounded text-xs space-y-1">
                    <strong className="text-indigo-950 font-bold">{fac.name}</strong>
                    <div className="text-[11px] text-slate-600">
                      Type: <span className="font-medium text-slate-800">{fac.type.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Beds Available: <span className="font-bold text-emerald-600">{fac.bedsAvailable}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Helpline: {fac.contact}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}