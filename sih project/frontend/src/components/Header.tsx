import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Activity,
  RefreshCw,
  PlusCircle,
  Sliders,
  Shield,
  User as UserIcon,
  LogOut,
  UserCheck,
  Sun,
  Moon,
  Sparkles,
  Palette,
  ArrowLeft,
  HeartPulse,
  Building2,
  Users,
  FileText,
  Power,
} from 'lucide-react';

interface HeaderProps {
  onRunRiskEngine: () => void;
  isEngineRunning: boolean;
  onOpenObservationModal: () => void;
  onOpenLoginModal: () => void;
  onToggleSimulator: () => void;
  isSimulatorActive: boolean;
  onOpenChatbot: () => void;
  onOpenSymptomChecker?: () => void;
  onOpenFacilities?: () => void;
  onOpenCommunityReport?: () => void;
  onOpenFileReportModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRunRiskEngine,
  isEngineRunning,
  onOpenObservationModal,
  onOpenLoginModal,
  onToggleSimulator,
  isSimulatorActive,
  onOpenChatbot,
  onOpenSymptomChecker,
  onOpenFacilities,
  onOpenCommunityReport,
  onOpenFileReportModal,
}) => {
  const { user, logout, quickLogin, isAdmin, isHealthOfficial, shutdownApp } = useAuth();
  const { theme, setTheme } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const handleExitApp = async () => {
    if (
      window.confirm(
        '⚠️ SHUTDOWN CONFIRMATION:\n\nAre you sure you want to stop all MEDISENTINEL background servers and terminate the application command prompt processes?'
      )
    ) {
      await shutdownApp();
      setTimeout(() => {
        window.close();
      }, 1200);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'HEALTH_OFFICIAL':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'VIEWER':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'emerald':
        return <Palette className="w-3.5 h-3.5 text-emerald-400" />;
      case 'dark':
      default:
        return <Moon className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Logo (MEDISENTINEL - YOUR HEALTH, OUR WATCH) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                MEDISENTINEL
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  Live Watch
                </span>
              </h1>
            </div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400/90 hidden sm:block">
              "YOUR HEALTH, OUR WATCH"
            </p>
          </div>
        </div>

        {/* Action Controls, Citizen Tools & Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Return / Back option when in Simulator mode */}
          {isSimulatorActive ? (
            <button
              onClick={onToggleSimulator}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 shadow-md transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>← Back to Dashboard</span>
            </button>
          ) : (
            <>
              {/* Citizen Tool 1: Symptom Checker */}
              {onOpenSymptomChecker && (
                <button
                  onClick={onOpenSymptomChecker}
                  title="3-Step Smart Symptom Triage for you and your family"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-rose-200 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 shadow-md transition-all active:scale-95"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span className="hidden md:inline">Symptom Checker</span>
                </button>
              )}

              {/* Citizen Tool 2: Facilities / 24/7 Pharmacy Locator */}
              {onOpenFacilities && (
                <button
                  onClick={onOpenFacilities}
                  title="Find nearby UPHC clinics, hospitals & open 24/7 pharmacies"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 shadow-md transition-all active:scale-95"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Find Care & Medicine</span>
                </button>
              )}

              {/* Citizen Tool 3: Community Watch */}
              {onOpenCommunityReport && (
                <button
                  onClick={onOpenCommunityReport}
                  title="Anonymously report family fever / syndromic signals"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 shadow-md transition-all active:scale-95"
                >
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden lg:inline">Community Watch</span>
                </button>
              )}

              {/* Live Risk Refresh Button (Admin / Health Official) */}
              {(isAdmin || isHealthOfficial) && (
                <button
                  onClick={onRunRiskEngine}
                  disabled={isEngineRunning}
                  title="Run Risk Engine to recompute anomaly scores and alerts"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 border border-brand-400/30 shadow-lg shadow-emerald-950/50 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEngineRunning ? 'animate-spin' : ''}`} />
                  <span className="hidden xl:inline">
                    {isEngineRunning ? 'Computing...' : 'Recalculate Risk'}
                  </span>
                </button>
              )}

              {/* File Official Health Report Button (Health Official / Admin) */}
              {(isAdmin || isHealthOfficial) && onOpenFileReportModal && (
                <button
                  onClick={onOpenFileReportModal}
                  title="Create and publish official ward health report"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 shadow-md transition-all hover:text-white active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden xl:inline">+ Health Report</span>
                </button>
              )}

              {/* Add Observation Button (ADMIN ONLY) */}
              {isAdmin && (
                <button
                  onClick={onOpenObservationModal}
                  title="Privileged Data Input (Admin Access Only)"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 shadow-md transition-all hover:text-white active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden xl:inline">+ Ingest Signal</span>
                </button>
              )}

              {/* AI Health Assistant Button */}
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">AI Health Assistant</span>
              </button>

              {/* What-If Simulator Toggle (Interactive Lab) */}
              <button
                onClick={onToggleSimulator}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/80 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Outbreak Lab</span>
              </button>
            </>
          )}

          {/* UI Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              title={`Switch Theme (Current: ${theme.toUpperCase()})`}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              {getThemeIcon()}
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 border border-slate-700">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  UI Theme Settings
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setThemeMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      theme === 'dark'
                        ? 'bg-brand-500/20 text-brand-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-sky-400" />
                      Dark Obsidian
                    </span>
                    {theme === 'dark' && <span className="text-[10px] text-brand-400">Active</span>}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('light');
                      setThemeMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      theme === 'light'
                        ? 'bg-brand-500/20 text-brand-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Clinical Light
                    </span>
                    {theme === 'light' && <span className="text-[10px] text-brand-400">Active</span>}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('emerald');
                      setThemeMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      theme === 'emerald'
                        ? 'bg-brand-500/20 text-brand-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-emerald-400" />
                      Health Emerald
                    </span>
                    {theme === 'emerald' && <span className="text-[10px] text-brand-400">Active</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clean Exit App & Shutdown Terminal Processes */}
          <button
            onClick={handleExitApp}
            title="Safely exit application & terminate background servers"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">Exit App</span>
          </button>

          {/* User Auth / Quick Role Switcher */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${getRoleBadge(
                    user.role
                  )}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="max-w-[90px] truncate hidden sm:inline">{user.full_name}</span>
                  <span className="text-[10px] opacity-80">({user.role === 'VIEWER' ? 'CITIZEN' : user.role})</span>
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl bg-slate-850 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:text-white transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  title="Quick switch user profile"
                  className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-brand-400 border border-slate-700 text-xs font-medium transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Demo Role Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 border border-slate-700">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select User Persona
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      quickLogin('ADMIN');
                      setRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-purple-300 hover:bg-purple-950/40 flex items-center justify-between transition-colors"
                  >
                    <span>👑 Dr. Amit Sharma</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 font-bold">ADMIN</span>
                  </button>
                  <button
                    onClick={() => {
                      quickLogin('HEALTH_OFFICIAL');
                      setRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-blue-300 hover:bg-blue-950/40 flex items-center justify-between transition-colors"
                  >
                    <span>🏥 Dr. Priya Das</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 font-bold">OFFICIAL</span>
                  </button>
                  <button
                    onClick={() => {
                      quickLogin('VIEWER');
                      setRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-emerald-950/40 flex items-center justify-between transition-colors"
                  >
                    <span>👨‍👩‍👧 Citizen / Customer</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 font-bold">PUBLIC</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
