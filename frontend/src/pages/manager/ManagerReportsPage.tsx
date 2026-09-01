import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmsApi } from '../../api/pmsApi';
import { managerApi } from '../../api/managerApi';
import { reportApi } from '../../api/reportApi';
import { ManagerReportData, ManagerEmployeeItem, PmsHistory, PmsAssignment } from '../../types';
import {
  FileText,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  Users,
  Award,
  Search,
  User,
  Eye,
  BarChart2
} from 'lucide-react';

export const ManagerReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reportTab, setReportTab] = useState<'TEAM' | 'MY_RATINGS'>('TEAM');
  const [reportsData, setReportsData] = useState<ManagerReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manager's own personal appraisal history state
  const [myHistoryList, setMyHistoryList] = useState<PmsHistory[]>([]);
  const [myCurrentAssignment, setMyCurrentAssignment] = useState<PmsAssignment | null>(null);
  const [myCycleFilter, setMyCycleFilter] = useState<'ALL' | 'LAST_3_MONTHS' | 'QUARTERLY'>('ALL');

  useEffect(() => {
    fetchReports();
    fetchMyPersonalRatings();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await managerApi.getReports();
      setReportsData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load manager reports', err);
      setError('Unable to load team appraisal reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPersonalRatings = async () => {
    try {
      const [hist, current] = await Promise.all([
        pmsApi.getHistory().catch(() => []),
        pmsApi.getCurrentAssignment().catch(() => null)
      ]);
      setMyHistoryList(hist);
      setMyCurrentAssignment(current);
    } catch (err) {
      console.error('Failed to load manager personal ratings', err);
    }
  };

  const handleDownload = async (assignmentId: number, format: 'pdf' | 'excel', employeeName: string) => {
    try {
      setDownloading(assignmentId);
      const blob = await managerApi.downloadReport(assignmentId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PMS_Report_${employeeName.replace(/\s+/g, '_')}_${assignmentId}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download failed', err);
      alert('Failed to download report. Please ensure the PMS record has generated metrics.');
    } finally {
      setDownloading(null);
    }
  };

  const filteredEmployees = (reportsData?.assignedEmployees || []).filter((emp: ManagerEmployeeItem) => {
    if (selectedEmployeeId !== 'ALL' && emp.id.toString() !== selectedEmployeeId) return false;
    if (selectedMonth !== 'ALL' && emp.cycleMonth !== selectedMonth) return false;
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'FINALIZED' && emp.status !== 'COMPLETED' && emp.status !== 'FINAL_RESULT_PUBLISHED') return false;
      if (selectedStatus === 'PENDING_MGR' && emp.status !== 'SELF_ASSESSMENT_SUBMITTED' && emp.status !== 'MANAGER_REVIEW_PENDING') return false;
      if (selectedStatus === 'REVIEWED_MGR' && emp.status !== 'MANAGER_REVIEW_SUBMITTED' && emp.status !== 'HR_REVIEW_PENDING') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueMonths: string[] = Array.from(new Set((reportsData?.assignedEmployees || []).map((e: ManagerEmployeeItem) => e.cycleMonth || 'August 2026')));

  const filteredMyHistory = myHistoryList.filter((h, idx) => {
    if (myCycleFilter === 'LAST_3_MONTHS') return idx < 3;
    if (myCycleFilter === 'QUARTERLY') return h.cycleMonth.toLowerCase().includes('q') || idx < 3;
    return true;
  });

  const last3MyReports = myHistoryList.slice(0, 3);
  const avg3MonthScore = last3MyReports.length > 0
    ? (last3MyReports.reduce((sum, r) => sum + r.finalScore, 0) / last3MyReports.length).toFixed(2)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Manager Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Tab Toggle */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
            <FileText size={16} />
            <span>Manager Appraisal Center • Team & Self Analytics</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Appraisal & Rating Reports</h1>
          <p className="text-slate-500 text-sm mt-1">
            Switch between direct report performance tracking and your own personal appraisal score history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => setReportTab('TEAM')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              reportTab === 'TEAM'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            <span>Team Appraisal Reports</span>
          </button>
          <button
            onClick={() => setReportTab('MY_RATINGS')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              reportTab === 'MY_RATINGS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={16} />
            <span>My Personal Ratings & Reports</span>
          </button>
        </div>
      </div>

      {reportTab === 'MY_RATINGS' ? (
        /* MANAGER'S PERSONAL RATINGS & REPORTS VIEW */
        <div className="space-y-8 animate-fadeIn">
          {/* Top Personal Ratings Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-pms-green uppercase tracking-wider block mb-1">
                  Manager Self & HR Appraisal Record
                </span>
                <h2 className="text-xl font-bold text-slate-900">My Performance Score History & Evaluation</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect your ratings, manager & HR feedback, and per-KPI evaluation score graphs.
                </p>
              </div>
            </div>

            {/* Current Assignment KPI Table & Bar Graphs */}
            {myCurrentAssignment ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80">
                  <div className="flex items-center space-x-3">
                    <Award className="text-purple-700" size={24} />
                    <div>
                      <h4 className="text-sm font-bold text-purple-950">Active Cycle: {myCurrentAssignment.cycleMonth}</h4>
                      <p className="text-xs text-purple-700">Status: {myCurrentAssignment.status.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Final Approved Score</span>
                    <span className="text-2xl font-black text-purple-900">
                      {myCurrentAssignment.overallScore !== null ? myCurrentAssignment.overallScore.toFixed(2) : 'Under Review'}
                      <span className="text-xs font-semibold text-slate-400"> / 5.0</span>
                    </span>
                  </div>
                </div>

                {/* Per-KPI Detailed Cards with Graphs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">KPI Ratings & Score Comparison Graphs</h3>
                  {myCurrentAssignment.kpis.map((kpi: any, idx: number) => {
                    const effectiveRating = kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 0;
                    return (
                      <div key={kpi.kpiId} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-pms-lightGreen text-pms-darkGreen text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">{kpi.kpiName}</h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                Weight: {kpi.weightage}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{kpi.description}</p>
                          </div>

                          <div className="shrink-0 text-right bg-white p-3 rounded-xl border border-slate-200 min-w-[120px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Manager & HR Rating</span>
                            <span className="text-lg font-black text-purple-900">{effectiveRating.toFixed(1)} / 5.0</span>
                          </div>
                        </div>

                        {/* Per-KPI Score Bar Graph Comparison */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Score Comparison Graph</span>
                            <span className="text-purple-700 font-extrabold">Effective: {effectiveRating.toFixed(1)}</span>
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-0.5">
                                <span>Self Rating</span>
                                <span>{kpi.selfRating !== null ? kpi.selfRating.toFixed(1) : 'N/A'}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${((kpi.selfRating || 0) / 5) * 100}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] text-purple-700 font-semibold mb-0.5">
                                <span>Manager & HR Rating</span>
                                <span>{effectiveRating.toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(effectiveRating / 5) * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {kpi.comments && (
                          <p className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200/70 italic">
                            <strong>My Self Comments:</strong> "{kpi.comments}"
                          </p>
                        )}
                        {kpi.managerComments && (
                          <p className="text-[11px] text-purple-950 bg-purple-100/60 p-3 rounded-xl border border-purple-200 italic">
                            <strong>Manager & HR Remarks:</strong> "{kpi.managerComments}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No current appraisal record loaded.
              </div>
            )}
          </div>

          {/* Historical Cycles List */}
          {myHistoryList.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <Clock size={16} className="text-slate-400" />
                    <span>Appraisal Reports Repository</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access your finalized historical performance reports, 3-month quarterly evaluations, and download PDF certifications.
                  </p>
                </div>

                {/* 3-Month Appraisal Cycle Filter Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    onClick={() => setMyCycleFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      myCycleFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Reports ({myHistoryList.length})
                  </button>
                  <button
                    onClick={() => setMyCycleFilter('LAST_3_MONTHS')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      myCycleFilter === 'LAST_3_MONTHS'
                        ? 'bg-pms-green text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Last 3 Months Evaluation
                  </button>
                  <button
                    onClick={() => setMyCycleFilter('QUARTERLY')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      myCycleFilter === 'QUARTERLY'
                        ? 'bg-pms-green text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3-Month Quarterly View
                  </button>
                </div>
              </div>

              {/* 3-Month Performance Summary Banner */}
              {avg3MonthScore && (
                <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-pms-darkGreen text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                      3-Month Appraisal Performance Summary
                    </span>
                    <h3 className="text-xl font-bold mt-1">3-Month Average Score: {avg3MonthScore} / 5.00</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Based on your latest 3 consecutive monthly PMS appraisal cycles.
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/20">
                    <span className="text-[9px] font-bold uppercase text-slate-300 block">3-Month Grade</span>
                    <span className="text-lg font-black text-pms-green">
                      {Number(avg3MonthScore) >= 4.5 ? 'Outstanding' : Number(avg3MonthScore) >= 4.0 ? 'Excellent' : 'Very Good'}
                    </span>
                  </div>
                </div>
              )}

              {/* Monthly Appraisal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMyHistory.map((h: PmsHistory) => (
                  <div
                    key={h.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-pms-lightGreen flex items-center justify-center text-pms-darkGreen shrink-0 font-semibold shadow-inner">
                          <FileText size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-pms-gray">{h.cycleMonth} Appraisal</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Finalized on {h.finalizedDate}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded">
                          Score: {h.finalScore.toFixed(2)} / 5.00
                        </span>
                        <span className="text-[11px] font-bold text-pms-darkGreen bg-pms-lightGreen/60 border border-pms-green/20 px-3 py-1 rounded-full uppercase tracking-wider">
                          {h.grade}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: View & Download PDF */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                      <button
                        onClick={() => navigate(`/history/${h.assignmentId || h.id}`)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-pms-gray rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
                        title="View online report details"
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleDownload(h.assignmentId || h.id, 'pdf', 'My_Report')}
                        disabled={downloading === (h.assignmentId || h.id)}
                        className="px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow disabled:opacity-50"
                        title="Download PDF report"
                      >
                        <Download size={15} className={downloading === (h.assignmentId || h.id) ? 'animate-bounce' : ''} />
                        <span>{downloading === (h.assignmentId || h.id) ? 'Downloading...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DIRECT REPORTS TEAM APPRAISAL VIEW */
        <>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm font-medium">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assigned Reports</span>
          <div className="text-3xl font-black text-slate-800 mt-2">{reportsData?.totalAssigned || 0}</div>
          <span className="text-xs text-blue-600 font-semibold block mt-1">Total Team Size</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Self Submitted</span>
          <div className="text-3xl font-black text-slate-800 mt-2">{reportsData?.selfAssessmentCompletedCount || 0}</div>
          <span className="text-xs text-emerald-600 font-semibold block mt-1">Employees Completed</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Manager Reviews</span>
          <div className="text-3xl font-black text-slate-800 mt-2">{reportsData?.managerReviewCompletedCount || 0}</div>
          <span className="text-xs text-purple-600 font-semibold block mt-1">Submitted to HR</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Finalized Cycles</span>
          <div className="text-3xl font-black text-slate-800 mt-2">{reportsData?.finalizedRecordsCount || 0}</div>
          <span className="text-xs text-pms-darkGreen font-semibold block mt-1">HR Published Records</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
          <Filter size={18} className="text-slate-400" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Employee Filter */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Filter by Employee</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
            >
              <option value="ALL">All Team Members ({reportsData?.assignedEmployees.length || 0})</option>
              {reportsData?.assignedEmployees.map((e: ManagerEmployeeItem) => (
                <option key={e.id} value={e.id.toString()}>{e.name} ({e.employeeCode})</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Appraisal Cycle</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
            >
              <option value="ALL">All Cycles</option>
              {uniqueMonths.map((m: string) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Appraisal Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="FINALIZED">Finalized / Published</option>
              <option value="PENDING_MGR">Awaiting Manager Review</option>
              <option value="REVIEWED_MGR">Manager Reviewed / In HR</option>
            </select>
          </div>

          {/* Text Search */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Designation</th>
                <th className="py-4 px-6">Cycle</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Score & Grade</th>
                <th className="py-4 px-6 text-right">Download Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold">No reports matching filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp: ManagerEmployeeItem) => {
                  const isFinalized = emp.status === 'COMPLETED' || emp.status === 'FINAL_RESULT_PUBLISHED';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.employeeCode} • {emp.email}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {emp.designation}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {emp.cycleMonth || 'August 2026'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isFinalized
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.status === 'MANAGER_REVIEW_SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isFinalized ? <Lock size={12} /> : <Clock size={12} />}
                          <span>{emp.status.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {emp.overallScore != null ? (
                          <div>
                            <span className="font-black text-pms-darkGreen text-base">
                              {emp.overallScore.toFixed(2)} / 5.0
                            </span>
                            {emp.performanceGrade && (
                              <span className="block text-[11px] font-semibold text-slate-500">
                                {emp.performanceGrade}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Pending Finalization</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {emp.assignmentId ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(emp.assignmentId!, 'pdf', emp.name)}
                              disabled={downloading === emp.assignmentId}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                              title="Download PDF Report"
                            >
                              <Download size={14} />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => handleDownload(emp.assignmentId!, 'excel', emp.name)}
                              disabled={downloading === emp.assignmentId}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                              title="Download Excel Report"
                            >
                              <Download size={14} />
                              <span>Excel</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default ManagerReportsPage;
