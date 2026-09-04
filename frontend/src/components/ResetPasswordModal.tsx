import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  LogOut,
  ArrowRight
} from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    currentPassword.trim().length > 0 &&
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Please enter your temporary/current password.');
      return;
    }
    if (!isFormValid) {
      if (!passwordsMatch) {
        setError('New password and confirm password do not match.');
      } else {
        setError('Please ensure your new password satisfies all security requirements.');
      }
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be the same as your temporary password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(true);
      updateUser({ mustChangePassword: false });

      // After 1.5 seconds, redirect to login with prefilled email & success notice
      setTimeout(() => {
        const userEmail = user?.email || '';
        logout();
        navigate('/login', {
          state: {
            resetSuccess: true,
            email: userEmail,
            message: 'Password reset successfully! Please log in with your new password.'
          }
        });
      }, 1500);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to reset password. Please verify your current password.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all duration-300 select-none animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] transition-transform duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 text-white flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 id="reset-password-title" className="text-xl font-bold tracking-tight text-white">
              Reset Your Password
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
              Mandatory Security Requirement for First Login
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Changed Successfully!</h3>
              <p className="text-slate-600 text-sm max-w-sm mx-auto">
                Your password has been updated securely. Redirecting to the login page so you can log in with your new password...
              </p>
              <div className="pt-3">
                <div className="w-8 h-8 rounded-full border-3 border-emerald-500/20 border-t-emerald-600 animate-spin mx-auto"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Notice Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start space-x-3 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="font-semibold text-amber-950">First-time login:</span> For your account security, you must reset your temporary password before continuing to your Employee Dashboard.
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 animate-shake">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm font-medium">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Temporary / Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter the password received in your email"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong new password"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-700 mb-1">Password Requirements:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div className={`flex items-center space-x-2 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasUpperCase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                      <span>One uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasLowerCase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                      <span>One lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                      <span>One number (0-9)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                      <span>One special character (!@#$)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                      {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all duration-200 ${
                      isFormValid && !loading
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-[0.99] cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Modal Footer with Logout Option */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Logged in as: <span className="font-semibold text-slate-700">{user?.email}</span></span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-slate-500 hover:text-rose-600 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
