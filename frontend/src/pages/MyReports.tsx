import React, { useEffect, useState } from 'react';
import { pmsApi } from '../api/pmsApi';
import { reportApi } from '../api/reportApi';
import { PmsHistory } from '../types';
import { FileText, Download, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<PmsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track downloading states per report
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [cycleFilter, setCycleFilter] = useState<'ALL' | 'LAST_3_MONTHS' | 'QUARTERLY'>('ALL');

  useEffect(() => {
    pmsApi.getHistory()
      .then((res) => {
        setReports(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to retrieve finalized reports.');
        setLoading(false);
      });
  }, []);

  const triggerDownload = async (assignmentId: number, cycleMonth: string) => {
    setDownloading(prev => ({ ...prev, [assignmentId]: true }));
    const filename = `PMS_Report_${cycleMonth.replace(' ', '_')}.pdf`;

    try {
      await reportApi.downloadReport(assignmentId, 'pdf', filename);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const filteredReports = reports.filter((r, idx) => {
    if (cycleFilter === 'LAST_3_MONTHS') {
      return idx < 3; // Top 3 recent months
    }
    if (cycleFilter === 'QUARTERLY') {
      return r.cycleMonth.toLowerCase().includes('q') || idx < 3;
    }
    return true;
  });

  const last3Reports = reports.slice(0, 3);
  const avg3MonthScore = last3Reports.length > 0
    ? (last3Reports.reduce((sum, r) => sum + r.finalScore, 0) / last3Reports.length).toFixed(2)
    : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 h-40 skeleton-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading Reports</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-pms-gray">Appraisal Reports Repository</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access finalized historical performance reports, 3-month quarterly evaluations, and download PDF certifications.
          </p>
        </div>

        {/* 3-Month Appraisal Cycle Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setCycleFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${cycleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => setCycleFilter('LAST_3_MONTHS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${cycleFilter === 'LAST_3_MONTHS' ? 'bg-pms-green text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Last 3 Months Evaluation
          </button>
          <button
            onClick={() => setCycleFilter('QUARTERLY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${cycleFilter === 'QUARTERLY' ? 'bg-pms-green text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            3-Month Quarterly View
          </button>
        </div>
      </div>

      {/* 3-Month Performance Summary Card */}
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

      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FileText size={24} />
          </div>
          <h3 className="text-sm font-bold text-pms-gray mb-1">No reports available</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Finalized monthly PMS appraisal reports will appear here for review and download.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-pms-lightGreen flex items-center justify-center text-pms-darkGreen shrink-0 font-semibold shadow-inner">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-pms-gray">{report.cycleMonth} Appraisal</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Finalized on {report.finalizedDate}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded">
                    Score: {report.finalScore.toFixed(2)} / 5.00
                  </span>
                  <span className="text-[11px] font-bold text-pms-darkGreen bg-pms-lightGreen/60 border border-pms-green/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {report.grade}
                  </span>
                </div>
              </div>

              {/* Action buttons: Strictly View and Download PDF */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                
                {/* View Details */}
                <button
                  onClick={() => navigate(`/history/${report.assignmentId || report.id}`)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-pms-gray rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm"
                  title="View online report details"
                >
                  <Eye size={15} />
                  <span>View</span>
                </button>

                {/* Download PDF */}
                <button
                  onClick={() => triggerDownload(report.assignmentId || report.id, report.cycleMonth)}
                  disabled={downloading[report.assignmentId || report.id]}
                  className="px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow disabled:opacity-50"
                  title="Download PDF report"
                >
                  <Download size={15} className={downloading[report.assignmentId || report.id] ? 'animate-bounce' : ''} />
                  <span>{downloading[report.assignmentId || report.id] ? 'Downloading...' : 'Download PDF'}</span>
                </button>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyReports;
