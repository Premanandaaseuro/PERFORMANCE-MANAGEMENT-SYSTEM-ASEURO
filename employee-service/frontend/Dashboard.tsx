import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmsApi } from '../api/pmsApi';
import { DashboardData, PmsAssignment } from '../types';
import { Timeline } from '../components/Timeline';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  CheckCircle,
  FileCheck,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<PmsAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      pmsApi.getDashboard(),
      pmsApi.getCurrentAssignment()
    ])
      .then(([dashResult, assignResult]) => {
        if (dashResult.status === 'fulfilled') {
          setData(dashResult.value);
        } else {
          console.error(dashResult.reason);
          setError('Unable to load dashboard details. Please check your connections.');
        }

        if (assignResult.status === 'fulfilled') {
          setCurrentAssignment(assignResult.value);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load dashboard details. Please check your connections.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        {/* Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 h-32 space-y-3 shadow-sm">
              <div className="h-4 bg-slate-200 rounded w-2/3 skeleton-shimmer"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2 skeleton-shimmer"></div>
            </div>
          ))}
        </div>
        {/* Timeline Skeleton */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-64 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertTriangle className="text-amber-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">System Error</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Something went wrong.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm shadow transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle empty state if no active cycle
  if (data.currentCycle === 'N/A' || data.pmsStatus === 'PMS_NOT_STARTED') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto mt-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Calendar size={32} />
        </div>
        <h3 className="text-xl font-bold text-pms-gray mb-2">No Active PMS Cycle</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          There is currently no active performance management cycle assigned to you. When HR starts the next cycle, it will appear here.
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

  const completionPct = data.totalKpis > 0 ? Math.round((data.completedKpis / data.totalKpis) * 100) : 0;
  const isSelfAssessmentOpen = data.pmsStatus === 'PMS_STARTED' || data.pmsStatus === 'SELF_ASSESSMENT_DRAFT';

  // Calculate dynamic self-assessment rating from rated KPIs of the current cycle only
  let calculatedSelfRating = '0.00';
  if (currentAssignment && currentAssignment.kpis && currentAssignment.kpis.length > 0) {
    let totalRatedWeight = 0;
    let weightedSum = 0;
    let ratedCount = 0;

    currentAssignment.kpis.forEach((kpi) => {
      if (kpi.selfRating !== null && kpi.selfRating !== undefined) {
        ratedCount++;
        weightedSum += kpi.selfRating * kpi.weightage;
        totalRatedWeight += kpi.weightage;
      }
    });

    if (ratedCount > 0 && totalRatedWeight > 0) {
      calculatedSelfRating = (weightedSum / totalRatedWeight).toFixed(2);
    }
  }

  // Dynamic Current Stage Status Card synchronized with Appraisal Workflow Tracking
  const getCurrentStageInfo = () => {
    const status = data.pmsStatus;
    const completedKpis = data.completedKpis;
    const totalKpis = data.totalKpis;

    // Stage 1 & 2: Before Self Assessment is submitted
    if (status === 'PMS_STARTED' || status === 'SELF_ASSESSMENT_DRAFT') {
      if (completedKpis === 0) {
        return {
          title: 'Self Assessment',
          status: 'Not Started',
          remarks: 'Waiting to Start Self Assessment'
        };
      } else if (completedKpis > 0 && completedKpis < totalKpis) {
        return {
          title: 'Self Assessment',
          status: 'In Progress',
          remarks: 'Complete your self-assessment'
        };
      } else {
        return {
          title: 'Self Assessment',
          status: 'Completed',
          remarks: 'Awaiting Submission'
        };
      }
    }

    // Stage 3: Self Assessment Submitted / Manager Review Pending
    if (status === 'SELF_ASSESSMENT_SUBMITTED' || status === 'MANAGER_REVIEW_PENDING') {
      return {
        title: 'Manager Review',
        status: 'Pending',
        remarks: 'Awaiting Manager Remarks'
      };
    }

    // Stage 3 (In Progress): Manager Evaluation in progress
    if (status === 'MANAGER_REVIEW_IN_PROGRESS') {
      return {
        title: 'Manager Review',
        status: 'In Progress',
        remarks: 'Manager Evaluation in Progress'
      };
    }

    // Stage 4: HR Review (Manager Review completed)
    if (status === 'MANAGER_REVIEW_SUBMITTED' || status === 'HR_REVIEW_PENDING') {
      return {
        title: 'HR Review',
        status: 'Pending',
        remarks: 'Awaiting HR Verification'
      };
    }

    if (status === 'HR_REVIEW_IN_PROGRESS' || status === 'RATING_AND_POINTS_CALCULATED' || status === 'FINAL_ANALYSIS') {
      return {
        title: 'HR Review',
        status: 'In Progress',
        remarks: 'Awaiting HR Verification'
      };
    }

    // Stage 5: Final Result (HR Review completed / Published / Completed)
    if (status === 'HR_REVIEW_COMPLETED') {
      return {
        title: 'Final Result',
        status: 'Pending',
        remarks: 'Awaiting Final Result'
      };
    }

    if (status === 'FINAL_RESULT_PUBLISHED' || status === 'COMPLETED') {
      return {
        title: 'Final Result',
        status: 'Completed',
        remarks: 'PMS Cycle Completed'
      };
    }

    return {
      title: 'Self Assessment',
      status: 'Not Started',
      remarks: 'Waiting to Start Self Assessment'
    };
  };

  const currentStageInfo = getCurrentStageInfo();

  const isCycleFinalized = data.pmsStatus === 'HR_REVIEW_COMPLETED' ||
    data.pmsStatus === 'FINAL_RESULT_PUBLISHED' ||
    data.pmsStatus === 'COMPLETED';

  const latestFinalScoreDisplay = isCycleFinalized && currentAssignment?.overallScore !== null && currentAssignment?.overallScore !== undefined
    ? `${currentAssignment.overallScore.toFixed(2)} / 5.00`
    : isCycleFinalized && data.latestFinalizedScore !== null
      ? `${data.latestFinalizedScore.toFixed(2)} / 5.00`
      : '0.00 / 5.00';

  const latestFinalGradeDisplay = isCycleFinalized
    ? (currentAssignment?.performanceGrade || data.latestFinalizedGrade || 'Completed')
    : 'Pending HR Finalization';

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
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-pms-gray">Active Appraisal Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and complete your performance evaluation milestones.
          </p>
        </div>
        <div>
          <StatusBadge status={data.pmsStatus} />
        </div>
      </div>

      {/* Action Banner if action needed */}
      {isSelfAssessmentOpen ? (
        <div className="bg-pms-lightGreen border border-pms-green/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-lg text-pms-green border border-pms-green/10 shadow-sm shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-pms-darkGreen">
                {data.completedKpis === data.totalKpis && data.totalKpis > 0
                  ? 'Action Required: Submit Self-Assessment'
                  : 'Action Required: Self-Assessment Pending'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {data.completedKpis === data.totalKpis && data.totalKpis > 0
                  ? `You have completed ${data.completedKpis} of ${data.totalKpis} assigned KPIs. Please submit before the deadline.`
                  : `You have completed ${data.completedKpis} of ${data.totalKpis} assigned KPIs. Please complete and submit before the deadline.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/kpis')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <span>
              {data.completedKpis === 0
                ? 'Start Assessment'
                : data.completedKpis === data.totalKpis
                  ? 'Submit Assessment'
                  : 'Continue Assessment'}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (data.pmsStatus === 'SELF_ASSESSMENT_SUBMITTED' || data.pmsStatus === 'MANAGER_REVIEW_PENDING') ? (
        <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-white rounded-lg text-blue-600 border border-blue-100 shadow-sm shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Self-Assessment Submitted</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Your self-assessment has been submitted and is awaiting manager review.
            </p>
          </div>
        </div>
      ) : null}

      {/* Dashboard Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Active Cycle */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Cycle</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">{data.currentCycle}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Self Evaluation Period</p>
          </div>
        </div>

        {/* Card 2: Self Assessment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Self Assessment</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">
              {calculatedSelfRating} / 5.00
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {data.completedKpis} / {data.totalKpis} KPIs Rated
            </p>
          </div>
        </div>

        {/* Card 3: Current Workflow Stage Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <FileCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{currentStageInfo.title}</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">{currentStageInfo.status}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{currentStageInfo.remarks}</p>
          </div>
        </div>

        {/* Card 4: Latest Performance Finalized */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Finalized Score</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">
              {latestFinalScoreDisplay}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {latestFinalGradeDisplay}
            </p>
          </div>
        </div>

      </div>

      {/* Status Stepper Tracker */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-pms-gray">Appraisal Workflow Tracking</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current cycle progression checkpoint</p>
          </div>
          {isSelfAssessmentOpen ? (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 shadow-xs self-start sm:self-auto">
              Deadline: {formatDeadline(currentAssignment?.submissionDeadline)}
            </span>
          ) : (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 shadow-xs self-start sm:self-auto">
              Self-Assessment Submitted
            </span>
          )}
        </div>
        <Timeline status={data.pmsStatus} />
      </div>

      {/* Action / Next steps detail */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-pms-gray mb-4">Assessment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-pms-gray uppercase tracking-wider">Assessment Status</h4>
            <p className="text-xs text-slate-500 mt-2">{data.actionRequired}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-pms-gray uppercase tracking-wider">Weighted KPIs</h4>
            <p className="text-xs text-slate-500 mt-2">
              Your self-assessment progress accounts for <strong className="text-pms-darkGreen font-semibold">{data.completedWeightage}%</strong> of your total KPI weights. {data.completedWeightage < 100 ? 'Complete ratings to reach 100%.' : 'All assigned KPI weights completed.'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-pms-gray uppercase tracking-wider">Self Assessment Link</h4>
              <p className="text-xs text-slate-500 mt-2">Click to review individual KPI descriptors.</p>
            </div>
            <button
              onClick={() => navigate('/kpis')}
              className="text-xs font-semibold text-pms-green hover:text-pms-darkGreen flex items-center space-x-1 mt-4 group"
            >
              <span>Go to My KPIs</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Dashboard;
