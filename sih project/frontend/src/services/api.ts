/* Existing API client with federated-network support. */

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('sih_auth_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: { ...getHeaders(), ...options.headers } });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try { const body = await response.json(); detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body); } catch {}
    throw new Error(detail);
  }
  if (response.status === 204) return {} as T;
  const text = await response.text();
  return text.trim() ? JSON.parse(text) as T : {} as T;
}

export interface FederatedNode {
  node_id: string;
  name: string;
  type: string;
  location: string;
  status: 'CONNECTED' | 'DELAYED' | 'OFFLINE' | string;
  last_sync: string;
  signals_sent: number;
  raw_records_shared: number;
  privacy: string;
}

export interface FederatedNetworkResponse {
  nodes: FederatedNode[];
  total_nodes: number;
  connected_nodes: number;
  raw_records_shared: number;
  privacy_enabled: boolean;
}

export interface TokenResponse { access_token: string; refresh_token?: string; token_type?: string; }
export interface User { id: number; email: string; full_name: string; role: 'ADMIN' | 'HEALTH_OFFICIAL' | 'VIEWER'; is_active: boolean; }
export interface DashboardSummary { overall_risk_score: number; overall_risk_level: 'LOW'|'MEDIUM'|'HIGH'; average_confidence: number; active_alerts: number; areas_monitored: number; signals_processed: number; high_risk_areas: number; medium_risk_areas: number; low_risk_areas: number; last_updated: string|null; }
export interface SignalData { current:number; baseline:number; deviation:string; }
export interface AreaSignals { medicineDemand:SignalData; feverIndicators:SignalData; clinicVisits:SignalData; geographicSpread:{affectedNeighbors:number; totalNeighbors:number; deviation:string}; }
export interface FactorScores { medicine:number; healthIndicators:number; persistence:number; geographicSpread:number; }
export interface TimelinePoint { week:string; date?:string; baseline:number; medicine:number; fever:number; clinic?:number; risk:number; }
export interface ObservationRecord { id:number; date:string; signalType:string; value:number; source:string; quality?:number; }
export interface AreaSummary { id:string; rawId:number; name:string; district:string; state:string; riskScore:number; riskLevel:'LOW'|'MEDIUM'|'HIGH'; confidence:number; trend:'INCREASING'|'STABLE'|'DECREASING'; persistenceWeeks:number; explanation:string; recommendedAction:string; signals:AreaSignals; factorScores:FactorScores; timeline:TimelinePoint[]; recentObservations?:ObservationRecord[]; status:'EARLY_WARNING'|'WATCH'|'MONITOR'; latitude:number|null; longitude:number|null; }
export interface AlertItem { id:number|string; areaId:string; areaName:string; severity:'LOW'|'MEDIUM'|'HIGH'; title:string; riskScore:number; confidence:number; detectedAt:string; evidence:string[]; recommendedAction:string; status:'OPEN'|'ACKNOWLEDGED'|'RESOLVED'|'ACTIVE'; }
export interface WhatIfRequest { medicineDemandSpike:number; feverCasesSpike:number; clinicVisitsSpike:number; geographicSpread:number; persistenceWeeks:number; archetype:string; intervention:string; r0?:number; }
export interface WhatIfResult { riskScore:number; riskLevel:'LOW'|'MEDIUM'|'HIGH'; confidence:number; effectiveRt:number; archetype:any; intervention:any; factorScores:FactorScores; signals:AreaSignals; explanation:string; recommendedAction:string; timeline:TimelinePoint[]; }
export interface ObservationInput { area_name?:string; district?:string; observed_on:string; signal_type:string; category?:string; value:number; source?:string; data_quality_score?:number; latitude?:number; longitude?:number; state?:string; area_id?:number; custom_area_name?:string; custom_district?:string; }
export interface CivicRating { area_id:number; area_name:string; district?:string; alert_id:number; alert_title:string; score:number|null; confidence:number; trend:'IMPROVING'|'DECLINING'|'STABLE'|'NO_DATA'; sample_count:number; updated_at:string|null; status:'HIGH'|'MODERATE'|'LOW'|'INSUFFICIENT_DATA'; }

