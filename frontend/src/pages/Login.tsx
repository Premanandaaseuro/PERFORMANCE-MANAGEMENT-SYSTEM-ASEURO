import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import aseuroLogo from '../assets/aseuro-logo.png';
import {
  Mail,
  Lock,
  ArrowRight,
  Target,
  BarChart3,
  Sprout,
  AlertCircle,
  X,
  KeyRound,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lockout State (5 failed attempts -> 5 minutes lock)
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number>(0);

  // Restore Lockout State from localStorage across page refreshes
  useEffect(() => {
    const storedLockout = localStorage.getItem('pms_lockout');
    if (storedLockout) {
      try {
        const { email: lockedEmail, unlockTime } = JSON.parse(storedLockout);
        const remaining = Math.ceil((unlockTime - Date.now()) / 1000);
        if (remaining > 0) {
          setLockSecondsRemaining(remaining);
          if (lockedEmail) {
            setEmail(lockedEmail);
          }
        } else {
          localStorage.removeItem('pms_lockout');
        }
      } catch {
        localStorage.removeItem('pms_lockout');
      }
    }
  }, []);

  useEffect(() => {
    if (lockSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      const storedLockout = localStorage.getItem('pms_lockout');
      if (storedLockout) {
        try {
          const { unlockTime } = JSON.parse(storedLockout);
          const remaining = Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000));
          if (remaining <= 0) {
            clearInterval(timer);
            localStorage.removeItem('pms_lockout');
            setLockSecondsRemaining(0);
            setError(null);
          } else {
            setLockSecondsRemaining(remaining);
          }
          return;
        } catch {
          // fallback
        }
      }

      setLockSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('pms_lockout');
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockSecondsRemaining]);

  const formatLockTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Forgot Password Modal State
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const handleOpenForgotPassword = () => {
    setResetEmail(email || '');
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetSuccess(null);
    setForgotPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim() || !newPassword || !confirmPassword) {
      const msg = 'Please fill in all fields.';
      setResetError(msg);
      alert(msg);
      return;
    }

    const isMinLength = newPassword.length >= 8;
    const hasAlphabet = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);

    if (!isMinLength || !hasAlphabet || !hasNumber || !hasSpecialChar) {
      const msg = 'Password should contain minimum 8 characters with alphabets, numbers, and special characters.';
      setResetError(msg);
      alert(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setResetError(msg);
      alert(msg);
      return;
    }

    setResetLoading(true);
    try {
      await authApi.resetPassword(resetEmail.trim(), newPassword);
      const successMsg = 'Password changed successfully.';
      setResetSuccess(successMsg);
      alert(successMsg);
      setPassword(newPassword);
      setForgotPasswordModalOpen(false);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to change password.';
      setResetError(errorMsg);
      alert(errorMsg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSecondsRemaining > 0) {
      return;
    }
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      localStorage.removeItem('pms_lockout');
      
      const savedUserStr = localStorage.getItem('pms_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const userRole = savedUser?.role;

      if (userRole === 'ROLE_HR' || userRole === 'HR') {
        navigate('/hr/dashboard');
      } else if (userRole === 'ROLE_MANAGER' || userRole === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const resData = err.response?.data;
      if (resData?.lockedUntilSeconds) {
        const unlockTime = Date.now() + resData.lockedUntilSeconds * 1000;
        localStorage.setItem(
          'pms_lockout',
          JSON.stringify({ email: email.trim(), unlockTime })
        );
        setLockSecondsRemaining(resData.lockedUntilSeconds);
      }
      if (resData?.message) {
        setError(resData.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f2faf3] via-[#f8fcf8] to-[#e8f5ea] relative overflow-hidden flex items-center justify-center font-sans">
      {/* Decorative Dot Matrix Background */}
      <div className="absolute top-10 left-[47%] -translate-x-1/2 grid grid-cols-4 gap-3 opacity-60 pointer-events-none z-0">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-70" />
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-[1240px] w-full mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative z-10">
        
        {/* Left Hero Section */}
        <div className="lg:col-span-7 flex flex-col space-y-8 pr-0 lg:pr-6">
          {/* Logo Header */}
          <div className="flex items-center space-x-3">
            <img src={aseuroLogo} alt="Aseuro Logo" className="w-12 h-12 object-contain filter drop-shadow-sm" />
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
              <img src={aseuroLogo} alt="Aseuro Logo" className="w-10 h-10 object-contain filter drop-shadow-xs" />
              <span className="text-2xl font-black tracking-tight text-slate-900">aseuro</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4 text-center">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6 text-center font-medium">
              Sign in to access your account
            </p>



            {/* Form */}
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              {/* Lock Countdown Banner */}
              {lockSecondsRemaining > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col items-center justify-center space-y-2 text-amber-900 animate-fadeIn">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert size={20} className="text-amber-600 animate-pulse" />
                    <span className="font-extrabold text-xs uppercase tracking-wide text-amber-800">Account Temporarily Locked</span>
                  </div>
                  <p className="text-xs text-center font-medium text-amber-700">
                    5 failed login attempts detected. Please wait for the 5-minute timer before trying again.
                  </p>
                  <div className="flex items-center justify-center mt-1">
                    <div className="flex items-center space-x-2 bg-white px-4 py-1.5 rounded-xl border border-amber-200 shadow-xs">
                      <Clock size={16} className="text-amber-600" />
                      <span className="text-sm font-black font-mono text-amber-900">
                        {formatLockTime(lockSecondsRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && lockSecondsRemaining <= 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs font-semibold text-rose-800 animate-fadeIn">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
                    disabled={lockSecondsRemaining > 0}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:bg-slate-100 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-4 text-amber-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={lockSecondsRemaining > 0}
                    className="w-full pl-11 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:bg-slate-100 disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={loading || lockSecondsRemaining > 0}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                <span className="mx-auto pl-4">
                  {loading
                    ? 'Authenticating...'
                    : lockSecondsRemaining > 0
                    ? `Account Locked (${formatLockTime(lockSecondsRemaining)})`
                    : 'Login'}
                </span>
                <ArrowRight size={18} />
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Forgot Password / Reset Password Modal */}
      {forgotPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scaleUp">
            
            {/* Close Button */}
            <button
              onClick={() => setForgotPasswordModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Reset Password</h3>
                <p className="text-xs text-slate-500 font-medium">Create and confirm your new account password</p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="mt-6 space-y-4">
              {/* Reset Error Alert */}
              {resetError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs font-semibold text-rose-800 animate-fadeIn">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {/* Reset Success Alert */}
              {resetSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="enter your email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-amber-500 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create new password"
                    required
                    className="w-full pl-10 pr-16 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-amber-500 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full pl-10 pr-16 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Criteria Info box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1 font-medium">
                <p className="font-bold text-slate-700">Password Criteria Required:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}>Minimum 8 characters</li>
                  <li className={/[a-zA-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>Alphabets (a-z, A-Z)</li>
                  <li className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>Numbers (0-9)</li>
                  <li className={/[^a-zA-Z0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>Special Characters (!@#$%^&*...)</li>
                </ul>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {resetLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Wave Vector Baseline */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-0 opacity-90 overflow-hidden">
        <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0 60C320 120 640 10 960 50C1280 90 1440 30 1440 30V120H0V60Z"
            fill="url(#bottom-wave-gradient-page)"
          />
          <defs>
            <linearGradient id="bottom-wave-gradient-page" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default Login;
