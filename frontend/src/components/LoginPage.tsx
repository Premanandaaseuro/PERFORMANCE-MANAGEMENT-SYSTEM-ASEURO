import React, { useEffect, useState, type FormEvent } from 'react';
import type { AuthUser } from '../types';
import aseuroLogo from '../assets/aseuro-logo.png';
import {
  Mail,
  Lock,
  ArrowRight,
  Target,
  BarChart3,
  Sprout,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type Notice = { type: 'error' | 'success'; message: string };
const criteria = 'Password should contain minimum 8 characters with alphabets, numbers and special characters.';
const lockoutStorageKey = 'pms_login_lock_until';
const validPassword = (value: string) =>
  value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value) && /[^a-zA-Z\d]/.test(value);

const timeLeft = (until: string | null) => {
  if (!until) return '';
  const seconds = Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(() => {
    const savedLock = localStorage.getItem(lockoutStorageKey);
    return savedLock && new Date(savedLock).getTime() > Date.now() ? savedLock : null;
  });
  const [, setTick] = useState(0);
  const locked = !!lockedUntil && new Date(lockedUntil).getTime() > Date.now();

  const applyLock = (until: string | null) => {
    setLockedUntil(until);
    if (until) localStorage.setItem(lockoutStorageKey, until);
    else localStorage.removeItem(lockoutStorageKey);
  };

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = window.setInterval(() => {
      setTick(Date.now());
      if (new Date(lockedUntil).getTime() <= Date.now()) {
        applyLock(null);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil]);

  const inform = (type: Notice['type'], message: string) => setNotice({ type, message });

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (locked) return;
    if (!email.trim()) return inform('error', 'Email address is required.');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (data?.lockedUntil) applyLock(data.lockedUntil);
        throw new Error(data?.message || 'Login failed.');
      }
      applyLock(null);
      onLoginSuccess({
        token: data.token,
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email.split('@')[0],
        employeeCode: data.employeeCode || 'EMP'
      });
    } catch (error) {
      inform('error', error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (!email.trim()) return inform('error', 'Email address is required.');
    if (!validPassword(newPassword)) return inform('error', criteria);
    if (newPassword !== confirmPassword) return inform('error', 'New password and confirm password must match.');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Unable to change password.');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      inform('success', 'Password changed successfully. You can now sign in with your new password.');
      window.setTimeout(() => setResetMode(false), 1400);
    } catch (error) {
      inform('error', error instanceof Error ? error.message : 'Unable to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f2faf3] via-[#f8fcf8] to-[#e8f5ea] relative overflow-hidden flex items-center justify-center font-sans">
      {/* Decorative Dot Matrix at top center */}
      <div className="absolute top-10 left-[47%] -translate-x-1/2 grid grid-cols-4 gap-3 opacity-60 pointer-events-none z-0">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-70" />
        ))}
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1240px] w-full mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative z-10">
        
        {/* Left Hero Section */}
        <div className="lg:col-span-7 flex flex-col space-y-8 pr-0 lg:pr-6">
          {/* Logo Header */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-150 flex items-center justify-center p-1 shadow-sm">
              <img src={aseuroLogo} alt="Aseuro Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-black tracking-tight text-slate-900">aseuro</span>
          </div>

          {/* Hero Headings */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black text-slate-900 leading-[1.08] tracking-tight">
              Performance<br />
              Management<br />
              <span className="text-emerald-600 inline-block">Simplified</span>
            </h1>
            <div className="w-12 h-1.5 bg-emerald-600 rounded-full" />
            <p className="text-slate-600 text-base leading-relaxed max-w-lg pt-2 font-medium">
              A centralized platform to manage goals, reviews, feedback and drive continuous growth.
            </p>
          </div>

          {/* 3 Feature Cards */}
          <div className="space-y-4 max-w-md pt-2">
            {/* Feature 1 */}
            <div className="flex items-center space-x-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Target size={22} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Set Goals</h4>
                <p className="text-xs text-slate-500 font-medium">Define clear goals and align with your vision.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center space-x-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <BarChart3 size={22} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Track Progress</h4>
                <p className="text-xs text-slate-500 font-medium">Monitor performance and measure what matters.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center space-x-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Sprout size={22} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Drive Growth</h4>
                <p className="text-xs text-slate-500 font-medium">Provide feedback and grow together continuously.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card Section */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white rounded-[32px] w-full max-w-[440px] p-8 sm:p-10 shadow-2xl shadow-slate-900/10 border border-slate-200/80 flex flex-col items-center relative z-10">
            
            {/* Card Logo Header */}
            <div className="flex items-center space-x-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-150 flex items-center justify-center p-1 shadow-xs">
                <img src={aseuroLogo} alt="Aseuro Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">aseuro</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4 text-center">
              {resetMode ? 'Reset Password' : 'Welcome Back!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-8 text-center font-medium">
              {resetMode ? 'Create a secure new password for your account' : 'Sign in to access your account'}
            </p>

            {/* Form */}
            <form className="w-full space-y-4" onSubmit={resetMode ? resetPassword : login}>
              {/* Email Input */}
              <div>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-emerald-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Inputs */}
              {resetMode ? (
                <>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-amber-500 pointer-events-none" />
                    <input
                      type={visible ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a new password"
                      autoComplete="new-password"
                      required
                      className="w-full pl-11 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      className="absolute right-4 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      {visible ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-amber-500 pointer-events-none" />
                    <input
                      type={visible ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      required
                      className="w-full pl-11 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-amber-500 pointer-events-none" />
                    <input
                      type={visible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full pl-11 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      className="absolute right-4 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      {visible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNotice(null);
                        setResetMode(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              {/* Toast Notice */}
              {notice && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${
                    notice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {notice.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  )}
                  <span>{notice.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!resetMode && locked)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="mx-auto pl-4">
                  {loading ? 'Please wait...' : resetMode ? 'Save Password' : 'Login'}
                </span>
                <ArrowRight size={18} />
              </button>

              {resetMode && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotice(null);
                      setResetMode(false);
                    }}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to login</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Wave Vector Baseline */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-0 opacity-90 overflow-hidden">
        <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0 60C320 120 640 10 960 50C1280 90 1440 30 1440 30V120H0V60Z"
            fill="url(#bottom-wave-gradient)"
          />
          <defs>
            <linearGradient id="bottom-wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Lockout Modal Dialog */}
      {locked && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Unauthorized Access</h3>
            <p className="text-xs text-slate-500">Please try again after some time.</p>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-1">
              <span className="text-xs font-bold block uppercase tracking-wider">Login available in</span>
              <strong className="text-2xl font-black block font-mono">{timeLeft(lockedUntil)}</strong>
            </div>
            <p className="text-[11px] text-slate-400">
              For your security, this account is temporarily locked after five unsuccessful attempts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
