import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Employee, EmployeeLifecycleData } from '../../types';
import {
  RefreshCw,
  Search,
  ArrowLeft,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Send,
  Lock,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Download
} from 'lucide-react';

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

  // Individual HR & Manager KPI Ratings State (Editable by HR)
  const [hrRatings, setHrRatings] = useState<Record<number, number>>({});
  const [managerRatings, setManagerRatings] = useState<Record<number, number>>({});

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
      const r = ratingsMap[kpi.kpiId] ?? kpi.hrRating ?? kpi.managerRating ?? 4.0;
      weightedSum += r * (kpi.weightage / 100);
      totalWeight += kpi.weightage;
    });
    const calculated = totalWeight > 0 ? Math.round((weightedSum / (totalWeight / 100)) * 100) / 100 : 4.0;
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
        data.kpis.forEach((kpi) => {
          initialHrRatings[kpi.kpiId] = (kpi.hrRating && kpi.hrRating >= 1.0) ? kpi.hrRating : ((kpi.managerRating && kpi.managerRating >= 1.0) ? kpi.managerRating : 4.0);
          initialMgrRatings[kpi.kpiId] = (kpi.managerRating && kpi.managerRating >= 1.0) ? kpi.managerRating : 4.0;
        });
        setHrRatings(initialHrRatings);
        setManagerRatings(initialMgrRatings);
        recalculateHrScore(data.kpis, initialHrRatings);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load employee PMS lifecycle.');
        setLoading(false);
      });
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
            Monitor real-time appraisal milestones and perform final HR score approvals.
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Search Employee:
            </label>
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

            {/* List of employees */}
            <div className="max-h-[500px] overflow-y-auto space-y-1.5 pt-2">
              {employeeResults.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => fetchLifecycle(emp.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${selectedEmployeeId === emp.id
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
                      <p className="text-xs font-bold truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{emp.designation}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </button>
              ))}
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
              {/* Employee Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  {lifecycleData.employee.profilePhoto ? (
                    <img src={lifecycleData.employee.profilePhoto} alt={lifecycleData.employee.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-pms-green text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
                      {lifecycleData.employee.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-pms-gray">{lifecycleData.employee.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        EMP-{lifecycleData.employee.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{lifecycleData.employee.designation}</span> • {lifecycleData.employee.department}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {lifecycleData.employee.email} • Reporting to: <strong className="text-slate-600">{lifecycleData.employee.managerName}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cycle Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mt-1 ${isCompleted
                    ? 'bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                    {lifecycleData.cycleMonth || 'August 2026'}: {lifecycleData.status?.replace(/_/g, ' ') || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* 5-Stage Visual Workflow Tracker (Dynamic from DB) */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Appraisal Workflow Progression Checkpoints
                </h4>

                <div className="grid grid-cols-5 gap-2 relative">
                  {lifecycleData.workflowStages.map((stage) => {
                    const isDone = stage.status === 'Completed';
                    const isPending = stage.status === 'Pending' || stage.status === 'In Progress';
                    return (
                      <div key={stage.step} className="flex flex-col items-center text-center p-2 rounded-xl">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${isDone
                          ? 'bg-pms-green text-white shadow-sm ring-4 ring-pms-green/15'
                          : isPending
                            ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                          {isDone ? <CheckCircle2 size={16} /> : stage.step}
                        </div>
                        <span className="text-xs font-bold text-pms-gray truncate w-full">{stage.title}</span>
                        <span className={`text-[10px] font-bold mt-0.5 ${isDone ? 'text-pms-darkGreen' : isPending ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                          {stage.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KPI Ratings & Evaluation Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    KPI Performance & Rating Details
                  </h4>
                  {lifecycleData.calculatedScore && (
                    <span className="text-xs font-extrabold text-pms-darkGreen">
                      Calculated Weighted Score: {lifecycleData.calculatedScore} / 5.00
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">KPI Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Weight</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Self Rating</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Manager Rating</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">HR Rating</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {lifecycleData.kpis.map((kpi) => (
                        <tr key={kpi.kpiId} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-pms-gray">{kpi.kpiName}</p>
                            <p className="text-[11px] text-slate-400">{kpi.description}</p>
                            {kpi.comments && (
                              <p className="text-[10px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded">
                                Employee Note: "{kpi.comments}"
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-pms-darkGreen text-center">
                            {kpi.weightage}%
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-center">
                            {kpi.selfRating !== null ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                                {kpi.selfRating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0.0"
                                max="5.0"
                                value={managerRatings[kpi.kpiId] !== undefined ? managerRatings[kpi.kpiId] : (kpi.managerRating ?? kpi.selfRating ?? 5.0)}
                                onChange={(e) => {
                                  const val = Math.min(5.0, Math.max(0.0, parseFloat(e.target.value) || 0));
                                  handleManagerKpiRatingChange(kpi.kpiId, val);
                                }}
                                className="w-16 px-2 py-1 border-2 border-purple-300 rounded-lg text-xs font-extrabold text-center text-purple-700 bg-purple-50/80 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none transition-all shadow-xs"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">/ 5.0</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0.0"
                                max="5.0"
                                value={hrRatings[kpi.kpiId] !== undefined ? hrRatings[kpi.kpiId] : (kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 5.0)}
                                onChange={(e) => {
                                  const val = Math.min(5.0, Math.max(0.0, parseFloat(e.target.value) || 0));
                                  handleHrKpiRatingChange(kpi.kpiId, val);
                                }}
                                className="w-16 px-2 py-1 border-2 border-blue-300 rounded-lg text-xs font-extrabold text-center text-blue-700 bg-blue-50/80 focus:bg-white focus:border-pms-green focus:ring-2 focus:ring-pms-green/20 focus:outline-none transition-all shadow-xs"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">/ 5.0</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${kpi.selfRating !== null ? 'bg-pms-lightGreen text-pms-darkGreen font-bold' : 'bg-slate-100 text-slate-400'
                              }`}>
                              {kpi.selfRating !== null ? 'RATED' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
