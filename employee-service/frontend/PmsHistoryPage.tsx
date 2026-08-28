import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmsApi } from '../api/pmsApi';
import { PmsHistory } from '../types';
import { Search, Calendar, ChevronRight, Eye, AlertCircle } from 'lucide-react';

export const PmsHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<PmsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');

  useEffect(() => {
    pmsApi.getHistory()
      .then((res) => {
        setHistory(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load appraisal history. Please check back later.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-96 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading History</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm shadow transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Get available years for filtering
  const years = ['All', ...Array.from(new Set(history.map(h => {
    const parts = h.cycleMonth.split(' ');
    return parts[parts.length - 1]; // e.g. "2026"
  })))];

  // Filtering logic
  const filteredHistory = history.filter((h) => {
    const matchesSearch = h.cycleMonth.toLowerCase().includes(search.toLowerCase());
    const parts = h.cycleMonth.split(' ');
    const year = parts[parts.length - 1];
    const matchesYear = selectedYear === 'All' || year === selectedYear;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-pms-gray">Appraisal History Log</h2>
        <p className="text-xs text-slate-500 mt-1">Review finalized performance scores, manager remarks, and reports from past cycles.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-pms-green focus:border-pms-green"
            placeholder="Search cycle month..."
          />
        </div>

        {/* Year Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto self-start sm:self-auto">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block w-full sm:w-32 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-pms-green focus:border-pms-green"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Calendar size={24} />
          </div>
          <h3 className="text-sm font-bold text-pms-gray mb-1">No past PMS records</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Your finalized performance appraisals will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Appraisal Cycle</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Finalized Date</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Final Score</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Rating</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Cycle Month */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-pms-lightGreen flex items-center justify-center text-pms-darkGreen">
                        <Calendar size={18} />
                      </div>
                      <span className="font-bold text-pms-gray text-xs">{item.cycleMonth}</span>
                    </div>
                  </td>

                  {/* Finalized Date */}
                  <td className="px-6 py-4.5 text-center whitespace-nowrap text-xs text-slate-500">
                    {item.finalizedDate}
                  </td>

                  {/* Final Score */}
                  <td className="px-6 py-4.5 text-center whitespace-nowrap">
                    <span className="text-xs font-bold text-pms-gray bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                      {item.finalScore.toFixed(2)} / 5.00
                    </span>
                  </td>

                  {/* Grade */}
                  <td className="px-6 py-4.5 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 bg-pms-lightGreen border border-pms-green/20 text-pms-darkGreen text-[10px] font-bold rounded-full uppercase">
                      {item.grade}
                    </span>
                  </td>

                  {/* View Action */}
                  <td className="px-6 py-4.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/history/${item.assignmentId || item.id}`)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-350 hover:bg-slate-100 hover:text-pms-darkGreen text-slate-650 font-bold text-xs rounded-lg transition-colors bg-white"
                    >
                      <Eye size={14} />
                      <span>View details</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default PmsHistoryPage;
