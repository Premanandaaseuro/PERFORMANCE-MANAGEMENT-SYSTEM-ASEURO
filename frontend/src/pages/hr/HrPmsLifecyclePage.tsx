import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Employee, EmployeeLifecycleData } from '../../types';
import {
  RefreshCw,
  Search,
  ArrowLeft,
  User,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Send,
  Lock,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Download,
  Save
} from 'lucide-react';

import { RatingScaleLegend } from '../../components/RatingScaleLegend';

export const HrPmsLifecyclePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [lifecycleData, setLifecycleData] = useState<EmployeeLifecycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Finalize Modal State
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [hrScore, setHrScore] = useState<number>(4.2);
  const [hrGrade, setHrGrade] = useState('Excellent Performance');
  const [hrComments, setHrComments] = useState('Reviewed and approved by HR Administration.');
  const [finalizing, setFinalizing] = useState(false);

  // Individual HR, Manager & Self Ratings & Comments State (Editable by HR)
  const [hrRatings, setHrRatings] = useState<Record<number, number>>({});
  const [managerRatings, setManagerRatings] = useState<Record<number, number>>({});
  const [selfRatings, setSelfRatings] = useState<Record<number, number>>({});
  const [employeeCommentsMap, setEmployeeCommentsMap] = useState<Record<number, string>>({});
  const [managerCommentsMap, setManagerCommentsMap] = useState<Record<number, string>>({});
  const [hrCommentsMap, setHrCommentsMap] = useState<Record<number, string>>({});
  const [savingRatings, setSavingRatings] = useState<boolean>(false);

  const isHrStandardKpiName = (name: string): boolean => {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    return (
      n.includes('leave pattern') ||
      n.includes('team collaboration') ||
      n.includes('punctuality') ||
      n.includes('new initiatives') ||
      n.includes('rewards')
    );
  };

  useEffect(() => {
    // Initial load: search all employees
    searchEmployees('');
  }, []);

  const searchEmployees = (query: string) => {
    hrApi.searchLifecycleEmployees(query)
      .then((data) => {
        setEmployeeResults(data);
        if (data.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(data[0].id);
          fetchLifecycle(data[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    searchEmployees(q);
  };

  const recalculateHrScore = (kpis: any[], ratingsMap: Record<number, number>) => {
    let weightedSum = 0;
    let totalWeight = 0;
    kpis.forEach((kpi) => {
      const r = ratingsMap[kpi.kpiId] ?? kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 5.0;
      weightedSum += r * (kpi.weightage / 100);
      totalWeight += kpi.weightage;
    });
    const calculated = totalWeight > 0 ? Math.round(weightedSum * 100) / 100 : 5.0;
    setHrScore(calculated);
    deriveGrade(calculated);
  };

  const fetchLifecycle = (empId: number) => {
    setLoading(true);
    setError(null);
    setSelectedEmployeeId(empId);
    hrApi.getLifecycleDetail(empId)
      .then((data) => {
        setLifecycleData(data);
        const initialHrRatings: Record<number, number> = {};
        const initialMgrRatings: Record<number, number> = {};
        const initialSelfRatings: Record<number, number> = {};
        const initialEmpComments: Record<number, string> = {};
        const initialMgrComments: Record<number, string> = {};

        const initialHrComments: Record<number, string> = {};

        data.kpis.forEach((kpi) => {
          initialHrRatings[kpi.kpiId] = kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 5.0;
          initialMgrRatings[kpi.kpiId] = kpi.managerRating ?? kpi.selfRating ?? 5.0;
          initialSelfRatings[kpi.kpiId] = kpi.selfRating ?? 5.0;
          initialEmpComments[kpi.kpiId] = kpi.employeeComments || kpi.comments || '';
          initialMgrComments[kpi.kpiId] = kpi.managerComments || '';
          initialHrComments[kpi.kpiId] = kpi.hrComments || '';
        });

        setHrRatings(initialHrRatings);
        setManagerRatings(initialMgrRatings);
        setSelfRatings(initialSelfRatings);
        setEmployeeCommentsMap(initialEmpComments);
        setManagerCommentsMap(initialMgrComments);
        setHrCommentsMap(initialHrComments);

        recalculateHrScore(data.kpis, initialHrRatings);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load employee PMS lifecycle.');
        setLoading(false);
      });
  };

  const handleSaveRatingsAndComments = async () => {
    if (!lifecycleData?.assignmentId) return;
    try {
      setSavingRatings(true);
      setError(null);
      const payload = {
        kpiRatings: lifecycleData.kpis.map((kpi) => ({
          kpiId: kpi.kpiId,
          selfRating: selfRatings[kpi.kpiId] !== undefined ? selfRatings[kpi.kpiId] : kpi.selfRating,
          employeeComments: employeeCommentsMap[kpi.kpiId] !== undefined ? employeeCommentsMap[kpi.kpiId] : (kpi.employeeComments || kpi.comments || ''),
          managerRating: managerRatings[kpi.kpiId] !== undefined ? managerRatings[kpi.kpiId] : kpi.managerRating,
          managerComments: managerCommentsMap[kpi.kpiId] !== undefined ? managerCommentsMap[kpi.kpiId] : (kpi.managerComments || ''),
          hrRating: hrRatings[kpi.kpiId] !== undefined ? hrRatings[kpi.kpiId] : kpi.hrRating,
          hrComments: hrCommentsMap[kpi.kpiId] !== undefined ? hrCommentsMap[kpi.kpiId] : (kpi.hrComments || ''),
        }))
      };
      await hrApi.updateLifecycleRatings(lifecycleData.assignmentId, payload);
      setSuccess('KPI Ratings & Comments updated successfully! Changes are immediately reflected in Employee and Manager modules.');
      setTimeout(() => setSuccess(null), 5000);
      if (selectedEmployeeId) {
        fetchLifecycle(selectedEmployeeId);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save KPI ratings and comments.');
    } finally {
      setSavingRatings(false);
    }
  };

  const deriveGrade = (score: number) => {
    if (score >= 4.5) setHrGrade('Outstanding Performance');
    else if (score >= 4.0) setHrGrade('Excellent Performance');
    else if (score >= 3.5) setHrGrade('Very Good Performance');
    else if (score >= 3.0) setHrGrade('Good Performance');
    else if (score >= 2.0) setHrGrade('Needs Improvement');
    else setHrGrade('Poor');
  };

  const handleScoreChange = (score: number) => {
    setHrScore(score);
    deriveGrade(score);
  };

  const handleHrKpiRatingChange = (kpiId: number, rating: number) => {
    const updated = { ...hrRatings, [kpiId]: rating };
    setHrRatings(updated);
    if (lifecycleData?.kpis) {
      recalculateHrScore(lifecycleData.kpis, updated);
    }
  };

  const handleManagerKpiRatingChange = (kpiId: number, rating: number) => {
    const updated = { ...managerRatings, [kpiId]: rating };
    setManagerRatings(updated);
    if (lifecycleData?.kpis) {
      const updatedKpis = lifecycleData.kpis.map(k => k.kpiId === kpiId ? { ...k, managerRating: rating } : k);
      setLifecycleData({ ...lifecycleData, kpis: updatedKpis });
    }
  };

  const handleFinalizePms = async () => {
    if (!lifecycleData || !lifecycleData.assignmentId) return;
    setFinalizing(true);
    setError(null);
    try {
      const kpiRatingsPayload = (lifecycleData.kpis || []).map((kpi) => ({
        kpiId: kpi.kpiId,
        hrRating: Number(hrRatings[kpi.kpiId] ?? kpi.hrRating ?? 5.0),
        managerRating: Number(managerRatings[kpi.kpiId] ?? kpi.managerRating ?? 5.0)
      }));

      const res = await hrApi.finalizePms(lifecycleData.assignmentId, {
        overallScore: hrScore,
        performanceGrade: hrGrade,
        hrComments: hrComments.trim(),
        kpiRatings: kpiRatingsPayload
      });

      setSuccess(`PMS cycle successfully finalized! Score: ${res.finalScore} / 5.00 (${res.grade})`);
      setFinalizeModalOpen(false);
      if (selectedEmployeeId) {
        fetchLifecycle(selectedEmployeeId);
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to finalize PMS.');
    } finally {
      setFinalizing(false);
    }
  };

  // Filter state for PMS status
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_SELF' | 'PENDING_MANAGER' | 'COMPLETED'>('ALL');

  // Helper status matchers
  const isPendingSelf = (st?: string) => {
    if (!st) return true;
    return st.includes('SELF') || st.includes('DRAFT') || st === 'PENDING';
  };

  const isPendingManager = (st?: string) => {
    if (!st) return false;
    return st.includes('SUBMITTED') || st.includes('MANAGER');
  };

  const isCompletedState = (st?: string) => {
    if (!st) return false;
    return st.includes('COMPLETED') || st.includes('FINAL') || st.includes('PUBLISHED');
  };

  const safeResults = Array.isArray(employeeResults) ? employeeResults : [];
  const pendingSelfCount = safeResults.filter(e => e && isPendingSelf(e.status)).length;
  const pendingManagerCount = safeResults.filter(e => e && isPendingManager(e.status)).length;
  const completedCount = safeResults.filter(e => e && isCompletedState(e.status)).length;

  const filteredEmployees = safeResults.filter(emp => {
    if (!emp) return false;
    if (statusFilter === 'PENDING_SELF') return isPendingSelf(emp.status);
    if (statusFilter === 'PENDING_MANAGER') return isPendingManager(emp.status);
    if (statusFilter === 'COMPLETED') return isCompletedState(emp.status);
    return true;
  });

  const renderPmsStatusBadge = (status?: string) => {
    if (isCompletedState(status)) {
      return <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
    }
    if (isPendingManager(status)) {
      return <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">Pending Manager</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Pending Self</span>;
  };

  const isCompleted = lifecycleData?.status === 'COMPLETED' || lifecycleData?.status === 'FINAL_RESULT_PUBLISHED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-pms-gray mb-1"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-2xl font-bold text-pms-gray">Employee PMS Lifecycle Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time appraisal milestones, edit ratings/comments, and perform final HR score approvals.
          </p>
        </div>

        {lifecycleData?.hasActiveAssignment && (
          <button
            onClick={() => setFinalizeModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <FileCheck size={16} />
            <span>{isCompleted ? 'Update & Re-Publish Appraisal' : 'Finalise and Submit'}</span>
          </button>
        )}
      </div>

      {/* Top Summary Stat Cards for PMS Lifecycle Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Registered</span>
            <Users size={16} />
          </div>
          <div className="text-2xl font-extrabold mt-1">{employeeResults.length}</div>
          <span className="text-[10px] opacity-75 font-medium block mt-0.5">All employees in cycle</span>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING_SELF')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'PENDING_SELF' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100/60'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Pending Self Rating</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl font-extrabold mt-1">{pendingSelfCount}</div>
          <span className="text-[10px] opacity-80 font-medium block mt-0.5">Awaiting self assessment</span>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING_MANAGER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'PENDING_MANAGER' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-blue-50/70 border-blue-200 text-blue-900 hover:bg-blue-100/60'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Pending Manager Rating</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-2xl font-extrabold mt-1">{pendingManagerCount}</div>
          <span className="text-[10px] opacity-80 font-medium block mt-0.5">Awaiting manager review</span>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'COMPLETED' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/60'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Completed / Finalized</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-extrabold mt-1">{completedCount}</div>
          <span className="text-[10px] opacity-80 font-medium block mt-0.5">HR published score</span>
        </div>
      </div>

      {success && (
        <div className="bg-pms-lightGreen border-l-4 border-pms-green p-4 rounded-xl flex items-center space-x-3 text-xs text-pms-darkGreen font-bold animate-slideIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold animate-slideIn">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Column Search List & Right Column Lifecycle Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Employee Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Employee ({filteredEmployees.length})
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                Filter: {statusFilter.replace('_', ' ')}
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search name, code, email..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              />
            </div>

            {/* Lifecycle Stage Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All ({employeeResults.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_SELF')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${statusFilter === 'PENDING_SELF' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Self ({pendingSelfCount})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_MANAGER')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${statusFilter === 'PENDING_MANAGER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Mgr ({pendingManagerCount})
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Done ({completedCount})
              </button>
            </div>

            {/* List of employees */}
            <div className="max-h-[480px] overflow-y-auto space-y-1.5 pt-1">
              {filteredEmployees.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No employees found matching filter.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => fetchLifecycle(emp.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                      selectedEmployeeId === emp.id
                        ? 'bg-pms-lightGreen border border-pms-green/30 text-pms-darkGreen font-bold shadow-xs'
                        : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {emp.profilePhoto ? (
                        <img src={emp.profilePhoto} alt={emp.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-xs font-bold truncate">{emp.name}</p>
                        </div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {renderPmsStatusBadge(emp.status)}
                          <span className="text-[10px] text-slate-400 truncate">• {emp.designation}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lifecycle View */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center text-xs text-slate-400">
              Loading employee lifecycle details...
            </div>
          ) : !lifecycleData ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center text-xs text-slate-500">
              Select an employee from the left panel to inspect PMS lifecycle milestones.
            </div>
          ) : (
            <>
              {/* Performance Rating Scale Reference */}
              <RatingScaleLegend defaultExpanded={false} />

              {/* Employee Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  {lifecycleData?.employee?.profilePhoto ? (
                    <img src={lifecycleData.employee.profilePhoto} alt={lifecycleData.employee.name || 'Employee'} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-pms-green text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
                      {lifecycleData?.employee?.name ? lifecycleData.employee.name.charAt(0) : 'E'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-pms-gray">{lifecycleData?.employee?.name || 'Employee'}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        EMP-{lifecycleData?.employee?.id || selectedEmployeeId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{lifecycleData?.employee?.designation || '-'}</span> • {lifecycleData?.employee?.department || '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {lifecycleData?.employee?.email || ''} • Reporting to: <strong className="text-slate-600">{lifecycleData?.employee?.managerName || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cycle Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mt-1 ${
                    isCompleted
                      ? 'bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {lifecycleData?.cycleMonth || 'August 2026'}: {lifecycleData?.status?.replace(/_/g, ' ') || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* 5-Stage Visual Workflow Tracker (Dynamic from DB) */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Appraisal Workflow Progression Checkpoints
                </h4>

                <div className="grid grid-cols-5 gap-2 relative">
                  {(lifecycleData?.workflowStages || []).map((stage) => {
                    const isDone = stage.status === 'Completed';
                    const isPending = stage.status === 'Pending' || stage.status === 'In Progress';
                    return (
                      <div key={stage.step} className="flex flex-col items-center text-center p-2 rounded-xl">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                          isDone
                            ? 'bg-pms-green text-white shadow-sm ring-4 ring-pms-green/15'
                            : isPending
                            ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isDone ? <CheckCircle2 size={16} /> : stage.step}
                        </div>
                        <span className="text-xs font-bold text-pms-gray truncate w-full">{stage.title}</span>
                        <span className={`text-[10px] font-bold mt-0.5 ${
                          isDone ? 'text-pms-darkGreen' : isPending ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                          {stage.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KPI Ratings & Evaluation Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      KPI Performance & Rating Details (HR Editable)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      💡 HR can edit Employee Self Ratings, Employee Comments, Manager Comments, and evaluate 25% HR Parameters.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveRatingsAndComments}
                    disabled={savingRatings}
                    className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2 shrink-0"
                  >
                    <Save size={15} />
                    <span>{savingRatings ? 'Saving Changes...' : 'Save Ratings & Comments'}</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {(lifecycleData?.kpis || []).map((kpi, idx) => {
                    const isHr25 = isHrStandardKpiName(kpi.kpiName);
                    return (
                      <div key={kpi.kpiId} className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                        {/* KPI Title & Rating Inputs Row */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900">{kpi.kpiName}</h5>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                Weight: {kpi.weightage}%
                              </span>
                              {isHr25 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                  25% HR Parameter
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{kpi.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {/* Employee Self Rating Input */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center min-w-[100px]">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Self Rating
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={selfRatings[kpi.kpiId] !== undefined ? selfRatings[kpi.kpiId] : (kpi.selfRating ?? '')}
                                onChange={(e) => setSelfRatings(prev => ({ ...prev, [kpi.kpiId]: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                                placeholder="0.0"
                                className="w-16 px-2 py-1 text-center font-extrabold text-xs border rounded-lg border-emerald-300 text-emerald-800 bg-emerald-50/50 focus:bg-white"
                              />
                            </div>

                            {/* Manager Rating Input */}
                            <div className={`p-2.5 rounded-xl border text-center min-w-[110px] ${isHr25 ? 'bg-purple-50/80 border-purple-200' : 'bg-white border-slate-200'}`}>
                              <label className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${isHr25 ? 'text-purple-900' : 'text-slate-400'}`}>
                                {isHr25 ? 'HR 25% Rating' : 'Manager Rating'}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={managerRatings[kpi.kpiId] !== undefined ? managerRatings[kpi.kpiId] : (kpi.managerRating ?? '')}
                                onChange={(e) => setManagerRatings(prev => ({ ...prev, [kpi.kpiId]: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                                placeholder="0.0"
                                className={`w-16 px-2 py-1 text-center font-extrabold text-xs border rounded-lg ${isHr25 ? 'border-purple-300 text-purple-900 bg-purple-100/50' : 'border-purple-200 text-purple-700 bg-purple-50/30'} focus:bg-white`}
                              />
                            </div>

                            {/* HR Overall Rating Input */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center min-w-[100px]">
                              <label className="text-[9px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                                HR Final Rating
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={hrRatings[kpi.kpiId] !== undefined ? hrRatings[kpi.kpiId] : (kpi.hrRating ?? '')}
                                onChange={(e) => setHrRatings(prev => ({ ...prev, [kpi.kpiId]: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                                placeholder="0.0"
                                className="w-16 px-2 py-1 text-center font-extrabold text-xs border rounded-lg border-blue-300 text-blue-800 bg-blue-50/50 focus:bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Comments Section (Employee, Manager & HR Comments Editable by HR) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
                          {/* Employee Comments */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Employee Self Comments</span>
                              <span className="text-[9px] text-slate-400 font-normal">(HR Editable)</span>
                            </label>
                            <textarea
                              value={employeeCommentsMap[kpi.kpiId] ?? ''}
                              onChange={(e) => setEmployeeCommentsMap(prev => ({ ...prev, [kpi.kpiId]: e.target.value }))}
                              placeholder="Employee self assessment comments..."
                              rows={2}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-pms-green/40 focus:border-pms-green"
                            />
                          </div>

                          {/* Manager Comments */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Manager Feedback & Comments</span>
                              <span className="text-[9px] text-slate-400 font-normal">(HR Editable)</span>
                            </label>
                            <textarea
                              value={managerCommentsMap[kpi.kpiId] ?? ''}
                              onChange={(e) => setManagerCommentsMap(prev => ({ ...prev, [kpi.kpiId]: e.target.value }))}
                              placeholder="Manager feedback comments..."
                              rows={2}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-pms-green/40 focus:border-pms-green"
                            />
                          </div>

                          {/* HR Feedback & Comments */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                              <span>HR Feedback & Comments</span>
                              <span className="text-[9px] text-purple-600 font-bold">(HR Editable)</span>
                            </label>
                            <textarea
                              value={hrCommentsMap[kpi.kpiId] ?? ''}
                              onChange={(e) => setHrCommentsMap(prev => ({ ...prev, [kpi.kpiId]: e.target.value }))}
                              placeholder="HR evaluation comments & remarks..."
                              rows={2}
                              className="w-full p-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handleSaveRatingsAndComments}
                    disabled={savingRatings}
                    className="px-6 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{savingRatings ? 'Saving Changes...' : 'Save Ratings & Comments'}</span>
                  </button>
                </div>
              </div>

              {/* Final Score Card if Finalized */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-pms-green/30 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Award size={32} className="text-pms-green" />
                    <div>
                      <h4 className="text-sm font-bold text-pms-darkGreen">Finalized Appraisal Result</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Performance Grade: <strong className="text-pms-gray">{lifecycleData.performanceGrade}</strong> • Finalized on {lifecycleData.finalizedDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-pms-darkGreen">
                      {lifecycleData.overallScore?.toFixed(2)} / 5.00
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* HR Finalise and Submit Modal */}
      {finalizeModalOpen && lifecycleData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-pms-lightGreen text-pms-darkGreen rounded-xl">
                <FileCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-pms-gray">Finalise & Publish Appraisal</h3>
                <p className="text-xs text-slate-400">Employee: {lifecycleData.employee.name} ({lifecycleData.cycleMonth})</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Final Appraisal Score (1.00 - 5.00) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="5.0"
                  value={hrScore}
                  onChange={(e) => handleScoreChange(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Performance Grade
                </label>
                <input
                  type="text"
                  value={hrGrade}
                  onChange={(e) => setHrGrade(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  HR Remarks & Final Comments
                </label>
                <textarea
                  rows={3}
                  value={hrComments}
                  onChange={(e) => setHrComments(e.target.value)}
                  placeholder="Enter HR approval remarks..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizePms}
                disabled={finalizing}
                className="px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                <CheckCircle2 size={14} />
                <span>{finalizing ? 'Publishing...' : 'Finalise & Publish Result'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrPmsLifecyclePage;
