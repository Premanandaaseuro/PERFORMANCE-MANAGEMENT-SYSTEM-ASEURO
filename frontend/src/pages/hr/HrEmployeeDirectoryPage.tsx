import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { EmployeeRecord } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  Building,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export const HrEmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchEmployees = () => {
    setLoading(true);
    hrApi.getEmployees()
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = employees.filter((e) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (e.name || e.fullName || '').toLowerCase().includes(q);
    const emailMatch = (e.email || '').toLowerCase().includes(q);
    const codeMatch = (e.employeeCode || '').toLowerCase().includes(q);
    const desigMatch = (e.designation || e.designationName || '').toLowerCase().includes(q);
    const roleMatch = roleFilter === 'ALL' || (e.role && e.role.toUpperCase().includes(roleFilter));

    return (nameMatch || emailMatch || codeMatch || desigMatch) && roleMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-pms-gray mb-1"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-2xl font-bold text-pms-gray">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered corporate staff authenticated against PostgreSQL.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/hr/employees/add')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search employees by name, email, ID code, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50"
          >
            <option value="ALL">All Roles</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="MANAGER">Managers</option>
            <option value="HR">HR Admins</option>
          </select>
          <button
            onClick={fetchEmployees}
            title="Refresh List"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading employee directory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No employees found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Code / ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Employee Details</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Role</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Designation</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Department</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Reporting Manager</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-extrabold text-pms-gray">
                      {emp.employeeCode || `EMP-${emp.id}`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {emp.profilePhoto ? (
                          <img src={emp.profilePhoto} alt={emp.name || emp.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-pms-green/20 text-pms-darkGreen font-bold text-xs flex items-center justify-center shrink-0">
                            {(emp.name || emp.fullName || 'U').charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-pms-gray">{emp.name || emp.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (emp.role || '').toUpperCase().includes('HR')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : (emp.role || '').toUpperCase().includes('MANAGER')
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {(emp.role || 'EMPLOYEE').replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                      {emp.designation || emp.designationName || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {emp.department || emp.departmentName || 'Engineering'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                      {emp.managerName || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20">
                        {emp.accountStatus || emp.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default HrEmployeeDirectoryPage;
