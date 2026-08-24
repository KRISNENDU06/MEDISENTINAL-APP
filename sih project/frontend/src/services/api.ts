/**
 * SIH Health Risk Early Warning System - API Service Client
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('sih_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorDetail = `${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (typeof errJson.detail === 'string') {
          errorDetail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail
            .map((e: any) => `${e.loc ? e.loc.filter((l: any) => l !== 'body').join('.') + ': ' : ''}${e.msg || JSON.stringify(e)}`)
            .join(', ');
        } else if (typeof errJson.detail === 'object' && errJson.detail !== null) {
          errorDetail = JSON.stringify(errJson.detail);
        } else if (errJson.message) {
          errorDetail = typeof errJson.message === 'string' ? errJson.message : JSON.stringify(errJson.message);
        } else {
          errorDetail = JSON.stringify(errJson);
        }
      } catch {
        errorDetail = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }
    return response.json() as Promise<T>;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error(
        'Backend server is not reachable on http://127.0.0.1:8000. Please start the backend using Run_SIH_Surveillance.bat.'
      );
    }
    throw err;
  }
}

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'HEALTH_OFFICIAL' | 'VIEWER';
  is_active: boolean;
}

export interface DashboardSummary {
  overall_risk_score: number;
  overall_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  average_confidence: number;
  active_alerts: number;
  areas_monitored: number;
  signals_processed: number;
  high_risk_areas: number;
  medium_risk_areas: number;
  low_risk_areas: number;
  last_updated: string | null;
}

export interface SignalData {
  current: number;
  baseline: number;
  deviation: string;
}

export interface AreaSignals {
  medicineDemand: SignalData;
  feverIndicators: SignalData;
  clinicVisits: SignalData;
  geographicSpread: {
    affectedNeighbors: number;
    totalNeighbors: number;
    deviation: string;
  };
}

export interface FactorScores {
  medicine: number;
  healthIndicators: number;
  persistence: number;
  geographicSpread: number;
}

export interface TimelinePoint {
  week: string;
  date?: string;
  baseline: number;
  medicine: number;
  fever: number;
  clinic?: number;
  risk: number;
}

export interface ObservationRecord {
  id: number;
  date: string;
  signalType: string;
  value: number;
  source: string;
  quality?: number;
}

export interface AreaSummary {
  id: string;
  rawId: number;
  name: string;
  district: string;
  state: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  persistenceWeeks: number;
  explanation: string;
  recommendedAction: string;
  signals: AreaSignals;
  factorScores: FactorScores;
  timeline: TimelinePoint[];
  recentObservations?: ObservationRecord[];
  status: 'EARLY_WARNING' | 'WATCH' | 'MONITOR';
  latitude: number | null;
  longitude: number | null;
}

export interface AlertItem {
  id: number | string;
  areaId: string;
  areaName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  riskScore: number;
  confidence: number;
  detectedAt: string;
  evidence: string[];
  recommendedAction: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ACTIVE';
}

export interface WhatIfRequest {
  medicineDemandSpike: number;
  feverCasesSpike: number;
  clinicVisitsSpike: number;
  geographicSpread: number;
  persistenceWeeks: number;
  archetype: string;
  intervention: string;
  r0?: number;
}

export interface WhatIfResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  effectiveRt: number;
  archetype: {
    id: string;
    name: string;
    defaultR0: number;
    primaryDrugClass: string;
    syndromeLabel: string;
  };
  intervention: {
    id: string;
    label: string;
    transmissionReduction: number;
  };
  factorScores: FactorScores;
  signals: AreaSignals;
  explanation: string;
  recommendedAction: string;
  timeline: TimelinePoint[];
}

export interface ObservationInput {
  area_name?: string;
  district?: string;
  observed_on: string;
  signal_type: string;
  category?: string;
  value: number;
  source?: string;
  data_quality_score?: number;
  latitude?: number;
  longitude?: number;
  state?: string;
  area_id?: number;
  custom_area_name?: string;
  custom_district?: string;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<User>('/api/auth/me'),

  // Dashboard & Areas
  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),

  getAreaRiskSummary: (days: number = 30) =>
    request<AreaSummary[]>(`/api/areas/risk-summary?days=${days}`),

  getAreaDetail: (areaId: string | number, days: number = 30) =>
    request<AreaSummary>(`/api/areas/${areaId}?days=${days}`),

  // Risk Engine
  runRiskEngine: (assessedOn?: string) =>
    request<{
      processed_areas: number;
      generated_alerts: number;
      assessments: any[];
    }>('/api/risk/run', {
      method: 'POST',
      body: JSON.stringify(assessedOn ? { assessed_on: assessedOn } : {}),
    }),

  // Alerts
  getAlerts: (status?: string, severity?: string, q?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    if (q) params.append('q', q);
    return request<AlertItem[]>(`/api/alerts?${params.toString()}`);
  },

  getActiveAlerts: () => request<AlertItem[]>('/api/alerts/active'),

  updateAlertStatus: (alertId: string | number, status: string, rrtDispatched?: boolean) =>
    request<{ success: boolean; message: string; alert: AlertItem }>(`/api/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rrtDispatched }),
    }),

  // Observations
  createObservation: (payload: ObservationInput, autoRunRisk: boolean = true) =>
    request<{
      success: boolean;
      message: string;
      observation: any;
      generated_alerts: number;
    }>(`/api/observations?auto_run_risk=${autoRunRisk}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getObservations: (areaId?: number, signalType?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (areaId) params.append('area_id', areaId.toString());
    if (signalType) params.append('signal_type', signalType);
    params.append('limit', limit.toString());
    return request<any[]>(`/api/observations?${params.toString()}`);
  },

  // What-If Simulation
  runWhatIf: (payload: WhatIfRequest) =>
    request<WhatIfResult>('/api/simulation/what-if', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI Copilot Query
  queryCopilot: (query: string, selectedAreaId?: string) =>
    request<{
      headline: string;
      intent: string;
      explanation: string;
      leadingIndicators: string[];
      recommendedSOP: string[];
      confidenceScore: number;
    }>('/api/copilot/query', {
      method: 'POST',
      body: JSON.stringify({ query, selectedAreaId }),
    }),

  // Incident Response Dispatch
  dispatchRRT: (wardId: string, wardName: string, notes?: string) =>
    request<{
      success: boolean;
      dispatch: {
        dispatchId: string;
        wardId: string;
        wardName: string;
        teamLeader: string;
        status: string;
        dispatchedAt: string;
        etaMinutes: number;
        protocol: string;
      };
    }>('/api/response/dispatch-rrt', {
      method: 'POST',
      body: JSON.stringify({ wardId, wardName, notes }),
    }),

  // AI Health & Epidemiological Assistant Chat
  chatWithAI: (message: string, conversationHistory?: any[], selectedAreaId?: string) =>
    request<{
      response: string;
      category: string;
      suggested_questions: string[];
      related_actions: string[];
      timestamp: string;
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
        selected_area_id: selectedAreaId,
      }),
    }),

  // Citizen Healthcare & 24/7 Pharmacies Locator
  getFacilities: (district?: string, type?: string) => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (type) params.append('facility_type', type);
    return request<Facility[]>(`/api/areas/facilities?${params.toString()}`);
  },

  // Anonymous Community Watch Symptom Reporting
  submitCommunityReport: (payload: { wardName: string; symptom: string; casesCount: number }) =>
    request<{
      success: boolean;
      message: string;
      anonymizedReportId: string;
      privacyGuarantee: string;
    }>('/api/observations/community-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Multilingual Public Health Advisory Generator
  generateAdvisory: (payload: { wardName?: string; riskLevel?: string; diseaseType?: string }) =>
    request<{
      generatedAt: string;
      wardName: string;
      riskLevel: string;
      diseaseType: string;
      languages: {
        english: { title: string; body: string; precautions: string[] };
        odia: { title: string; body: string; precautions: string[] };
        hindi: { title: string; body: string; precautions: string[] };
      };
    }>('/api/response/generate-advisory', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Official Ward Health Reports & Medical Directives
  getHealthReports: (areaId?: number, riskLevel?: string) => {
    const params = new URLSearchParams();
    if (areaId) params.append('area_id', areaId.toString());
    if (riskLevel) params.append('risk_level', riskLevel);
    return request<HealthReport[]>(`/api/reports?${params.toString()}`);
  },

  createHealthReport: (payload: {
    area_id?: number;
    area_name?: string;
    report_title: string;
    observed_signals: Record<string, any> | string[] | string;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    clinical_notes: string;
    recommendations: string[] | string;
    officer_name?: string;
    officer_designation?: string;
    is_public?: boolean;
  }) =>
    request<HealthReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteHealthReport: (reportId: number) =>
    request<void>(`/api/reports/${reportId}`, {
      method: 'DELETE',
    }),
};

export interface HealthReport {
  id: number;
  area_id: number;
  area_name: string;
  district: string;
  officer_id?: number;
  officer_name: string;
  officer_designation: string;
  report_title: string;
  observed_signals: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  clinical_notes: string;
  recommendations: string;
  reported_date: string;
  is_public: boolean;
  created_at: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'UPHC' | 'HOSPITAL' | 'PHARMACY' | string;
  category: string;
  district: string;
  ward?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  helpline?: string;
  isOpen24x7: boolean;
  operatingHours?: string;
  services: string[];
  verifiedStock: string;
  mapsQuery?: string;
}
