import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { ODISHA_ALL_DISTRICTS } from '../constants/odishaDistricts';
import {
  X,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Power,
  Building2,
  UserPlus,
  HelpCircle,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD';
type SignUpStep = 1 | 2 | 3;
type RoleOption = 'ADMIN' | 'HEALTH_OFFICIAL' | 'VIEWER';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { login, quickLogin, registerWithOTP, sendOTP, verifyOTP, resetPasswordWithOTP, shutdownApp } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<AuthTab>('SIGN_IN');

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Multi-step State
  const [signUpStep, setSignUpStep] = useState<SignUpStep>(1);
  const [signUpRole, setSignUpRole] = useState<RoleOption>('VIEWER');
  const [signUpChannel, setSignUpChannel] = useState<'MOBILE' | 'EMAIL'>('MOBILE');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpContact, setSignUpContact] = useState('');
  const [signUpLanguage, setSignUpLanguage] = useState('english');
  const [signUpDesignation, setSignUpDesignation] = useState('');
  const [signUpDistrict, setSignUpDistrict] = useState('Khurda');
  const [signUpWard, setSignUpWard] = useState('Saheed Nagar Ward 29');
  const [signUpOtp, setSignUpOtp] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password State
  const [forgotContact, setForgotContact] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // OTP Countdown Timer
  const [countdown, setCountdown] = useState<number>(0);

  // General Loading & Status
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Timer effect for OTP countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Password Strength Evaluator
  // -------------------------------------------------------------
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong (Govt Standard)', color: 'bg-emerald-500' };
  };

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier || !signInPassword) return;
    setLoading(true);
    setStatusMsg(null);
    const ok = await login(signInIdentifier, signInPassword);
    setLoading(false);
    if (ok) {
      onClose();
    } else {
      setStatusMsg({ type: 'error', text: 'Authentication failed. Please check your credentials.' });
    }
  };

  const handleQuickDemo = async (role: keyof typeof DEMO_CREDENTIALS) => {
    setLoading(true);
    setStatusMsg(null);
    const ok = await quickLogin(role);
    setLoading(false);
    if (ok) {
      onClose();
    }
  };

  // Step 1 -> Step 2: Request OTP
  const handleRequestSignUpOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpFullName.trim() || !signUpContact.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in your full name and contact number/email.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      await sendOTP(signUpContact, signUpChannel, 'REGISTER');
      setCountdown(30);
      setSignUpStep(2);
      setStatusMsg({ type: 'success', text: `6-Digit OTP dispatched to ${signUpContact}. Please check your phone SMS or email inbox.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Could not send OTP code.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Verify OTP
  const handleVerifySignUpOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpOtp || signUpOtp.length < 6) {
      setStatusMsg({ type: 'error', text: 'Please enter the complete 6-digit OTP code.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    const ok = await verifyOTP(signUpContact, signUpOtp, 'REGISTER');
    setLoading(false);
    if (ok) {
      setSignUpStep(3);
      setStatusMsg({ type: 'success', text: 'Contact verified! Set your password and location.' });
    } else {
      setStatusMsg({ type: 'error', text: 'Invalid OTP code entered. Please retry.' });
    }
  };

  // Step 3: Finalize Registration
  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpPassword !== signUpConfirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (signUpPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    const ok = await registerWithOTP({
      target: signUpContact,
      otp: signUpOtp,
      full_name: signUpFullName,
      password: signUpPassword,
      role: signUpRole,
      district: signUpDistrict,
      ward: signUpWard,
      designation: signUpDesignation,
      language: signUpLanguage,
    });
    setLoading(false);
    if (ok) {
      onClose();
    }
  };

  // Forgot Password: Send Reset OTP
  const handleForgotSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotContact.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      await sendOTP(forgotContact, forgotContact.includes('@') ? 'EMAIL' : 'MOBILE', 'RESET_PASSWORD');
      setCountdown(30);
      setForgotStep(2);
      setStatusMsg({ type: 'info', text: `Verification code sent to ${forgotContact}. Please check your messages.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Account not found.' });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Confirm New Password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotNewPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid 6-digit OTP and new password (min 8 chars).' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    const ok = await resetPasswordWithOTP({
      target: forgotContact,
      otp: forgotOtp,
      new_password: forgotNewPassword,
    });
    setLoading(false);
    if (ok) {
      setActiveTab('SIGN_IN');
      setStatusMsg({ type: 'success', text: 'Password reset successfully! Please sign in.' });
    }
  };

  // Exit / Close App Handler
  const handleShutdownApp = async () => {
    if (window.confirm('Are you sure you want to exit the application and close your session?')) {
      await shutdownApp();
      onClose();
      try {
        window.close();
      } catch {}
    }
  };

  const strength = getPasswordStrength(signUpPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-8 bg-slate-900 shadow-2xl border border-slate-700/80 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Official Header */}
        <div className="text-center pb-4 border-b border-slate-800">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              National Health Mission • IDSP
            </span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            MEDISENTINEL Access Portal
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted Authentication & Rapid Epidemic Intelligence Response
          </p>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 my-4 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('SIGN_IN');
              setStatusMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'SIGN_IN'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => {
              setActiveTab('SIGN_UP');
              setStatusMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'SIGN_UP'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>

          <button
            onClick={() => {
              setActiveTab('FORGOT_PASSWORD');
              setStatusMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'FORGOT_PASSWORD'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reset PIN
          </button>
        </div>

        {/* Notification Status Banner */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
              statusMsg.type === 'error'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : statusMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            }`}
          >
            {statusMsg.type === 'error' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 1: SIGN IN FORM */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'SIGN_IN' && (
          <div className="space-y-4">
            {/* Quick 1-Click Evaluation Profiles */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                Quick Jury Evaluation Switcher (1-Click Login)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickDemo('ADMIN')}
                  disabled={loading}
                  className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-left transition-all"
                >
                  <div className="text-xs font-bold text-purple-300">👑 Admin</div>
                  <div className="text-[9px] text-purple-400/80">Full Ingestion</div>
                </button>

                <button
                  onClick={() => handleQuickDemo('HEALTH_OFFICIAL')}
                  disabled={loading}
                  className="p-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-left transition-all"
                >
                  <div className="text-xs font-bold text-blue-300">🏥 Officer</div>
                  <div className="text-[9px] text-blue-400/80">Alerts & RRT</div>
                </button>

                <button
                  onClick={() => handleQuickDemo('VIEWER')}
                  disabled={loading}
                  className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-left transition-all"
                >
                  <div className="text-xs font-bold text-emerald-300">👨‍👩‍👧 Citizen</div>
                  <div className="text-[9px] text-emerald-400/80">Public Triage</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email or Registered Mobile Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={signInIdentifier}
                  onChange={(e) => setSignInIdentifier(e.target.value)}
                  placeholder="admin@sih.gov.in or 9876543210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('FORGOT_PASSWORD')}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-lg shadow-emerald-950/50 border border-brand-400/30 transition-all active:scale-95 disabled:opacity-50 mt-1"
              >
                {loading ? 'Authenticating with SHA-256...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 2: SIGN UP / CREATE ACCOUNT WITH OTP */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'SIGN_UP' && (
          <div className="space-y-4">
            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-slate-800 text-xs">
              <div className={`flex items-center gap-1.5 ${signUpStep >= 1 ? 'text-brand-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                <span>Identity & Role</span>
              </div>
              <div className={`w-8 h-0.5 ${signUpStep >= 2 ? 'bg-brand-500' : 'bg-slate-800'}`} />
              <div className={`flex items-center gap-1.5 ${signUpStep >= 2 ? 'text-brand-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                <span>OTP Verify</span>
              </div>
              <div className={`w-8 h-0.5 ${signUpStep >= 3 ? 'bg-brand-500' : 'bg-slate-800'}`} />
              <div className={`flex items-center gap-1.5 ${signUpStep >= 3 ? 'text-brand-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                <span>Location & PIN</span>
              </div>
            </div>

            {/* STEP 1: IDENTITY & ROLE */}
            {signUpStep === 1 && (
              <form onSubmit={handleRequestSignUpOTP} className="space-y-3.5">
                {/* Account Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Account / Role Type:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignUpRole('VIEWER')}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        signUpRole === 'VIEWER'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">👨‍👩‍👧 Citizen</div>
                      <div className="text-[9px] text-slate-400">Public Watch</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignUpRole('HEALTH_OFFICIAL')}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        signUpRole === 'HEALTH_OFFICIAL'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">🏥 Official</div>
                      <div className="text-[9px] text-slate-400">IDSP / Doctor</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignUpRole('ADMIN')}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        signUpRole === 'ADMIN'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">👑 Admin</div>
                      <div className="text-[9px] text-slate-400">State Lead</div>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Mohanty"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Verification Channel Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Verification Method:
                    </label>
                    <div className="flex gap-2 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSignUpChannel('MOBILE')}
                        className={`px-2 py-0.5 rounded-lg border ${
                          signUpChannel === 'MOBILE' ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'text-slate-500 border-slate-800'
                        }`}
                      >
                        📱 Mobile SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpChannel('EMAIL')}
                        className={`px-2 py-0.5 rounded-lg border ${
                          signUpChannel === 'EMAIL' ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'text-slate-500 border-slate-800'
                        }`}
                      >
                        📧 Email
                      </button>
                    </div>
                  </div>

                  <input
                    type={signUpChannel === 'MOBILE' ? 'tel' : 'email'}
                    required
                    value={signUpContact}
                    onChange={(e) => setSignUpContact(e.target.value)}
                    placeholder={signUpChannel === 'MOBILE' ? '+91 98765 43210' : 'officer@health.gov.in'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Send Verification OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {signUpStep === 2 && (
              <form onSubmit={handleVerifySignUpOTP} className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-300">
                    Enter the 6-digit verification code sent to <strong className="text-white">{signUpContact}</strong>:
                  </p>
                </div>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={signUpOtp}
                    onChange={(e) => setSignUpOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="text-center font-mono text-xl tracking-[0.4em] w-48 bg-slate-950 border-2 border-brand-500/60 rounded-2xl py-2.5 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(1)}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Change Contact
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={() => handleRequestSignUpOTP({ preventDefault: () => {} } as any)}
                    className="text-brand-400 hover:text-brand-300 font-semibold disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || signUpOtp.length < 6}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
                </button>
              </form>
            )}

            {/* STEP 3: LOCATION, ROLE DETAILS & PASSWORD */}
            {signUpStep === 3 && (
              <form onSubmit={handleFinalizeRegistration} className="space-y-3.5">
                {/* District & Ward selection across all 30 districts */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Assigned District (Odisha)
                    </label>
                    <select
                      value={signUpDistrict}
                      onChange={(e) => {
                        setSignUpDistrict(e.target.value);
                        const wards = ODISHA_ALL_DISTRICTS[e.target.value]?.subLocations || [];
                        if (wards.length > 0) setSignUpWard(wards[0].name);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      {Object.keys(ODISHA_ALL_DISTRICTS).sort().map((d) => (
                        <option key={d} value={d}>
                          {d} District
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Monitored Ward / Block
                    </label>
                    <select
                      value={signUpWard}
                      onChange={(e) => setSignUpWard(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      {(ODISHA_ALL_DISTRICTS[signUpDistrict]?.subLocations || []).map((w) => (
                        <option key={w.name} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Designation for Officials */}
                {signUpRole === 'HEALTH_OFFICIAL' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Designation / Medical Council ID
                    </label>
                    <input
                      type="text"
                      value={signUpDesignation}
                      onChange={(e) => setSignUpDesignation(e.target.value)}
                      placeholder="e.g. District Epidemiologist / Reg #OD-7429"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                )}

                {/* Password & Confirm */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Set Security Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
                    >
                      {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {signUpPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                        <div className={`h-full ${strength.color}`} style={{ width: `${strength.score}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Strength: <strong className="text-white">{strength.label}</strong></span>
                        <span>SHA-256 Enforced</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-lg shadow-emerald-950/50 border border-brand-400/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Complete Registration & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 3: FORGOT PASSWORD / PIN RECOVERY */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'FORGOT_PASSWORD' && (
          <div className="space-y-4">
            <div className="text-center pb-2">
              <p className="text-xs text-slate-300">
                Recover your surveillance portal access via 2-Factor OTP verification.
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotSendOTP} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Registered Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotContact}
                    onChange={(e) => setForgotContact(e.target.value)}
                    placeholder="official@sih.gov.in or 9876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-md transition-all active:scale-95"
                >
                  {loading ? 'Sending Code...' : 'Send Password Reset OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center font-mono text-lg bg-slate-950 border border-slate-700 rounded-xl py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-md transition-all active:scale-95"
                >
                  {loading ? 'Resetting Password...' : 'Confirm & Update Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Anti-Tamper Security & Shutdown Footer */}
        <div className="pt-4 mt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SHA Encrypted • Zero Data Loss Protocol</span>
          </div>

          <button
            onClick={handleShutdownApp}
            title="Exit application and close session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 font-semibold transition-all active:scale-95"
          >
            <Power className="w-3 h-3 text-rose-400" />
            <span>Exit / Close App</span>
          </button>
        </div>
      </div>
    </div>
  );
};


