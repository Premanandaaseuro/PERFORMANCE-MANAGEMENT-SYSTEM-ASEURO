import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerApi } from '../../api/managerApi';
import { ManagerEmployeeItem } from '../../types';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Eye,
  Edit3,
  Calendar,
  Lock
} from 'lucide-react';

export const ManagerEmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<ManagerEmployeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchAssignedEmployees();
  }, []);

  const fetchAssignedEmployees = async () => {
    try {
      setLoading(true);
      const data = await managerApi.getAssignedEmployees();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load assigned employees', err);
      setError('Unable to load assigned employees.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELF_ASSESSMENT_SUBMITTED':
      case 'MANAGER_REVIEW_PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
            <Clock size={12} />
            <span>Awaiting Your Review</span>
          </span>
        );
      case 'MANAGER_REVIEW_SUBMITTED':
      case 'HR_REVIEW_PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            <CheckCircle2 size={12} />
            <span>Manager Reviewed</span>
          </span>
        );
      case 'HR_REVIEW_COMPLETED':
      case 'FINAL_RESULT_PUBLISHED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            <Lock size={12} />
            <span>Finalized</span>
          </span>
        );
      case 'SELF_ASSESSMENT_DRAFT':
      case 'PMS_STARTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            <Clock size={12} />
            <span>Self Assessment in Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
            <span>PMS Not Started</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Assigned Team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            <Users size={16} />
            <span>Direct Reports • Reporting Manager View</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            View New Employees Assigned
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Evaluate KPIs for employees assigned directly to you in the current PMS appraisal cycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-blue-50 text-blue-900 rounded-2xl border border-blue-100 font-bold text-sm">
            <span>Total Assigned: {employees.length}</span>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
        <Search size={18} className="text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="Search by Employee Name, ID, Email, or Designation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm font-medium">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Employee ID & Name</th>
                <th className="py-4 px-6">Designation & Department</th>
                <th className="py-4 px-6">Cycle</th>
                <th className="py-4 px-6">PMS Status</th>
                <th className="py-4 px-6 text-center">Score</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users size={36} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold">No assigned employees found.</p>
                    <p className="text-xs mt-1">HR assigns employees to you through the HR Employee Management module.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {emp.profilePhoto ? (
                          <img src={emp.profilePhoto} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800">{emp.name}</div>
                          <div className="text-xs font-semibold text-slate-400">{emp.employeeCode} • {emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-700">{emp.designation}</div>
                      <div className="text-xs text-slate-400">{emp.department} • {emp.team}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {emp.cycleMonth || 'August 2026'}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(emp.status)}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-800">
                      {emp.overallScore != null ? (
                        <span className="text-pms-darkGreen">
                          {emp.overallScore.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {emp.canReview ? (
                        <button
                          onClick={() => navigate(`/manager/employees/${emp.id}/review`)}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          <Edit3 size={14} />
                          <span>Review KPI</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/manager/employees/${emp.id}/review`)}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          <Eye size={14} />
                          <span>View PMS</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerEmployeesPage;
