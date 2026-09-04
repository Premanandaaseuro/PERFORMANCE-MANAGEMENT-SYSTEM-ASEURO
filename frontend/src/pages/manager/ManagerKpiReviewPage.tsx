import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { managerApi } from '../../api/managerApi';
import { ManagerEmployeeReviewData, ManagerKpiReviewDetail } from '../../types';
import {
  Users,
  Target,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Send,
  Save,
  Clock,
  Award,
  FileText
} from 'lucide-react';

import { RatingScaleLegend, RATING_DEFINITIONS } from '../../components/RatingScaleLegend';

const isHrStandardKpiName = (name: string): boolean => {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    n.includes('(hr assessment)') ||
    n.includes('(hr parameter)') ||
    n.includes('(hr rating)') ||
    n.includes('[hr]') ||
    n.includes('• hr parameter')
  );
};

export const ManagerKpiReviewPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const [reviewData, setReviewData] = useState<ManagerEmployeeReviewData | null>(null);
  const [managerRatings, setManagerRatings] = useState<Record<number, { rating: number | ''; comments: string }>>({});
  const [generalComments, setGeneralComments] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchReviewData(parseInt(employeeId));
    }
  }, [employeeId]);

  const fetchReviewData = async (empId: number) => {
    try {
      setLoading(true);
      const data = await managerApi.getEmployeeKpiReview(empId);
      setReviewData(data);
      setGeneralComments(data.managerReviewComments || '');

      const initial: Record<number, { rating: number | ''; comments: string }> = {};
      if (data.kpis) {
        data.kpis.forEach((k: ManagerKpiReviewDetail) => {
          initial[k.kpiId] = {
            rating: k.managerRating !== null ? k.managerRating : '',
            comments: k.managerComments || ''
          };
        });
      }
      setManagerRatings(initial);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load review data', err);
      setError(err.response?.data?.message || 'Unable to load employee review detail.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (kpiId: number, val: string) => {
    if (!reviewData?.canReview) return;
    const num = val === '' ? '' : parseFloat(val);
    if (typeof num === 'number' && (num < 0 || num > 5)) return;
    setManagerRatings(prev => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], rating: num }
    }));
  };

  const handleCommentsChange = (kpiId: number, comments: string) => {
    if (!reviewData?.canReview) return;
    setManagerRatings(prev => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], comments }
    }));
  };

  const calculateManagerWeightedScore = () => {
    if (!reviewData?.kpis) return 0;
    let total = 0;
    reviewData.kpis.forEach((k) => {
      const r = managerRatings[k.kpiId]?.rating;
      if (typeof r === 'number') {
        total += r * (k.weightage / 100);
      }
    });
    return Math.round(total * 100) / 100;
  };

  const handleSubmitReview = async () => {
    if (!reviewData) return;

    // Validation: All manager ratings provided must be between 0.0 and 5.0
    for (const k of reviewData.kpis) {
      const entry = managerRatings[k.kpiId];
      if (typeof entry?.rating === 'number' && (entry.rating < 0 || entry.rating > 5)) {
        setError(`Rating must be between 0.0 and 5.0 for "${k.kpiName}".`);
        return;
      }
    }

    if (!window.confirm('Are you sure you want to submit your Manager Review? Once submitted, your ratings will be published to HR.')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ratings: reviewData.kpis.map(k => {
          const entry = managerRatings[k.kpiId];
          const ratingNum = typeof entry?.rating === 'number' ? entry.rating : (Number(entry?.rating) || 0);
          return {
            kpiId: k.kpiId,
            managerRating: ratingNum,
            managerComments: entry?.comments || ''
          };
        }),
        managerComments: generalComments
      };

      const result = await managerApi.submitManagerReview(reviewData.assignmentId, payload);
      setSuccessMessage('Manager review submitted successfully.');
      if (employeeId) {
        await fetchReviewData(parseInt(employeeId));
      }
    } catch (err: any) {
      console.error('Failed to submit manager review', err);
      setError(err.response?.data?.message || 'Failed to submit manager review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Employee Review...</p>
        </div>
      </div>
    );
  }

  if (error && !reviewData) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/manager/employees')}
          className="inline-flex items-center space-x-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          <span>Back to Assigned Employees</span>
        </button>
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 flex items-center space-x-3">
          <AlertCircle size={24} className="shrink-0 text-rose-500" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const isLocked = !reviewData?.canReview;

  return (
    <div className="space-y-8">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/employees')}
          className="inline-flex items-center space-x-2 text-sm font-bold text-slate-500 hover:text-pms-darkGreen transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Assigned Employees</span>
        </button>

        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
          reviewData?.status === 'MANAGER_REVIEW_SUBMITTED' || reviewData?.status === 'HR_REVIEW_PENDING'
            ? 'bg-blue-100 text-blue-800'
            : reviewData?.status === 'COMPLETED'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {reviewData?.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Employee Details Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            {reviewData?.employee.profilePhoto ? (
              <img src={reviewData.employee.profilePhoto} alt={reviewData.employee.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
                {reviewData?.employee.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-800">{reviewData?.employee.name}</h1>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                  {reviewData?.employee.employeeCode}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {reviewData?.employee.designation} • {reviewData?.employee.department} • Cycle: {reviewData?.cycleMonth}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-center px-4 border-r border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Self Score</span>
              <span className="text-xl font-black text-slate-700">
                {reviewData?.selfCalculatedScore != null ? reviewData.selfCalculatedScore.toFixed(2) : '-'}
              </span>
            </div>
            <div className="text-center px-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Manager Score</span>
              <span className="text-xl font-black text-pms-darkGreen">
                {calculateManagerWeightedScore()} <span className="text-xs text-slate-400 font-semibold">/ 5.00</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3 text-sm font-medium">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm font-medium">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Performance Rating Scale Guide */}
      <RatingScaleLegend defaultExpanded={true} />

      {/* KPI Evaluation Matrix */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Assigned KPI Evaluation Matrix</h2>
          <span className="text-xs font-semibold text-slate-400">Total KPIs: {reviewData?.kpis.length}</span>
        </div>

        {reviewData?.kpis.map((kpi, idx) => {
          const currentRating = managerRatings[kpi.kpiId]?.rating ?? '';
          const currentComments = managerRatings[kpi.kpiId]?.comments ?? '';

          return (
            <div key={kpi.kpiId} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
              {/* Top row: Title + Weight + Self Rating + Manager Rating */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-xl bg-pms-lightGreen text-pms-darkGreen flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">{kpi.kpiName}</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      Weight: {kpi.weightage}%
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{kpi.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                  {/* Employee Self Rating Display */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center min-w-[110px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Self Rating</span>
                    <span className="text-xl font-bold text-slate-700">
                      {kpi.selfRating != null ? kpi.selfRating.toFixed(1) : '-'} <span className="text-xs text-slate-400">/ 5</span>
                    </span>
                  </div>

                  {/* Manager Rating Input / HR 25% Badge */}
                  {isHrStandardKpiName(kpi.kpiName) ? (
                    <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 text-center space-y-1 min-w-[160px]">
                      <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider block">
                        25% HR Parameter
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                        Evaluated by HR
                      </span>
                      <span className="text-[9px] text-purple-600 font-medium block">Rating handled exclusively by HR</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                      <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Manager Rating (0.0 - 5.0)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          disabled={isLocked || submitting}
                          value={currentRating}
                          onChange={(e) => handleRatingChange(kpi.kpiId, e.target.value)}
                          placeholder="0.0"
                          className={`w-20 px-2 py-1.5 text-center text-lg font-black rounded-xl border ${
                            isLocked
                              ? 'bg-white/80 text-slate-600 border-slate-200 cursor-not-allowed'
                              : 'bg-white text-pms-darkGreen border-emerald-300 focus:ring-2 focus:ring-pms-green'
                          }`}
                        />
                        {!isLocked && (
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((num) => {
                              const def = RATING_DEFINITIONS[num - 1];
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleRatingChange(kpi.kpiId, num.toString())}
                                  title={`${num}: ${def.label} - ${def.shortDesc}`}
                                  className={`px-2 py-1 text-xs font-bold border rounded-lg transition-all ${
                                    currentRating === num
                                      ? 'bg-pms-green text-white border-pms-green shadow-xs'
                                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Employee Evidence */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Employee Self Comments / Evidence
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    {kpi.employeeComments || 'No self comments provided by employee.'}
                  </p>
                </div>

                {/* Manager Comments */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Manager Feedback & Comments
                  </label>
                  <textarea
                    disabled={isLocked || submitting}
                    value={currentComments}
                    onChange={(e) => handleCommentsChange(kpi.kpiId, e.target.value)}
                    placeholder={isLocked ? 'No manager comments.' : 'Enter specific feedback for this KPI...'}
                    rows={2}
                    className={`w-full p-3 rounded-xl border text-sm ${
                      isLocked
                        ? 'bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200'
                        : 'bg-white text-slate-800 border-slate-200 focus:ring-2 focus:ring-pms-green'
                    }`}
                  />
                </div>

                {/* HR Feedback & Remarks */}
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80 space-y-1">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                    HR Feedback & Remarks
                  </span>
                  <p className="text-sm text-purple-950 leading-relaxed font-medium">
                    {kpi.hrComments || 'No HR feedback entered yet.'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Manager Review Comments */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-3">
        <label className="text-sm font-bold text-slate-800 tracking-tight block">
          Overall Manager Evaluation Comments & Remarks
        </label>
        <textarea
          disabled={isLocked || submitting}
          value={generalComments}
          onChange={(e) => setGeneralComments(e.target.value)}
          placeholder={isLocked ? 'No overall comments.' : 'Summarize the employee\'s performance, key strengths, and areas for improvement...'}
          rows={4}
          className={`w-full p-4 rounded-2xl border text-sm ${
            isLocked
              ? 'bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200'
              : 'bg-white text-slate-800 border-slate-200 focus:ring-2 focus:ring-pms-green'
          }`}
        />
      </div>

      {/* Submit Action Footer */}
      {!isLocked ? (
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80">
          <div className="text-xs text-slate-500 font-medium">
            Submitting will lock manager evaluation and notify HR for final appraisal review.
          </div>
          <button
            onClick={handleSubmitReview}
            disabled={submitting}
            className="px-8 py-3 bg-pms-green hover:bg-pms-darkGreen text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2 transform active:scale-95"
          >
            <Send size={18} />
            <span>{submitting ? 'Submitting...' : 'Submit Manager Review'}</span>
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock size={20} className="text-blue-700 shrink-0" />
            <p className="text-sm font-semibold text-blue-900">
              Manager evaluation has been submitted and locked. The appraisal is now in HR Review stage.
            </p>
          </div>
          <span className="px-4 py-1.5 bg-blue-200/60 text-blue-900 font-bold text-xs rounded-full uppercase tracking-wider">
            SUBMITTED TO HR
          </span>
        </div>
      )}
    </div>
  );
};

export default ManagerKpiReviewPage;
