import React, { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { PmsAssignment, Kpi } from '../../types';
import {
  Target,
  Clock,
  CheckCircle2,
  Lock,
  Send,
  AlertCircle,
  Save,
  Info,
  Calendar,
  Award
} from 'lucide-react';

export const ManagerMyKpisPage: React.FC = () => {
  const [assignment, setAssignment] = useState<PmsAssignment | null>(null);
  const [ratings, setRatings] = useState<Record<number, { rating: number | ''; comments: string }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PmsAssignment>('/employee/pms/current');
      setAssignment(res.data);

      const initialRatings: Record<number, { rating: number | ''; comments: string }> = {};
      if (res.data.kpis) {
        res.data.kpis.forEach((k: Kpi) => {
          initialRatings[k.kpiId] = {
            rating: k.selfRating !== null ? k.selfRating : '',
            comments: k.comments || ''
          };
        });
      }
      setRatings(initialRatings);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load manager assignment', err);
      setError('Unable to load your active PMS assignment.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmittedOrLocked =
    assignment?.status === 'SELF_ASSESSMENT_SUBMITTED' ||
    assignment?.status === 'MANAGER_REVIEW_PENDING' ||
    assignment?.status === 'MANAGER_REVIEW_SUBMITTED' ||
    assignment?.status === 'HR_REVIEW_PENDING' ||
    assignment?.status === 'HR_REVIEW_COMPLETED' ||
    assignment?.status === 'FINAL_RESULT_PUBLISHED' ||
    assignment?.status === 'COMPLETED';

  const handleRatingChange = (kpiId: number, value: string) => {
    if (isSubmittedOrLocked) return;
    const num = value === '' ? '' : parseFloat(value);
    if (typeof num === 'number' && (num < 0 || num > 5)) return;
    setRatings(prev => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], rating: num }
    }));
  };

  const handleCommentsChange = (kpiId: number, comments: string) => {
    if (isSubmittedOrLocked) return;
    setRatings(prev => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], comments }
    }));
  };

  const calculateWeightedScore = () => {
    if (!assignment?.kpis) return 0;
    let total = 0;
    assignment.kpis.forEach((k) => {
      const r = ratings[k.kpiId]?.rating;
      if (typeof r === 'number') {
        total += r * (k.weightage / 100);
      }
    });
    return Math.round(total * 100) / 100;
  };

  const handleSaveDraft = async () => {
    if (!assignment) return;
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        ratings: Object.entries(ratings).map(([kpiId, val]) => ({
          kpiId: parseInt(kpiId),
          selfRating: typeof val.rating === 'number' ? val.rating : null,
          comments: val.comments
        }))
      };
      await apiClient.put(`/employee/pms/${assignment.assignmentId}/draft`, payload);
      setSuccessMessage('Self-assessment draft saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    if (!window.confirm('Are you sure you want to submit your Self Assessment? Once submitted, your ratings will be locked.')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Validate all ratings are filled
      for (const k of assignment.kpis) {
        const val = ratings[k.kpiId]?.rating;
        if (typeof val !== 'number') {
          setError(`Please provide a rating for "${k.kpiName}".`);
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ratings: Object.entries(ratings).map(([kpiId, val]) => ({
          kpiId: parseInt(kpiId),
          selfRating: val.rating as number,
          comments: val.comments
        }))
      };

      await apiClient.post(`/employee/pms/${assignment.assignmentId}/submit`, payload);
      setSuccessMessage('Self-assessment submitted successfully! Your submission is now locked.');
      await fetchAssignment();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit self-assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading My KPIs...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle size={24} className="shrink-0 text-rose-500" />
          <p className="font-medium">{error}</p>
        </div>
        <button
          onClick={fetchAssignment}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-pms-green uppercase tracking-wider mb-2">
            <Target size={16} />
            <span>Manager Self-Assessment • {assignment?.cycleMonth || 'August 2026'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">View My KPIs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete your self-assessment ratings (0.0 - 5.0) and submit for appraisal review.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-2xl text-right">
            <span className="text-xs font-bold text-slate-400 uppercase block">Weighted Score</span>
            <span className="text-2xl font-black text-pms-darkGreen">
              {calculateWeightedScore()} <span className="text-sm font-semibold text-slate-400">/ 5.00</span>
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase block">Status</span>
            {isSubmittedOrLocked ? (
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full mt-1">
                <Lock size={12} />
                <span>SUBMITTED / LOCKED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mt-1">
                <Clock size={12} />
                <span>DRAFT IN PROGRESS</span>
              </span>
            )}
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

      {/* KPI Cards / List */}
      <div className="space-y-4">
        {assignment?.kpis?.map((kpi, idx) => {
          const currentRating = ratings[kpi.kpiId]?.rating ?? '';
          const currentComments = ratings[kpi.kpiId]?.comments ?? '';

          return (
            <div key={kpi.kpiId} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-xl bg-pms-lightGreen text-pms-darkGreen flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">{kpi.kpiName}</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      Weightage: {kpi.weightage}%
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{kpi.description}</p>
                </div>

                {/* Rating Input */}
                <div className="shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Self Rating (0 - 5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    disabled={isSubmittedOrLocked}
                    value={currentRating}
                    onChange={(e) => handleRatingChange(kpi.kpiId, e.target.value)}
                    placeholder="0.0"
                    className={`w-24 px-3 py-2 text-center text-xl font-bold rounded-xl border ${
                      isSubmittedOrLocked
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white text-slate-800 border-slate-300 focus:ring-2 focus:ring-pms-green focus:border-pms-green'
                    }`}
                  />
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Self Comments & Achievements
                </label>
                <textarea
                  disabled={isSubmittedOrLocked}
                  value={currentComments}
                  onChange={(e) => handleCommentsChange(kpi.kpiId, e.target.value)}
                  placeholder={isSubmittedOrLocked ? 'No comments provided.' : 'Add your self-assessment evidence, deliverables, and comments...'}
                  rows={3}
                  className={`w-full p-4 rounded-xl border text-sm ${
                    isSubmittedOrLocked
                      ? 'bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-800 border-slate-200 focus:ring-2 focus:ring-pms-green focus:border-pms-green'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {!isSubmittedOrLocked ? (
        <div className="flex items-center justify-end space-x-4 bg-white p-6 rounded-2xl border border-slate-200/80">
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center space-x-2"
          >
            <Save size={18} />
            <span>Save Draft</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-pms-green hover:bg-pms-darkGreen text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Send size={18} />
            <span>Submit Self Assessment</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock size={20} className="text-emerald-700 shrink-0" />
            <p className="text-sm font-semibold text-emerald-900">
              Your Self Assessment is SUBMITTED and LOCKED. No further edits are permitted.
            </p>
          </div>
          <span className="px-4 py-1.5 bg-emerald-200/60 text-emerald-900 font-bold text-xs rounded-full uppercase tracking-wider">
            SUBMITTED / LOCKED
          </span>
        </div>
      )}
    </div>
  );
};

export default ManagerMyKpisPage;