export const api = {
  login:(email:string,password:string)=>request<any>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  getMe:()=>request<User>('/api/auth/me'),
  getDashboardSummary:()=>request<DashboardSummary>('/api/dashboard/summary'),
  getAreaRiskSummary:(days:number=30)=>request<AreaSummary[]>(`/api/areas/risk-summary?days=${days}`),
  getAreaDetail:(areaId:string|number,days:number=30)=>request<AreaSummary>(`/api/areas/${areaId}?days=${days}`),
  runRiskEngine:(assessedOn?:string)=>request<any>('/api/risk/run',{method:'POST',body:JSON.stringify(assessedOn?{assessed_on:assessedOn}:{})}),
  getAlerts:(status?:string,severity?:string,q?:string)=>{const p=new URLSearchParams();if(status)p.append('status',status);if(severity)p.append('severity',severity);if(q)p.append('q',q);return request<AlertItem[]>(`/api/alerts?${p}`)},
  updateAlertStatus:(id:string|number,status:string,rrtDispatched?:boolean)=>request<any>(`/api/alerts/${id}/status`,{method:'PATCH',body:JSON.stringify({status,rrtDispatched})}),
  deleteAlert:(id:string|number)=>request<void>(`/api/alerts/${id}`,{method:'DELETE'}),
  deleteObservation:(id:number)=>request<void>(`/api/observations/${id}`,{method:'DELETE'}),
  deleteAreaObservations:(id:number)=>request<any>(`/api/observations/area/${id}`,{method:'DELETE'}),
  reseedDatabase:()=>request<any>('/api/admin/reseed',{method:'POST'}),
  createObservation:(payload:ObservationInput,autoRunRisk=true)=>request<any>(`/api/observations?auto_run_risk=${autoRunRisk}`,{method:'POST',body:JSON.stringify(payload)}),
  createMultiSignalObservation:(payload:any,autoRunRisk=true)=>request<any>(`/api/observations/multi?auto_run_risk=${autoRunRisk}`,{method:'POST',body:JSON.stringify(payload)}),
  getObservations:(areaId?:number,signalType?:string,limit:number=100)=>{const p=new URLSearchParams();if(areaId)p.append('area_id',String(areaId));if(signalType)p.append('signal_type',signalType);p.append('limit',String(limit));return request<any[]>(`/api/observations?${p}`)},
  runWhatIf:(payload:WhatIfRequest)=>request<WhatIfResult>('/api/simulation/what-if',{method:'POST',body:JSON.stringify(payload)}),
  queryCopilot:(query:string,selectedAreaId?:string)=>request<any>('/api/copilot/query',{method:'POST',body:JSON.stringify({query,selectedAreaId})}),
  dispatchRRT:(wardId:string,wardName:string,notes?:string)=>request<any>('/api/response/dispatch-rrt',{method:'POST',body:JSON.stringify({wardId,wardName,notes})}),
  chatWithAI:(message:string,conversationHistory?:any[],selectedAreaId?:string)=>request<any>('/api/chat',{method:'POST',body:JSON.stringify({message,conversation_history:conversationHistory,selected_area_id:selectedAreaId})}),
  getFacilities:(district?:string,type?:string)=>{const p=new URLSearchParams();if(district)p.append('district',district);if(type)p.append('facility_type',type);return request<any[]>(`/api/areas/facilities?${p}`)},
  submitCommunityReport:(payload:any)=>request<any>('/api/observations/community-report',{method:'POST',body:JSON.stringify(payload)}),
  generateAdvisory:(payload:any)=>request<any>('/api/response/generate-advisory',{method:'POST',body:JSON.stringify(payload)}),
  getHealthReports:(areaId?:number,riskLevel?:string)=>{const p=new URLSearchParams();if(areaId)p.append('area_id',String(areaId));if(riskLevel)p.append('risk_level',riskLevel);return request<any[]>(`/api/reports?${p}`)},
  createHealthReport:(payload:any)=>request<any>('/api/reports',{method:'POST',body:JSON.stringify(payload)}),
  deleteHealthReport:(id:number)=>request<void>(`/api/reports/${id}`,{method:'DELETE'}),
  getAudioTTSUrl:(lang:string,text?:string)=>{const p=new URLSearchParams({lang});if(text?.trim())p.set('text',text.trim());return `${API_BASE}/api/audio/tts?${p}`},
  sendOTP:(target:string,channel:any='MOBILE',purpose:any='REGISTER')=>request<any>('/api/auth/send-otp',{method:'POST',body:JSON.stringify({target,channel,purpose})}),
  verifyOTP:(target:string,otp:string,purpose:any='REGISTER')=>request<any>('/api/auth/verify-otp',{method:'POST',body:JSON.stringify({target,otp,purpose})}),
  registerWithOTP:(payload:any)=>request<TokenResponse>('/api/auth/register-with-otp',{method:'POST',body:JSON.stringify(payload)}),
  resetPasswordWithOTP:(payload:any)=>request<any>('/api/auth/reset-password-otp',{method:'POST',body:JSON.stringify(payload)}),
  shutdownSystem:()=>request<any>('/api/auth/shutdown',{method:'POST'}),
  getFederatedNodes:()=>request<FederatedNetworkResponse>('/api/federated/nodes'),
  runFederatedRound:()=>request<any>('/api/federated/simulate-round',{method:'POST'}),
  getCivicOverview:()=>request<CivicRating[]>('/api/dashboard/civic/overview'),
  getCivicRating:(areaId:number,alertId:number)=>request<CivicRating>(`/api/dashboard/civic/rating?area_id=${areaId}&alert_id=${alertId}`),
  submitCivicFeedback:(areaId:number,alertId:number,response:'FOLLOWING'|'NOT_FOLLOWING'|'NOT_APPLICABLE')=>request<any>('/api/dashboard/civic/feedback',{method:'POST',body:JSON.stringify({area_id:areaId,alert_id:alertId,response})}),
};

export interface HealthReport { id:number; area_id:number; area_name:string; district:string; officer_id?:number; officer_name:string; officer_designation:string; report_title:string; observed_signals:string; risk_level:'LOW'|'MEDIUM'|'HIGH'; clinical_notes:string; recommendations:string; reported_date:string; is_public:boolean; created_at:string; }
export interface Facility { id:string; name:string; type:'UPHC'|'HOSPITAL'|'PHARMACY'|string; category:string; district:string; ward?:string; address:string; latitude:number; longitude:number; phone:string; helpline?:string; isOpen24x7:boolean; operatingHours?:string; services:string[]; verifiedStock:string; mapsQuery?:string; }
