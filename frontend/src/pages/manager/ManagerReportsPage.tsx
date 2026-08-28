import React, { useEffect, useState } from 'react';
import { managerApi } from '../../api/managerApi';
import { ManagerReportData, ManagerEmployeeItem } from '../../types';
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
  Search
} from 'lucide-react';

export const ManagerReportsPage: React.FC = () => {
  const [reportsData, setReportsData] = useState<ManagerReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchReports();
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

  const filteredEmployees = (reportsData?.assignedEmployees || []).filter((emp) => {
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

  const uniqueMonths = Array.from(new Set((reportsData?.assignedEmployees || []).map(e => e.cycleMonth || 'August 2026')));

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
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
            <FileText size={16} />
            <span>Team Analytics • Direct Reports Only</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Team PMS Reports</h1>
          <p className="text-slate-500 text-sm mt-1">
            Filter, inspect appraisal history, and download official performance reports for your direct reports.
          </p>
        </div>
      </div>

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
              <option value="ALL">All Team Members ({reportsData?.assignedEmployees.length})</option>
              {reportsData?.assignedEmployees.map((e) => (
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
              {uniqueMonths.map((m) => (
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
                filteredEmployees.map((emp) => {
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
    </div>
  );
};

export default ManagerReportsPage;
