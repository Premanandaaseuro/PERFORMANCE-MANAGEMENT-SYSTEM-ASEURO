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
  AlertCircle
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
    hrApi.getLifecycleDetail(empId)
      .then((data) => {
        setLifecycle(data);
      })
      .catch((err) => {
        console.error(err);
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

      {/* 1. Dynamic Rating Category Distribution Summary Table (Requirement 15) */}
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

      {/* 2. Report Generation & Filter Controls (Requirement 14) */}
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

        {/* Live Preview & Download Actions */}
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
    </div>
  );
};
export default HrReportsPage;
