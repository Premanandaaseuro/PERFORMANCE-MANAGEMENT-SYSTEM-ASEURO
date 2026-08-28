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

export const HistoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<PmsAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    pmsApi.getAssignmentDetail(Number(id))
      .then((res) => {
        setAssignment(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load historical details for this appraisal cycle.');
        setLoading(false);
      });
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
        
        <div className="flex items-center space-x-3">
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">KPI Description</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Weight</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Self Rating</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Manager Rating</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">HR Rating</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Final score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-xs">
              {assignment.kpis.map((kpi) => (
                <tr key={kpi.kpiId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-bold text-pms-gray text-sm">{kpi.kpiName}</p>
                    <p className="text-slate-500 mt-1 leading-relaxed">{kpi.description}</p>
                    {kpi.comments && (
                      <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 border border-slate-200/50 rounded italic">
                        <strong>Self Comments:</strong> {kpi.comments}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-pms-gray">{kpi.weightage}%</td>
                  <td className="px-6 py-5 text-center font-semibold text-slate-500">{kpi.selfRating !== null ? kpi.selfRating.toFixed(1) : 'N/A'}</td>
                  <td className="px-6 py-5 text-center font-semibold text-pms-darkGreen">{kpi.managerRating !== null ? kpi.managerRating.toFixed(1) : 'N/A'}</td>
                  <td className="px-6 py-5 text-center font-semibold text-pms-green">
                    {kpi.hrRating !== null
                      ? kpi.hrRating.toFixed(1)
                      : kpi.managerRating !== null
                      ? kpi.managerRating.toFixed(1)
                      : kpi.selfRating !== null
                      ? kpi.selfRating.toFixed(1)
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="font-bold text-pms-gray bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {kpi.hrRating !== null
                        ? kpi.hrRating.toFixed(1)
                        : kpi.managerRating !== null
                        ? kpi.managerRating.toFixed(1)
                        : kpi.selfRating !== null
                        ? kpi.selfRating.toFixed(1)
                        : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Remarks list */}
      {assignment.reviews.length > 0 && (
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-pms-gray pb-2 border-b border-slate-100">
            Reviews & Evaluators remarks
          </h3>
          <div className="space-y-4">
            {assignment.reviews.map((rev, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200/40 rounded-lg flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-full bg-pms-green/20 text-pms-darkGreen font-bold flex items-center justify-center uppercase shrink-0">
                  {rev.reviewerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-bold text-xs text-pms-gray">{rev.reviewerName}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                      {rev.reviewerRole}
                    </span>
                    <span className="text-[10px] text-slate-400">{rev.reviewDate}</span>
                  </div>
                  <p className="text-xs text-slate-650 mt-1.5 leading-relaxed italic">
                    "{rev.comments}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
export default HistoryDetail;
