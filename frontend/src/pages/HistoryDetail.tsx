import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pmsApi } from '../api/pmsApi';
import { PmsAssignment } from '../types';
import { StatusBadge } from '../components/StatusBadge';
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
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  Award,
  Lock,
  Download
} from 'lucide-react';
import { reportApi } from '../api/reportApi';

import { PmsHistory } from '../types';

export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<PmsAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [historyList, setHistoryList] = useState<PmsHistory[]>([]);

  const loadAssignment = (targetId: number) => {
    setLoading(true);
    pmsApi.getAssignmentDetail(targetId)
      .then((res) => {
        setAssignment(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load historical details for this appraisal cycle.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      loadAssignment(Number(id));
    }
    pmsApi.getHistory()
      .then(res => setHistoryList(res))
      .catch(err => console.error(err));
  }, [id]);

  const handleDownload = async () => {
    if (!assignment) return;
    setDownloading(true);
    try {
      await reportApi.downloadReport(
        assignment.assignmentId,
        'pdf',
        `PMS_Report_${assignment.cycleMonth.replace(' ', '_')}.pdf`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to download report PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-96 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading Details</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Something went wrong.'}</p>
        <button
          onClick={() => navigate('/reports')}
          className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm shadow transition-colors"
        >
          Back to My Reports
        </button>
      </div>
    );
  }

  // Map KPI data for Recharts chart
  const chartData = assignment.kpis.map((kpi) => ({
    name: kpi.kpiName.length > 15 ? kpi.kpiName.substring(0, 15) + '...' : kpi.kpiName,
    'Self Rating': kpi.selfRating || 0,
    'Manager Rating': kpi.managerRating || 0,
    'HR/Final Rating': kpi.hrRating || 0,
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Back button & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-pms-gray self-start"
        >
          <ArrowLeft size={16} />
          <span>Back to My Reports</span>
        </button>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Previous Month / Cycle Selector */}
          {historyList.length > 0 && (
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Month:</label>
              <select
                value={assignment.assignmentId}
                onChange={(e) => {
                  const targetId = Number(e.target.value);
                  navigate(`/history/${targetId}`);
                  loadAssignment(targetId);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
              >
                {historyList.map((h) => (
                  <option key={h.id} value={h.assignmentId || h.id}>
                    {h.cycleMonth} (Score: {h.finalScore.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold text-xs rounded-lg shadow disabled:opacity-50"
          >
            <Download size={14} />
            <span>{downloading ? 'Downloading...' : 'Download PDF Report'}</span>
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold rounded-lg shadow-inner uppercase">
            <Lock size={12} className="text-slate-400" />
            <span>Finalized & Locked</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Employee details */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-pms-gray pb-2 border-b border-slate-100 flex items-center space-x-2">
            <User size={16} className="text-slate-400" />
            <span>Employee Information</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-450 font-medium">Name</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.employee.name}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Employee ID</p>
              <p className="text-pms-gray font-bold mt-0.5">EMP-{assignment.employee.id}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Designation</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.employee.designation}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Department</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.employee.department}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Team</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.employee.team || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Reporting Manager</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.employee.managerName}</p>
            </div>
          </div>
        </div>

        {/* Card 2: PMS Info */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-pms-gray pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Calendar size={16} className="text-slate-400" />
            <span>Appraisal Cycle details</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-450 font-medium">Appraisal Cycle</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.cycleMonth}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">PMS Status</p>
              <div className="mt-1">
                <StatusBadge status={assignment.status} />
              </div>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Start Date</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.startDate}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">End Date</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.endDate}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium">Published Date</p>
              <p className="text-pms-gray font-bold mt-0.5">{assignment.finalizedDate || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Score Summary Gauge */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pms-green/5 rounded-full filter blur-xl -z-10"></div>
          
          <div className="w-16 h-16 rounded-full bg-pms-lightGreen flex items-center justify-center text-pms-green shadow-inner">
            <Award size={32} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Final Performance Result</p>
            <h2 className="text-3xl font-extrabold text-pms-gray mt-1">
              {assignment.overallScore !== null ? assignment.overallScore.toFixed(2) : 'N/A'}
              <span className="text-xs text-slate-400 font-normal"> / 5.00</span>
            </h2>
            <p className="text-xs font-bold text-pms-darkGreen mt-1 uppercase tracking-wide">
              {assignment.performanceGrade || 'No Score Released'}
            </p>
          </div>
        </div>

      </div>

      {/* Visual Chart Breakdown */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-pms-gray mb-6 pb-2 border-b border-slate-100">
          Evaluations Comparison Chart
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
              <ChartTooltip />
              <Bar dataKey="Self Rating" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Manager Rating" fill="#4A7637" radius={[4, 4, 0, 0]} />
              <Bar dataKey="HR/Final Rating" fill="#6FC04A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI Details Table */}
      <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-pms-gray">KPI Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">KPI Description & Graph</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Weight</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Self Rating</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-purple-700 uppercase tracking-wider w-28">Manager & HR Rating</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Final score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-xs">
              {assignment.kpis.map((kpi) => {
                const effectiveRating = kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 0;
                return (
                  <tr key={kpi.kpiId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 space-y-2">
                      <p className="font-bold text-pms-gray text-sm">{kpi.kpiName}</p>
                      <p className="text-slate-500 leading-relaxed">{kpi.description}</p>
                      
                      {/* Per-KPI Score Bar Graph */}
                      <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 max-w-lg">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>Evaluation Score Comparison Graph</span>
                          <span className="text-pms-darkGreen">Effective: {effectiveRating.toFixed(1)} / 5.0</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>Self: {kpi.selfRating !== null ? kpi.selfRating.toFixed(1) : 'N/A'}</span>
                            <span>Manager: {kpi.managerRating !== null ? kpi.managerRating.toFixed(1) : 'N/A'}</span>
                            <span>HR: {kpi.hrRating !== null ? kpi.hrRating.toFixed(1) : 'N/A'}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                            <div className="bg-blue-500 h-full" style={{ width: `${((kpi.selfRating || 0) / 5) * 100}%` }} title="Self Rating"></div>
                            <div className="bg-purple-600 h-full" style={{ width: `${((kpi.managerRating || 0) / 5) * 100}%` }} title="Manager Rating"></div>
                            <div className="bg-emerald-600 h-full" style={{ width: `${((kpi.hrRating || 0) / 5) * 100}%` }} title="HR Rating"></div>
                          </div>
                        </div>
                      </div>

                      {kpi.comments && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 border border-slate-200/50 rounded italic">
                          <strong>Self Comments:</strong> {kpi.comments}
                        </p>
                      )}
                      {kpi.managerComments && (
                        <p className="text-[11px] text-slate-700 bg-emerald-50/70 p-2 border border-emerald-200/60 rounded italic">
                          <strong>Manager Remarks:</strong> {kpi.managerComments}
                        </p>
                      )}
                      {kpi.hrComments && (
                        <p className="text-[11px] text-purple-950 bg-purple-50 p-2 border border-purple-200/80 rounded italic font-medium">
                          <strong>HR Remarks:</strong> {kpi.hrComments}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-pms-gray">{kpi.weightage}%</td>
                    <td className="px-6 py-5 text-center font-semibold text-slate-500">{kpi.selfRating !== null ? kpi.selfRating.toFixed(1) : 'N/A'}</td>
                    <td className="px-6 py-5 text-center font-semibold text-purple-700 bg-purple-50/40 border-x border-purple-100">
                      <div>
                        <span className="font-extrabold">{effectiveRating.toFixed(1)}</span>
                        <span className="block text-[9px] text-purple-600 font-bold">
                          {kpi.hrRating !== null ? '(HR Approved)' : kpi.managerRating !== null ? '(Manager Review)' : '(Self)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="font-bold text-pms-gray bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                        {effectiveRating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default HistoryDetail;
