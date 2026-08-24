import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, Shield, UserCheck, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      onClose();
    }
  };

  const handleQuickDemo = async (role: 'ADMIN' | 'HEALTH_OFFICIAL' | 'VIEWER') => {
    setLoading(true);
    const ok = await quickLogin(role);
    setLoading(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md glass-panel-glow rounded-3xl p-6 sm:p-8 bg-slate-900 shadow-2xl border border-slate-700/80">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center pb-5 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Role-Based System Authentication
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Access privileged syndromic surveillance & emergency response controls
          </p>
        </div>

        {/* Quick Demo Accounts */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Quick Profile Switcher (Evaluation / Demo Accounts)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemo('ADMIN')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-left transition-all group"
            >
              <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200">👑 Admin</div>
              <div className="text-[10px] text-purple-400/80">Full Control & Ingestion</div>
            </button>

            <button
              onClick={() => handleQuickDemo('HEALTH_OFFICIAL')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-left transition-all group"
            >
              <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">🏥 Health Official</div>
              <div className="text-[10px] text-blue-400/80">Alerts & RRT Dispatch</div>
            </button>

            <button
              onClick={() => handleQuickDemo('VIEWER')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-left transition-all group"
            >
              <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">👨‍👩‍👧 Citizen / Customer</div>
              <div className="text-[10px] text-emerald-400/80">Symptom Checker & Clinics</div>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase">
            Or custom credentials
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Custom Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sih.gov.in"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-lg shadow-emerald-950/50 border border-brand-400/30 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In with JWT'}
          </button>
        </form>
      </div>
    </div>
  );
};

