import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerApi } from '../../api/managerApi';
import { ManagerDashboardData } from '../../types';
import {
  Users,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await managerApi.getDashboard();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load manager dashboard', err);
      setError('Unable to load manager dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps = [
    { step: 1, title: 'Self Assessment', desc: 'Employee rating & comments' },
    { step: 2, title: 'Submitted', desc: 'Self rating locked' },
    { step: 3, title: 'Manager Review', desc: 'Manager rating & feedback' },
    { step: 4, title: 'HR Review', desc: 'Final review & calibration' },
    { step: 5, title: 'Final Result', desc: 'Published report' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Manager Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle size={24} className="shrink-0 text-rose-500" />
          <p className="font-medium">{error || 'Failed to load manager metrics.'}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pms-darkGreen via-pms-green to-emerald-700 rounded-3xl p-8 text-white shadow-xl shadow-pms-green/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Manager Portal • {stats.currentCycle}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {stats.managerName}!</h1>
            <p className="text-emerald-100 max-w-2xl text-sm leading-relaxed">
              Review assigned team members, provide objective performance evaluations, and track your team's PMS workflow progression in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/manager/employees')}
              className="px-5 py-3 bg-white text-pms-darkGreen rounded-xl font-bold text-sm shadow-md hover:bg-emerald-50 transition-all transform active:scale-95 flex items-center space-x-2"
            >
              <Users size={18} className="text-pms-green" />
              <span>View Assigned ({stats.employeesAssigned})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Employees Assigned */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Reports</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.employeesAssigned}</div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-blue-600">
            <span>Assigned in PMS Cycle</span>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Reviews</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.pendingEmployeeReviews}</div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-amber-600">
            <span>Awaiting Manager Evaluation</span>
          </div>
        </div>

        {/* Completed Reviews */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reviewed</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.completedEmployeeReviews}</div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <span>Submitted to HR</span>
          </div>
        </div>

        {/* Latest Finalized Score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Finalized Score</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.latestFinalizedScore != null && stats.latestFinalizedScore > 0
              ? `${stats.latestFinalizedScore.toFixed(2)} / 5.00`
              : '0.00 / 5.00'}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-purple-600">
            <span>{stats.latestFinalizedGrade || 'Pending HR Finalization'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Workflow Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-pms-green animate-pulse"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Appraisal Workflow</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1 uppercase tracking-tight">
              {stats.workflowHeading}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              stats.workflowStatus === 'Completed'
                ? 'bg-emerald-100 text-emerald-800'
                : stats.workflowStatus === 'In Progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {stats.workflowStatus}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {stats.workflowSubStatus}
            </span>
          </div>
        </div>

        {/* 5-Stage Stepper */}
        <div className="p-6 md:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {workflowSteps.map((s) => {
              const isPast = s.step < stats.activeStep;
              const isCurrent = s.step === stats.activeStep;
              return (
                <div
                  key={s.step}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-white border-pms-green shadow-md ring-2 ring-pms-green/20'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-white/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-pms-green text-white ring-2 ring-pms-green/30'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPast ? <CheckCircle2 size={16} /> : s.step}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent ? 'text-pms-darkGreen' : isPast ? 'text-emerald-800' : 'text-slate-500'
                    }`}>
                      Stage {s.step}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{s.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              );
            })}
          </div>

          {stats.actionRequired && (
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center space-x-3 text-sm font-medium">
              <AlertCircle size={18} className="text-blue-600 shrink-0" />
              <span>{stats.actionRequired}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Main Clickable Navigation Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Manager Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. View My KPIs */}
          <div
            onClick={() => navigate('/manager/my-kpis')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-pms-green/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-pms-green flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 group-hover:text-pms-green transition-colors">
                1. View My KPIs
              </h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Access your own performance indicators, complete your self-evaluation ratings, and submit your appraisal for the active cycle.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-pms-green font-bold text-sm mt-6 group-hover:translate-x-1 transition-transform">
              <span>Open My KPIs</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* 2. View New Employees Assigned */}
          <div
            onClick={() => navigate('/manager/employees')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                2. View New Employees Assigned
              </h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Review assigned team members, inspect employee self-assessments, enter manager KPI scores, and submit reviews to HR.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm mt-6 group-hover:translate-x-1 transition-transform">
              <span>View Team ({stats.employeesAssigned})</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* 3. Reports */}
          <div
            onClick={() => navigate('/manager/reports')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-purple-500/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                3. Reports
              </h4>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Generate and export detailed PMS performance reports, view rating history, and download official PDF/Excel appraisal summaries for your direct reports.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-purple-600 font-bold text-sm mt-6 group-hover:translate-x-1 transition-transform">
              <span>Open Reports</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;
