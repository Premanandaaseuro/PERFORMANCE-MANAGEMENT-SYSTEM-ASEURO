import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import aseuroLogo from '../assets/aseuro-logo.png';
import {
  Mail,
  Lock,
  ArrowRight,
  Target,
  BarChart3,
  Sprout,
  AlertCircle,
  UserCheck,
  Users,
  ShieldCheck
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'HR'>('EMPLOYEE');
  const [email, setEmail] = useState('employee@aseuro.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole: 'EMPLOYEE' | 'MANAGER' | 'HR') => {
    setRole(newRole);
    setError(null);
    if (newRole === 'HR') {
      setEmail('hr@aseuro.com');
      setPassword('Hr@12345');
    } else if (newRole === 'MANAGER') {
      setEmail('manager@aseuro.com');
      setPassword('password');
    } else {
      setEmail('employee@aseuro.com');
      setPassword('password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password, role });
      
      const savedUserStr = localStorage.getItem('pms_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const userRole = savedUser?.role || role;

      if (userRole === 'ROLE_HR' || userRole === 'HR') {
        navigate('/hr/dashboard');
      } else if (userRole === 'ROLE_MANAGER' || userRole === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
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

            {/* Quick Role Switcher */}
            <div className="w-full mb-5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Select Login Role
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleRoleChange('EMPLOYEE')}
                  className={`flex items-center justify-center space-x-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    role === 'EMPLOYEE'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck size={14} />
                  <span>Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('MANAGER')}
                  className={`flex items-center justify-center space-x-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    role === 'MANAGER'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users size={14} />
                  <span>Manager</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('HR')}
                  className={`flex items-center justify-center space-x-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    role === 'HR'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>HR</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              {/* Error Alert */}
              {error && (
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
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
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
                    className="w-full pl-11 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
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
                    onClick={() => alert('Default passwords:\n• HR: Hr@12345\n• Manager / Employee: password')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                <span className="mx-auto pl-4">
                  {loading ? 'Authenticating...' : 'Login'}
                </span>
                <ArrowRight size={18} />
              </button>
            </form>

          </div>
        </div>
      </div>

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
