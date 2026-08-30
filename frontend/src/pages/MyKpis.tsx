import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmsApi, KpiRatingRequest } from '../api/pmsApi';
import { PmsAssignment, Kpi, PmsHistory } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  MessageSquare,
  HelpCircle,
  FileCheck,
  ChevronRight
} from 'lucide-react';

import { RatingScaleLegend, RATING_DEFINITIONS } from '../components/RatingScaleLegend';

export const MyKpis: React.FC = () => {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<PmsAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local states for ratings and comments
  const [ratings, setRatings] = useState<Record<number, number | null>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  // UI states
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [historyList, setHistoryList] = useState<PmsHistory[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  const fetchAssignment = (assignmentId?: number) => {
    setLoading(true);
    const fetchCall = assignmentId
      ? pmsApi.getAssignmentDetail(assignmentId)
      : pmsApi.getCurrentAssignment();

    fetchCall
      .then((res) => {
        setAssignment(res);
        const initialRatings: Record<number, number | null> = {};
        const initialComments: Record<number, string> = {};
        res.kpis.forEach((kpi) => {
          initialRatings[kpi.kpiId] = kpi.selfRating;
          initialComments[kpi.kpiId] = kpi.comments || '';
        });
        setRatings(initialRatings);
        setComments(initialComments);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('No active cycle PMS details available. Please contact HR.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssignment();
    pmsApi.getHistory()
      .then(res => setHistoryList(res))
      .catch(err => console.error(err));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-48 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-96 skeleton-shimmer"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto mt-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-pms-gray mb-2">No Active PMS Cycle</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          There is currently no active appraisal cycle assigned to you. Contact your reporting manager or HR team if this is an error.
        </p>
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-pms-green hover:text-pms-darkGreen transition-colors"
        >
          <span>View finalized reports</span>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  const isReadOnly = assignment.status !== 'PMS_STARTED' && assignment.status !== 'SELF_ASSESSMENT_DRAFT';

  // Compute stats
  const totalKpis = assignment.kpis.length;
  const completedKpis = assignment.kpis.filter((kpi) => ratings[kpi.kpiId] !== null && ratings[kpi.kpiId] !== undefined).length;

  // Compute weightage progress
  let completedWeightage = 0;
  assignment.kpis.forEach((kpi) => {
    if (ratings[kpi.kpiId] !== null && ratings[kpi.kpiId] !== undefined) {
      completedWeightage += kpi.weightage;
    }
  });

  const progressPercentage = totalKpis > 0 ? Math.round((completedKpis / totalKpis) * 100) : 0;

  const handleRatingChange = (kpiId: number, val: number | null) => {
    if (isReadOnly) return;

    setValidationErrors((prev) => {
      const next = { ...prev };
      if (val === null) {
        delete next[kpiId];
      } else if (val < 0.0 || val > 5.0) {
        next[kpiId] = 'Rating must be between 0.0 and 5.0';
      } else {
        delete next[kpiId];
      }
      return next;
    });

    setRatings((prev) => ({ ...prev, [kpiId]: val }));
  };

  const handleCommentChange = (kpiId: number, val: string) => {
    if (isReadOnly) return;
    setComments(prev => ({ ...prev, [kpiId]: val }));
  };

  const buildRequestData = (): KpiRatingRequest => {
    const list = Object.keys(ratings).map((key) => {
      const kpiId = Number(key);
      return {
        kpiId,
        selfRating: ratings[kpiId],
        comments: comments[kpiId] || '',
      };
    });
    return { ratings: list };
  };

  const handleSaveDraft = async () => {
    if (isReadOnly) return;
    setError(null);
    setSaveSuccess(null);

    // Validate decimal ranges
    const errors: Record<number, string> = {};
    Object.keys(ratings).forEach((key) => {
      const kpiId = Number(key);
      const val = ratings[kpiId];
      if (val !== null && (val < 0.0 || val > 5.0)) {
        errors[kpiId] = 'Rating must be between 0.0 and 5.0';
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please correct errors before saving draft.');
      return;
    }

    try {
      await pmsApi.saveDraft(assignment.assignmentId, buildRequestData());
      setSaveSuccess('Draft saved successfully');
      setTimeout(() => setSaveSuccess(null), 4000);
      fetchAssignment(); // Refresh assignment info
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save assessment draft. Please try again.');
    }
  };

  const handleSubmitAssessment = async () => {
    if (isReadOnly) return;
    setError(null);
    setValidationErrors({});

    // Validate that all KPIs are rated
    const errors: Record<number, string> = {};
    assignment.kpis.forEach((kpi) => {
      const val = ratings[kpi.kpiId];
      if (val === null || val === undefined) {
        errors[kpi.kpiId] = 'Rating is required for submission';
      } else if (val < 0.0 || val > 5.0) {
        errors[kpi.kpiId] = 'Rating must be between 0.0 and 5.0';
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('All KPIs must be rated with valid values (0.0 - 5.0) before submitting.');
      setSubmitModalOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      await pmsApi.submitAssessment(assignment.assignmentId, buildRequestData());
      setSubmitModalOpen(false);
      setSaveSuccess('Self-assessment submitted successfully.');
      fetchAssignment(); // Refresh to lock inputs
    } catch (err: any) {
      console.error(err);
      setSubmitModalOpen(false);
      setError(err?.response?.data?.message || 'Failed to submit self-assessment. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return '10 Sept 2026';
    try {
      const d = new Date(deadlineStr);
      if (isNaN(d.getTime())) return deadlineStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return deadlineStr;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-pms-gray">My Assigned KPIs</h2>
            <StatusBadge status={assignment.status} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            PMS Appraisal Cycle: <span className="font-semibold text-pms-gray">{assignment.cycleMonth}</span> |
            Deadline: <span className="font-semibold text-rose-600">{formatDeadline(assignment.submissionDeadline)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Previous Month / Cycle Selector */}
          {historyList.length > 0 && (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cycle:</label>
              <select
                value={selectedAssignmentId || 'CURRENT'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CURRENT') {
                    setSelectedAssignmentId(null);
                    fetchAssignment();
                  } else {
                    const idNum = Number(val);
                    setSelectedAssignmentId(idNum);
                    fetchAssignment(idNum);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="CURRENT">Current Active Cycle ({assignment.cycleMonth})</option>
                {historyList.map((h) => (
                  <option key={h.id} value={h.assignmentId || h.id}>
                    {h.cycleMonth} (Score: {h.finalScore.toFixed(2)} - {h.grade})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Read-only Lock Indicator */}
          {isReadOnly && (
            <div className="flex items-center space-x-2 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg shadow-inner">
              <Lock size={15} className="text-slate-400" />
              <span>SUBMITTED / LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Banner */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">KPI Rating Summary</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-pms-gray">{completedKpis}</span>
            <span className="text-sm text-slate-400">/ {totalKpis} Completed</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Weightage</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-pms-darkGreen">{completedWeightage}%</span>
            <span className="text-sm text-slate-400">/ 100% Assigned</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Self Assessment Progress</p>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200/50">
            <div
              className="bg-pms-green h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-semibold">
            <span>{progressPercentage}% COMPLETE</span>
            <span>{100 - progressPercentage}% PENDING</span>
          </div>
        </div>
      </div>

      {/* Floating Notifications (Save success/error) */}
      {saveSuccess && (
        <div className="bg-pms-lightGreen border border-pms-green/20 text-pms-darkGreen p-4 rounded-xl flex items-center space-x-3 shadow-md border-l-4 border-l-pms-green animate-slideIn">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="text-xs font-bold">{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start space-x-3 shadow-md border-l-4 border-l-rose-500 animate-slideIn">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      )}

      {/* Rating Scale Legend Guide */}
      <RatingScaleLegend defaultExpanded={true} />

      {/* Main KPI list (Table for Desktop, Cards for Mobile) */}
      <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">KPI & Criteria</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Weight</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Self Rating (0.0 - 5.0)</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Comments / Evidence</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {assignment.kpis.map((kpi) => {
                const ratingError = validationErrors[kpi.kpiId];
                const currentRating = ratings[kpi.kpiId];

                return (
                  <tr key={kpi.kpiId} className="hover:bg-slate-50/50 transition-colors">
                    {/* KPI details */}
                    <td className="px-6 py-6">
                      <div className="font-bold text-pms-gray text-sm">{kpi.kpiName}</div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{kpi.description}</p>
                    </td>

                    {/* Weightage */}
                    <td className="px-6 py-6 text-center">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-pms-gray font-bold text-xs rounded">
                        {kpi.weightage}%
                      </span>
                    </td>

                    {/* Self Rating Input */}
                    <td className="px-6 py-6">
                      {isReadOnly ? (
                        <div className="font-semibold text-sm text-slate-600 bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg inline-block min-w-[60px] text-center">
                          {currentRating !== null && currentRating !== undefined ? currentRating.toFixed(1) : 'N/A'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {/* Standard text input */}
                            <input
                              type="number"
                              step="0.1"
                              value={currentRating !== null && currentRating !== undefined ? currentRating : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                handleRatingChange(kpi.kpiId, val);
                              }}
                              className={`w-20 px-3 py-2 border rounded-lg text-sm font-semibold text-pms-gray text-center focus:outline-none focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green transition-all ${ratingError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                }`}
                              placeholder="0.0"
                            />

                            {/* Simple Quick Scale Buttons */}
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((num) => {
                                const def = RATING_DEFINITIONS[num - 1];
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleRatingChange(kpi.kpiId, num)}
                                    title={`${num}: ${def.label} - ${def.shortDesc}`}
                                    className={`px-2.5 py-1.5 text-xs font-bold border rounded transition-all ${currentRating === num
                                      ? 'bg-pms-green text-white border-pms-green shadow-sm'
                                      : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                                      }`}
                                  >
                                    {num}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {ratingError && (
                            <p className="text-[10px] text-rose-600 font-semibold flex items-center space-x-1">
                              <AlertCircle size={10} />
                              <span>{ratingError}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Comments Area */}
                    <td className="px-6 py-6 space-y-2">
                      {isReadOnly ? (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2.5 border border-slate-100 rounded-lg italic leading-relaxed min-h-[40px]">
                          {comments[kpi.kpiId] || 'No comments entered.'}
                        </p>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={comments[kpi.kpiId]}
                            onChange={(e) => handleCommentChange(kpi.kpiId, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green transition-all resize-y min-h-[70px]"
                            placeholder="Explain achievements, support data, challenges..."
                            maxLength={1000}
                          ></textarea>
                          <span className="absolute bottom-2 right-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                            {comments[kpi.kpiId]?.length || 0} / 1000
                          </span>
                        </div>
                      )}

                      {/* Display Manager & HR Feedback and Graphical Progress Bar */}
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                            Manager & HR Evaluation Graph
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Effective Score: {((kpi.hrRating ?? kpi.managerRating ?? kpi.selfRating ?? 0)).toFixed(1)} / 5.0
                          </span>
                        </div>

                        {/* Per-KPI Score Bar Comparison */}
                        <div className="space-y-1.5 pt-1">
                          {/* Self Rating Bar */}
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                              <span>Self Rating</span>
                              <span>{kpi.selfRating !== null ? kpi.selfRating.toFixed(1) : 'N/A'} / 5.0</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${((kpi.selfRating || 0) / 5) * 100}%` }}></div>
                            </div>
                          </div>

                          {/* Manager Rating Bar */}
                          <div>
                            <div className="flex justify-between text-[10px] text-purple-700 font-bold mb-0.5">
                              <span>Manager Rating</span>
                              <span>{kpi.managerRating !== null ? kpi.managerRating.toFixed(1) : 'Pending Review'}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${((kpi.managerRating || 0) / 5) * 100}%` }}></div>
                            </div>
                          </div>

                          {/* HR Rating Bar */}
                          <div>
                            <div className="flex justify-between text-[10px] text-emerald-700 font-bold mb-0.5">
                              <span>HR Rating (Final)</span>
                              <span>{kpi.hrRating !== null ? kpi.hrRating.toFixed(1) : (kpi.managerRating !== null ? kpi.managerRating.toFixed(1) : 'Pending')}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${(((kpi.hrRating ?? kpi.managerRating) || 0) / 5) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {kpi.managerComments && (
                          <div className="mt-2 text-[11px] text-purple-950 font-medium italic bg-purple-50 p-2 rounded-lg border border-purple-200/60">
                            <strong>Manager/HR Remarks:</strong> "{kpi.managerComments}"
                          </div>
                        )}
                      </div>
                    </td>

                    {/* StatusBadge column */}
                    <td className="px-6 py-6 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${currentRating !== null && currentRating !== undefined
                        ? 'bg-pms-lightGreen text-pms-darkGreen border border-pms-green/10'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                        {currentRating !== null && currentRating !== undefined ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {assignment.kpis.map((kpi) => {
            const ratingError = validationErrors[kpi.kpiId];
            const currentRating = ratings[kpi.kpiId];

            return (
              <div key={kpi.kpiId} className="p-4 space-y-4">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-pms-gray text-sm">{kpi.kpiName}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-pms-gray font-bold text-[10px] rounded">
                      Weight: {kpi.weightage}%
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${currentRating !== null && currentRating !== undefined
                    ? 'bg-pms-lightGreen text-pms-darkGreen'
                    : 'bg-slate-100 text-slate-500'
                    }`}>
                    {currentRating !== null && currentRating !== undefined ? 'COMPLETED' : 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{kpi.description}</p>

                {/* Rating Input for Mobile */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Self Rating</label>
                  {isReadOnly ? (
                    <div className="font-bold text-xs text-slate-700 bg-slate-50 border border-slate-100 p-2 rounded-lg inline-block">
                      {currentRating !== null && currentRating !== undefined ? currentRating.toFixed(1) : 'N/A'}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={currentRating !== null && currentRating !== undefined ? currentRating : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            handleRatingChange(kpi.kpiId, val);
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-pms-green focus:border-pms-green"
                          placeholder="0.0"
                        />
                        <div className="flex space-x-0.5 flex-wrap">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleRatingChange(kpi.kpiId, num)}
                              className={`px-2 py-1 text-xs font-bold border rounded ${currentRating === num
                                ? 'bg-pms-green text-white border-pms-green'
                                : 'bg-white text-slate-500 border-slate-200'
                                }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      {ratingError && <p className="text-[10px] text-rose-600 font-bold">{ratingError}</p>}
                    </div>
                  )}
                </div>

                {/* Comments Area for Mobile */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments</label>
                  {isReadOnly ? (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                      {comments[kpi.kpiId] || 'No comments entered.'}
                    </p>
                  ) : (
                    <textarea
                      value={comments[kpi.kpiId]}
                      onChange={(e) => handleCommentChange(kpi.kpiId, e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs"
                      placeholder="Explain your performance..."
                      rows={3}
                    ></textarea>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Action panel at the bottom */}
      {!isReadOnly && (
        <div className="flex items-center justify-end space-x-4 bg-slate-100/50 p-4 border border-slate-200 rounded-xl">
          <button
            onClick={handleSaveDraft}
            className="flex items-center space-x-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold text-sm rounded-lg transition-colors bg-white shadow-sm"
          >
            <Save size={16} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => setSubmitModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Send size={16} />
            <span>Submit Self Assessment</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center space-x-3 text-amber-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold text-pms-gray">Submit Self Assessment?</h3>
            </div>

            <div className="text-xs text-slate-500 space-y-3 leading-relaxed">
              <p>
                Once submitted, your self-assessment will be frozen and sent for manager evaluation.
              </p>
              <p className="font-bold text-pms-darkGreen">
                You will no longer be able to edit ratings or comments for this appraisal cycle.
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitAssessment}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-pms-green hover:bg-pms-darkGreen rounded-lg shadow transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default MyKpis;
