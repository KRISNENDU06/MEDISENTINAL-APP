import React from 'react';
import { RiskProvider } from './context/RiskContext';
import { useRisk } from './context/useRisk';
import RiskAnalysis from './pages/RiskAnalysis';
import CitizenView from './pages/CitizenView';
import {
  ShieldAlert,
  Users,
  Activity,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

function ToastNotifications() {
  const { notifications, removeNotification } = useRisk();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start justify-between gap-3 text-xs transition-all duration-300 animate-slide-in ${
            n.type === 'warning'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : n.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-indigo-50 border-indigo-300 text-indigo-950'
          }`}
        >
          <div className="flex items-start gap-2">
            {n.type === 'warning' ? (
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            ) : n.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-[11px]">{n.title}</div>
              <div className="text-[11px] opacity-90">{n.message}</div>
            </div>
          </div>

          <button
            onClick={() => removeNotification(n.id)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function MainContent() {
  const { role, setRole } = useRisk();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast Notification Container */}
      <ToastNotifications />

      {/* Top Universal Persona & Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              M
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">MediSentinel</span>
              <span className="hidden sm:inline-block text-[10px] text-slate-500 ml-2 font-mono">
                AI Early Warning Command
              </span>
            </div>
          </div>

          {/* Role Persona Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
            <button
              onClick={() => setRole('analyst')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                role === 'analyst'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={13} />
              <span className="hidden sm:inline">Chief</span> Epidemiologist
            </button>

            <button
              onClick={() => setRole('officer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                role === 'officer'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert size={13} />
              <span>Health Officer</span>
            </button>

            <button
              onClick={() => setRole('citizen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                role === 'citizen'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={13} />
              <span>Citizen Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Persona Pages */}
      <main className="flex-1">
        {role === 'citizen' ? <CitizenView /> : <RiskAnalysis />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RiskProvider>
      <MainContent />
    </RiskProvider>
  );
}