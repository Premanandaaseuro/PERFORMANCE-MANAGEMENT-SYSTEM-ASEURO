import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Employee, HrReportSummary, EmployeeLifecycleData } from '../../types';
import {
  FileText,
  Download,
  ArrowLeft,
  Filter,
  BarChart3,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  User,
  Building,
  Briefcase,
  MessageSquare
} from 'lucide-react';

export const HrReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [cycleMonth, setCycleMonth] = useState('August 2026');
  const [reportType, setReportType] = useState('Detailed Performance Report');
  
  const [summary, setSummary] = useState<HrReportSummary | null>(null);
  const [lifecycle, setLifecycle] = useState<EmployeeLifecycleData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load summary and employees
    Promise.all([
      hrApi.getReportsSummary(),
      hrApi.searchLifecycleEmployees()
    ])
      .then(([sumData, empList]) => {
        setSummary(sumData);
        setEmployees(empList);
        if (empList.length > 0) {
          setSelectedEmployeeId(empList[0].id);
          fetchEmployeeReport(empList[0].id);
        }
        setLoadingSummary(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load reporting data.');
        setLoadingSummary(false);
      });
  }, []);

  const fetchEmployeeReport = (empId: number) => {
    setLoadingReport(true);
    hrApi.getLifecycleDetail(empId)
      .then((data) => {
        setLifecycle(data);
        setLoadingReport(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingReport(false);
      });
  };

  const handleEmployeeChange = (empId: number) => {
    setSelectedEmployeeId(empId);
    fetchEmployeeReport(empId);
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!lifecycle || !lifecycle.assignmentId) {
      alert('No active or finalized PMS assignment available for download.');
      return;
    }

    setDownloading(true);
    try {
      const blob = await hrApi.downloadReport(lifecycle.assignmentId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PMS_Report_${lifecycle.employee.name.replace(/\s+/g, '_')}_${lifecycle.assignmentId}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Helper for Grade Badge styling
  const getGradeBadgeStyle = (grade?: string | null, score?: number | null) => {
    const val = score ?? 0;
    if (grade === 'EXCELLENT' || val >= 4.2) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (grade === 'VERY GOOD' || val >= 3.8) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (grade === 'GOOD' || val >= 3.0) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    } else if (grade === 'NEEDS IMPROVEMENT' || val >= 2.0) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  // Calculate self & manager average ratings
  const calculateSelfAvg = () => {
    if (!lifecycle?.kpis || lifecycle.kpis.length === 0) return 'N/A';
    let totalScore = 0;
    let totalWeight = 0;
    lifecycle.kpis.forEach(k => {
      if (k.selfRating != null) {
        totalScore += k.selfRating * k.weightage;
        totalWeight += k.weightage;
      }
    });
    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 'N/A';
  };

  const calculateManagerAvg = () => {
    if (!lifecycle?.kpis || lifecycle.kpis.length === 0) return 'N/A';
    let totalScore = 0;
    let totalWeight = 0;
    lifecycle.kpis.forEach(k => {
      if (k.managerRating != null) {
        totalScore += k.managerRating * k.weightage;
        totalWeight += k.weightage;
      }
    });
    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 'N/A';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
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
          <h2 className="text-2xl font-bold text-pms-gray">Corporate Performance Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic ratings distribution analytics and official performance document exports.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Dynamic Rating Category Distribution Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pms-gray">HR Rating Category Summary</h3>
              <p className="text-xs text-slate-500">Distribution of finalized employee appraisals across corporate rating categories</p>
            </div>
          </div>
          {summary && summary.totalFinalizedRecords > 0 && (
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Total Published</span>
              <span className="text-lg font-extrabold text-pms-darkGreen">{summary.totalFinalizedRecords} Employees</span>
            </div>
          )}
        </div>

        {loadingSummary ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading rating distribution...</div>
        ) : !summary || summary.totalFinalizedRecords === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No finalized PMS results available yet. Results will appear dynamically when appraisals are completed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Rating Category</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase text-center">Score Range</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase text-center">Employee Count</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase text-right">Percentage</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Distribution Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summary.categories.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-xs font-bold text-pms-gray">{cat.category}</td>
                    <td className="px-5 py-3.5 text-xs text-center text-slate-500 font-medium">
                      {cat.category === 'Excellent' ? '≥ 4.20' : cat.category === 'Very Good' ? '3.80 - 4.19' : cat.category === 'Good' ? '3.00 - 3.79' : cat.category === 'Needs Improvement' ? '2.00 - 2.99' : '< 2.00'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-slate-700 text-center">
                      {cat.count}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-pms-darkGreen text-right">
                      {cat.percentage}%
                    </td>
                    <td className="px-5 py-3.5 w-1/3">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div
                          className="bg-pms-green h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Report Generation & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-pms-lightGreen text-pms-darkGreen rounded-xl">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-pms-gray">Generate Individual Appraisal Reports</h3>
            <p className="text-xs text-slate-500">Select employee, appraisal cycle month, and report type to view/export</p>
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Employee Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Employee:
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(Number(e.target.value))}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (EMP-{emp.id}) - {emp.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Month / Cycle Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Appraisal Cycle Month:
            </label>
            <select
              value={cycleMonth}
              onChange={(e) => setCycleMonth(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
            >
              <option value="August 2026">August 2026 (Active Cycle)</option>
              <option value="July 2026">July 2026 (Finalized)</option>
              <option value="June 2026">June 2026 (Finalized)</option>
              <option value="May 2026">May 2026 (Finalized)</option>
            </select>
          </div>

          {/* Report Type Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Report Format Type:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
            >
              <option value="Detailed Performance Report">Detailed Performance Report</option>
              <option value="KPI Weightage Breakdown">KPI Weightage Breakdown</option>
              <option value="Manager & HR Review Sheet">Manager & HR Review Sheet</option>
            </select>
          </div>
        </div>

        {/* Live Export Bar */}
        {lifecycle && (
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-pms-gray">
                Report Target: {lifecycle.employee.name} • {cycleMonth}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Status: <strong className="text-slate-700">{lifecycle.status?.replace(/_/g, ' ') || 'ACTIVE'}</strong> • {lifecycle.kpis.length} Assigned KPIs
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={downloading || !lifecycle.assignmentId}
                onClick={() => handleDownload('pdf')}
                className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Download size={15} />
                <span>Export PDF Report</span>
              </button>
              <button
                type="button"
                disabled={downloading || !lifecycle.assignmentId}
                onClick={() => handleDownload('excel')}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={15} />
                <span>Export Excel Sheet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Detailed Employee Performance Report (Displayed Inline Below) */}
      {loadingReport ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600">Loading Employee Performance Report...</p>
        </div>
      ) : !lifecycle ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 p-8 text-center text-xs text-slate-400 shadow-sm">
          Please select an employee to view their detailed performance report.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 md:p-8 shadow-sm space-y-8 animate-fadeIn">
          
          {/* Report Header & Profile Card */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200/80 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pms-green to-pms-darkGreen text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
                {lifecycle.employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-extrabold text-pms-gray">{lifecycle.employee.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    EMP-{lifecycle.employee.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <Briefcase size={13} className="text-slate-400" />
                    <span>{lifecycle.employee.designation}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Building size={13} className="text-slate-400" />
                    <span>{lifecycle.employee.department}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <User size={13} className="text-slate-400" />
                    <span>Manager: {lifecycle.employee.managerName || 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Rating Category Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Final Score</span>
                <div className="text-2xl font-black text-pms-darkGreen">
                  {lifecycle.overallScore != null
                    ? `${lifecycle.overallScore.toFixed(2)} / 5.0`
                    : lifecycle.calculatedScore != null
                    ? `${lifecycle.calculatedScore.toFixed(2)} / 5.0`
                    : 'Pending'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Grade Category</span>
                <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-xl border ${getGradeBadgeStyle(lifecycle.performanceGrade, lifecycle.overallScore)}`}>
                  {lifecycle.performanceGrade || (lifecycle.overallScore ? (lifecycle.overallScore >= 4.2 ? 'EXCELLENT' : lifecycle.overallScore >= 3.8 ? 'VERY GOOD' : 'GOOD') : 'IN REVIEW')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned KPIs</span>
              <div className="text-xl font-black text-slate-800 mt-1">{lifecycle.kpis.length} KPIs</div>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Total Weightage: 100%</span>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Self Score Average</span>
              <div className="text-xl font-black text-blue-700 mt-1">{calculateSelfAvg()} / 5.0</div>
              <span className="text-[11px] text-blue-600 font-medium block mt-0.5">Employee Ratings</span>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Manager Score Average</span>
              <div className="text-xl font-black text-purple-700 mt-1">{calculateManagerAvg()} / 5.0</div>
              <span className="text-[11px] text-purple-600 font-medium block mt-0.5">Manager Evaluation</span>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Appraisal Status</span>
              <div className="text-sm font-black text-pms-darkGreen mt-2 flex items-center space-x-1.5">
                <CheckCircle2 size={16} />
                <span>{lifecycle.status?.replace(/_/g, ' ') || 'ACTIVE'}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Cycle: {cycleMonth}</span>
            </div>
          </div>

          {/* Detailed KPI Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText size={18} className="text-pms-green" />
                <h4 className="text-base font-bold text-pms-gray">KPI Performance & Rating Details</h4>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Format: {reportType}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase w-12">#</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase">KPI Title & Description</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-center w-24">Weightage</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-center w-28">Self Rating</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-center w-28">Manager Rating</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-center w-28">Final Rating</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-right w-28">Weighted Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lifecycle.kpis.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                        No KPIs assigned to this employee.
                      </td>
                    </tr>
                  ) : (
                    lifecycle.kpis.map((kpi, idx) => {
                      const effectiveRating = kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 0;
                      const weightedScore = (effectiveRating * kpi.weightage / 100).toFixed(2);

                      return (
                        <tr key={kpi.kpiId || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 text-xs font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-bold text-pms-gray">{kpi.kpiName}</div>
                            {kpi.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{kpi.description}</p>
                            )}
                            {kpi.comments && (
                              <div className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start space-x-1.5">
                                <MessageSquare size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <span><strong>Feedback:</strong> {kpi.comments}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-center text-slate-700">
                            {kpi.weightage}%
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-center text-blue-700">
                            {kpi.selfRating != null ? `${kpi.selfRating} / 5` : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-center text-purple-700">
                            {kpi.managerRating != null ? `${kpi.managerRating} / 5` : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-extrabold text-center text-emerald-800">
                            {effectiveRating > 0 ? `${effectiveRating} / 5` : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-black text-right text-pms-darkGreen">
                            {weightedScore}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-pms-gray">Total Summary</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {lifecycle.kpis.reduce((acc, k) => acc + k.weightage, 0)}%
                    </td>
                    <td className="px-4 py-3 text-center text-blue-700">{calculateSelfAvg()}</td>
                    <td className="px-4 py-3 text-center text-purple-700">{calculateManagerAvg()}</td>
                    <td className="px-4 py-3 text-center text-emerald-800">
                      {lifecycle.overallScore?.toFixed(2) || calculateManagerAvg()}
                    </td>
                    <td className="px-4 py-3 text-right text-pms-darkGreen text-sm font-black">
                      {lifecycle.overallScore?.toFixed(2) || (lifecycle.calculatedScore?.toFixed(2) ?? 'N/A')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Manager & HR Reviews Section (if present) */}
          {lifecycle.reviews && lifecycle.reviews.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200/80">
              <div className="flex items-center space-x-2">
                <MessageSquare size={18} className="text-purple-600" />
                <h4 className="text-base font-bold text-pms-gray">Official Appraisal Reviews & Remarks</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lifecycle.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-pms-gray">{rev.reviewerName}</span>
                      <span className="text-[11px] font-semibold text-purple-700 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                        {rev.reviewerRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{rev.comments}"</p>
                    <span className="text-[10px] text-slate-400 block text-right">{rev.reviewDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Export Action Footer */}
          <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Official document target: <strong className="text-pms-gray">{lifecycle.employee.name}</strong> • Cycle: <strong>{cycleMonth}</strong>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={downloading || !lifecycle.assignmentId}
                onClick={() => handleDownload('pdf')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Download size={15} />
                <span>Export PDF Report</span>
              </button>
              <button
                type="button"
                disabled={downloading || !lifecycle.assignmentId}
                onClick={() => handleDownload('excel')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <FileSpreadsheet size={15} />
                <span>Export Excel Sheet</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default HrReportsPage;
