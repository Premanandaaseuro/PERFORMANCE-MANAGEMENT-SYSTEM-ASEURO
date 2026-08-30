import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

export interface RatingDefinition {
  score: number;
  label: string;
  shortDesc: string;
  fullDesc: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
}

export const RATING_DEFINITIONS: RatingDefinition[] = [
  {
    score: 1,
    label: 'Unsatisfactory',
    shortDesc: 'Needs Immediate Improvement',
    fullDesc: 'Performance is well below acceptable standards. Fails to meet basic targets and requires immediate corrective action.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    bgClass: 'bg-rose-50/60 border-rose-100',
    textClass: 'text-rose-700'
  },
  {
    score: 2,
    label: 'Needs Improvement',
    shortDesc: 'Partially Meets Expectations',
    fullDesc: 'Meets some expectations but inconsistent in quality or timeline. Requires ongoing guidance and close supervision.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    bgClass: 'bg-amber-50/60 border-amber-100',
    textClass: 'text-amber-700'
  },
  {
    score: 3,
    label: 'Meets Expectations',
    shortDesc: 'Satisfactory / Good',
    fullDesc: 'Consistently meets required performance targets, quality standards, and deadlines reliably with normal supervision.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    bgClass: 'bg-blue-50/60 border-blue-100',
    textClass: 'text-blue-700'
  },
  {
    score: 4,
    label: 'Exceeds Expectations',
    shortDesc: 'Very Good',
    fullDesc: 'Frequently exceeds assigned targets with high-quality deliverables, proactive initiative, and minimal supervision.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgClass: 'bg-emerald-50/60 border-emerald-100',
    textClass: 'text-emerald-700'
  },
  {
    score: 5,
    label: 'Outstanding',
    shortDesc: 'Exceptional / Role Model',
    fullDesc: 'Consistently delivers extraordinary results, drives innovation, demonstrates exceptional ownership, and acts as a role model.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    bgClass: 'bg-purple-50/60 border-purple-100',
    textClass: 'text-purple-700'
  }
];

interface RatingScaleLegendProps {
  compact?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const RatingScaleLegend: React.FC<RatingScaleLegendProps> = ({
  compact = false,
  collapsible = true,
  defaultExpanded = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (compact) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Info size={14} className="text-emerald-600" />
          <span>Rating Scale Reference (1.0 - 5.0)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {RATING_DEFINITIONS.map((item) => (
            <div key={item.score} className={`p-2 rounded-lg border text-center ${item.bgClass}`}>
              <div className="font-extrabold text-xs text-slate-800 flex items-center justify-center space-x-1">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black shadow-2xs">
                  {item.score}
                </span>
                <span>{item.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{item.shortDesc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <HelpCircle size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">PMS Performance Rating Scale Guide (1 - 5)</h4>
            <p className="text-xs text-slate-500 font-medium">Standard rating definitions used across Employee Self-Assessment, Manager Review & HR Evaluation</p>
          </div>
        </div>

        {collapsible && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span>{expanded ? 'Hide Guide' : 'View Guide'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-3 animate-fadeIn">
          {RATING_DEFINITIONS.map((item) => (
            <div
              key={item.score}
              className={`p-3.5 rounded-xl border ${item.bgClass} flex flex-col justify-between space-y-2`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {item.score}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                    Rating {item.score}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900">{item.label}</h5>
                <span className="text-[10px] font-semibold text-slate-500 block mb-1.5">{item.shortDesc}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{item.fullDesc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
