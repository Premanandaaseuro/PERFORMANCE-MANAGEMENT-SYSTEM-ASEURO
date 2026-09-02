import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { pmsApi } from '../../api/pmsApi';
import { reportApi } from '../../api/reportApi';
import { Employee, HrReportSummary, EmployeeLifecycleData, PmsHistory } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';
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
  MessageSquare,
  Eye
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

  const [activeTab, setActiveTab] = useState<'CORPORATE' | 'SELF'>('CORPORATE');
  const [myHistoryList, setMyHistoryList] = useState<PmsHistory[]>([]);
  const [downloadingMyId, setDownloadingMyId] = useState<number | null>(null);

  useEffect(() => {
    // Load summary and employees
    Promise.all([
      hrApi.getReportsSummary(),
      hrApi.searchLifecycleEmployees(),
      pmsApi.getHistory()
    ])
      .then(([sumData, empList, historyData]) => {
        setSummary(sumData);
        setEmployees(empList);
        setMyHistoryList(historyData || []);
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

  const handleDownloadMyPdf = async (assignmentId: number, cycleMonth: string) => {
    setDownloadingMyId(assignmentId);
    try {
      await reportApi.downloadReport(assignmentId, 'pdf', `My_PMS_Report_${cycleMonth.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloadingMyId(null);
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

  const last3Reports = myHistoryList.slice(0, 3);
  const avg3MonthScore = last3Reports.length > 0
    ? (last3Reports.reduce((sum, r) => sum + r.finalScore, 0) / last3Reports.length).toFixed(2)
    : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-pms-gray mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-2 text-xs font-bold text-pms-green uppercase tracking-wider mb-1">
            <FileText size={16} />
            <span>HR Appraisal & Analytics Center</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Appraisal & Rating Reports</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xl">
            Switch between company-wide performance tracking and your own personal appraisal score history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => setActiveTab('CORPORATE')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CORPORATE'
                ? 'bg-pms-green text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            <span>Company Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('SELF')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SELF'
                ? 'bg-pms-green text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={16} />
            <span>My Personal Ratings & Reports</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: MY PERSONAL RATINGS & REPORTS */}
      {activeTab === 'SELF' ? (
        <div className="space-y-6">
          {myHistoryList.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
              <FileText className="text-slate-300 mx-auto mb-3" size={48} />
              <h3 className="text-base font-bold text-slate-700">No Finalized Personal Reports Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your personal finalized performance appraisals will appear here once the active cycle evaluation is complete.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quarterly Performance Average Bar */}
              {avg3MonthScore && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-pms-green text-white flex items-center justify-center font-bold shadow-sm">
                      <Award size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Quarterly 3-Month Performance Average</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Rolling average score across your last 3 finalized cycles</p>
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-pms-darkGreen">{avg3MonthScore}</span>
                    <span className="text-sm text-slate-400 font-bold">/ 5.00</span>
                  </div>
                </div>
              )}

              {/* Monthly Appraisal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myHistoryList.map((h: PmsHistory) => (
                  <div
                    key={h.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
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

                    {/* Action Buttons: View and Download PDF */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                      <button
                        onClick={() => navigate(`/history/${h.assignmentId || h.id}`)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-pms-gray rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
                        title="View online report details"
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownloadMyPdf(h.assignmentId || h.id, h.cycleMonth)}
                        disabled={downloadingMyId === (h.assignmentId || h.id)}
                        className="px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                        title="Download PDF report"
                      >
                        <Download size={15} />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: CORPORATE PERFORMANCE REPORTS */
        <div className="space-y-8">
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
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rating Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Score Range</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Count</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Percentage</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Distribution Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {summary.categories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-pms-gray">{cat.category}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-semibold">
                          {cat.category === 'Excellent' ? '≥ 4.20' : cat.category === 'Very Good' ? '3.80 - 4.19' : cat.category === 'Good' ? '3.00 - 3.79' : cat.category === 'Needs Improvement' ? '2.00 - 2.99' : '< 2.00'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-pms-gray">{cat.count}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-700">{cat.percentage.toFixed(1)}%</td>
                        <td className="px-4 py-3.5 w-1/3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-pms-green h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(cat.percentage, 100)}%` }}
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

          {/* 2. Individual Appraisal Reports Generator */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Filter size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-pms-gray">Generate Individual Appraisal Reports</h3>
                <p className="text-xs text-slate-500">Select employee, appraisal cycle month, and report type to view/export</p>
              </div>
            </div>

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

            {/* Live Export & View Graphs Bar */}
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

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!lifecycle.assignmentId}
                    onClick={() => navigate(`/history/${lifecycle.assignmentId}`)}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    <Eye size={15} />
                    <span>View Full Report & Graphs</span>
                  </button>
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

              {/* Evaluations Comparison Chart (Visual Report Graph) */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200/80 gap-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={18} className="text-pms-green" />
                    <h4 className="text-sm font-bold text-pms-gray">
                      Evaluations Comparison Chart (Self vs Manager vs HR)
                    </h4>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px] font-bold">
                    <span className="flex items-center space-x-1.5 text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      <span>Self Rating</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-purple-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                      <span>Manager Rating</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>HR Rating</span>
                    </span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(lifecycle?.kpis || []).map((kpi) => ({
                        name: kpi.kpiName.length > 18 ? kpi.kpiName.substring(0, 16) + '...' : kpi.kpiName,
                        'Self Rating': kpi.selfRating != null ? kpi.selfRating : 0,
                        'Manager Rating': kpi.managerRating != null ? kpi.managerRating : 0,
                        'HR Rating': kpi.hrRating != null ? kpi.hrRating : 0,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <ChartTooltip />
                      <Bar dataKey="Self Rating" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Manager Rating" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="HR Rating" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                        <th className="px-4 py-3 text-xs font-bold uppercase text-center w-24">Self (10%)</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase text-center w-24">Manager (65%)</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase text-center w-24">HR (25%)</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase text-right w-24">Calculated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {lifecycle.kpis.map((kpi, index) => {
                        const weightedScore =
                          (kpi.selfRating != null ? kpi.selfRating * 0.1 : 0) +
                          (kpi.managerRating != null ? kpi.managerRating * 0.65 : 0) +
                          (kpi.hrRating != null ? kpi.hrRating * 0.25 : 0);

                        return (
                          <tr key={kpi.kpiId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 text-slate-400 font-semibold">{index + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-pms-gray">{kpi.kpiName}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{kpi.description}</div>
                              {kpi.employeeComments && (
                                <div className="text-[10px] text-blue-600 italic mt-1">
                                  Self comment: "{kpi.employeeComments}"
                                </div>
                              )}
                              {kpi.managerComments && (
                                <div className="text-[10px] text-purple-600 italic mt-0.5">
                                  Manager: "{kpi.managerComments}"
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">{kpi.weightage}%</td>
                            <td className="px-4 py-3.5 text-center font-bold text-blue-700">
                              {kpi.selfRating != null ? kpi.selfRating.toFixed(1) : '-'}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-purple-700">
                              {kpi.managerRating != null ? kpi.managerRating.toFixed(1) : '-'}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-pms-darkGreen">
                              {kpi.hrRating != null ? kpi.hrRating.toFixed(1) : '-'}
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-slate-800">
                              {weightedScore > 0 ? weightedScore.toFixed(2) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-xs text-pms-gray uppercase">Total Weighted Score</td>
                        <td className="px-4 py-3 text-center text-xs">100%</td>
                        <td className="px-4 py-3 text-center text-blue-700 text-xs">{calculateSelfAvg()}</td>
                        <td className="px-4 py-3 text-center text-purple-700 text-xs">{calculateManagerAvg()}</td>
                        <td className="px-4 py-3 text-center text-pms-darkGreen text-xs">
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
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!lifecycle.assignmentId}
                    onClick={() => navigate(`/history/${lifecycle.assignmentId}`)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    <Eye size={15} />
                    <span>View Full Report & Graphs</span>
                  </button>
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
      )}
    </div>
  );
};

export default HrReportsPage;
