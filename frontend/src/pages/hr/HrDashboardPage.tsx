import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { HrDashboardStats } from '../../types';
import {
  Users,
  UserPlus,
  UserCheck,
  Target,
  RefreshCw,
  FileText,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const HrDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hrApi.getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load HR dashboard data.');
        setLoading(false);
      });
  }, []);

  const actionCards = [
    {
      id: 'add-employees',
      title: '1. Add Employees',
      description: 'Provision new employee profiles, assign designations and reporting managers with auto-mapped KPIs.',
      icon: <UserPlus className="text-pms-green" size={28} />,
      link: '/hr/employees/add',
      badge: 'Provisioning',
      color: 'border-emerald-200 bg-emerald-50/40'
    },
    {
      id: 'kpis',
      title: '2. Add/Edit KPIs',
      description: 'Configure designation-based KPI definitions, measurement criteria, and validate 100% weightage limit.',
      icon: <Target className="text-blue-600" size={28} />,
      link: '/hr/kpis',
      badge: 'Master Setup',
      color: 'border-blue-200 bg-blue-50/40'
    },
    {
      id: 'managers',
      title: '3. Add/Edit Managers',
      description: 'Create manager accounts, update team leadership structures, and maintain organizational hierarchy.',
      icon: <UserCheck className="text-purple-600" size={28} />,
      link: '/hr/managers',
      badge: 'Team Leads',
      color: 'border-purple-200 bg-purple-50/40'
    },
    {
      id: 'reports',
      title: '4. Generate Reports',
      description: 'Export comprehensive appraisal performance sheets, rating category distribution, and PDF/Excel reports.',
      icon: <FileText className="text-amber-600" size={28} />,
      link: '/hr/reports',
      badge: 'Analytics',
      color: 'border-amber-200 bg-amber-50/40'
    },
    {
      id: 'lifecycle',
      title: '5. View Employees PMS Lifecycle',
      description: 'Track complete 5-stage PMS progress from Self-Assessment to HR Finalisation & Score Approval.',
      icon: <RefreshCw className="text-teal-600" size={28} />,
      link: '/hr/pms-lifecycle',
      badge: 'Active Reviews',
      color: 'border-teal-200 bg-teal-50/40'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 skeleton-shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-150 h-32 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-2/3 skeleton-shimmer"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2 skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-pms-lightGreen border border-pms-green/20 flex items-center justify-center text-pms-darkGreen shadow-sm shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-pms-gray">HR Administration Dashboard</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage organization employee hierarchy, role KPIs, and oversee corporate PMS cycles.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/hr/employees/add')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
          <button
            onClick={() => navigate('/hr/pms-lifecycle')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-pms-gray text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-all"
          >
            <RefreshCw size={15} />
            <span>PMS Lifecycle</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold shadow-sm">
          <AlertTriangle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div
          onClick={() => navigate('/hr/employees')}
          className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-pms-lightGreen group-hover:text-pms-darkGreen transition-colors">
              <Users size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-pms-gray mt-2">{stats?.totalEmployees || 0}</h3>
          <p className="text-xs text-pms-green font-semibold mt-1">Active Corporate Staff</p>
        </div>

        {/* Total Managers */}
        <div
          onClick={() => navigate('/hr/managers')}
          className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reporting Managers</span>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
              <UserCheck size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-pms-gray mt-2">{stats?.totalManagers || 0}</h3>
          <p className="text-xs text-purple-600 font-semibold mt-1">Reviewers & Team Leads</p>
        </div>

        {/* Active Designations */}
        <div
          onClick={() => navigate('/hr/kpis')}
          className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Designations</span>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
              <Target size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-pms-gray mt-2">{stats?.totalDesignations || 0}</h3>
          <p className="text-xs text-blue-600 font-semibold mt-1">Mapped KPI Templates</p>
        </div>

        {/* Finalized Cycles */}
        <div
          onClick={() => navigate('/hr/reports')}
          className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Finalized Records</span>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors">
              <Award size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-pms-gray mt-2">{stats?.completedCycles || 0}</h3>
          <p className="text-xs text-amber-600 font-semibold mt-1">Published Appraisals</p>
        </div>
      </div>

      {/* Main Feature Navigation Grid (5 Clickable Options Required by Prompt) */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-pms-gray">Core HR Modules & Operations</h3>
          <p className="text-xs text-slate-500">Select an option below to perform HR administrative functions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actionCards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {card.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-pms-gray group-hover:text-pms-green transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-pms-green group-hover:text-pms-darkGreen">
                <span>Open Module</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PMS Lifecycle Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-pms-gray">Current Cycle Pipeline Status (August 2026)</h3>
            <p className="text-xs text-slate-500">Live operational review progression checkpoints</p>
          </div>
          <button
            onClick={() => navigate('/hr/pms-lifecycle')}
            className="text-xs font-bold text-pms-green hover:text-pms-darkGreen flex items-center space-x-1"
          >
            <span>View All Employees</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <Clock size={16} />
              <span>Self-Assessment Draft / Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 mt-2">{stats?.pendingSelfAssessments || 0}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Employees currently filling out ratings</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center space-x-2 text-purple-800 font-bold text-xs">
              <UserCheck size={16} />
              <span>Manager Review Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-purple-900 mt-2">{stats?.pendingManagerReviews || 0}</p>
            <p className="text-[11px] text-purple-700 mt-0.5">Self-assessments submitted to managers</p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>HR Review & Finalisation Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-blue-900 mt-2">{stats?.pendingHrReviews || 0}</p>
            <p className="text-[11px] text-blue-700 mt-0.5">Ready for HR score finalization</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HrDashboardPage;
