const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sih_auth_token');
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try { const body = await response.json(); if (body.detail) message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail); } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export interface FederatedNode { node_id: string; name: string; type: string; location: string; status: string; last_sync: string; signals_sent: number; raw_records_shared: number; privacy: string; }
export interface FederatedNodesResponse { nodes: FederatedNode[]; total_nodes: number; connected_nodes: number; raw_records_shared: number; privacy_enabled: boolean; }
export interface FederatedRoundResponse { round_id: string; nodes_processed: number; raw_records_shared: number; privacy: string; signals_ingested: number; areas_assessed: number; generated_alerts: number; risk_engine: string; nodes: Array<{ node_id: string; node_name: string; area_name: string; signals: Array<{ signal_type: string; noisy_value: number; epsilon: number }> }>; }
export interface FederatedLocalResponse { central_server: string; raw_records_shared: number; signals_ingested: number; risk_engine: string; risk_score: number | null; risk_level: string | null; confidence: number | null; generated_alerts: number; }

export const federatedApi = {
  getNodes: () => request<FederatedNodesResponse>('/api/federated/nodes'),
  runRound: () => request<FederatedRoundResponse>('/api/federated/simulate-round', { method: 'POST' }),
  processLocal: (payload: { node_id: string; area_name: string; district: string; observed_on: string; epsilon: number; signals: Record<string, number> }) => request<FederatedLocalResponse>('/api/federated/process-local', { method: 'POST', body: JSON.stringify(payload) }),
};
