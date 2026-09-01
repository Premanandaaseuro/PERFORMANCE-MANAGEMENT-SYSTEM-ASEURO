import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { EmployeeRecord, ManagerOption } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  RefreshCw,
  Edit3,
  CheckCircle2,
  X,
  ShieldCheck,
  UserCheck,
  Trash2
} from 'lucide-react';

export const HrEmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Edit Modal State
  const [editingEmp, setEditingEmp] = useState<EmployeeRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('EMPLOYEE');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editManagerId, setEditManagerId] = useState<number | ''>('');
  const [editAccountStatus, setEditAccountStatus] = useState('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEmployeesAndManagers = () => {
    setLoading(true);
    Promise.all([hrApi.getEmployees(), hrApi.getManagers()])
      .then(([empData, mgrData]) => {
        setEmployees(empData);
        setManagers(mgrData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployeesAndManagers();
  }, []);

  const openEditModal = (emp: EmployeeRecord) => {
    setEditingEmp(emp);
    setEditName(emp.name || emp.fullName || '');
    setEditRole((emp.role || 'EMPLOYEE').replace('ROLE_', ''));
    setEditDesignation(emp.designation || emp.designationName || 'Software Engineer');
    setEditDepartment(emp.department || emp.departmentName || 'Engineering');
    setEditTeam(emp.team || 'Core Platform');
    setEditManagerId(emp.managerId ?? '');
    setEditAccountStatus(emp.accountStatus || emp.status || 'ACTIVE');
  };

  const closeEditModal = () => {
    setEditingEmp(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    setSaving(true);
    try {
      await hrApi.updateEmployee(editingEmp.id, {
        name: editName,
        role: editRole,
        designation: editDesignation,
        department: editDepartment,
        team: editTeam,
        managerId: editManagerId !== '' ? Number(editManagerId) : null,
        accountStatus: editAccountStatus
      });

      setToastMessage(`Updated ${editName} successfully!`);
      setTimeout(() => setToastMessage(null), 3000);
      closeEditModal();
      fetchEmployeesAndManagers();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update employee details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete employee "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await hrApi.deleteEmployee(id);
      setToastMessage(`Employee "${name}" deleted successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
      closeEditModal();
      fetchEmployeesAndManagers();
    } catch (err: any) {
      console.error('Failed to delete employee:', err);
      alert(err.response?.data?.message || 'Failed to delete employee. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

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
            Registered corporate staff authenticated against PostgreSQL. Edit roles, promote employees, or update designations.
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

      {toastMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-emerald-800 font-semibold shadow-sm animate-fadeIn">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            onClick={fetchEmployeesAndManagers}
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
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
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
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-pms-green hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        title="Edit Designation or Role"
                      >
                        <Edit3 size={13} />
                        <span>Edit / Promote</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name || emp.fullName || '')}
                        disabled={deleting}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        title="Delete Employee"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Promote Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-pms-lightGreen text-pms-darkGreen flex items-center justify-center font-bold">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-pms-gray">Edit / Promote Staff</h3>
                  <p className="text-xs text-slate-500">Update role, designation, department or manager for EMP-{editingEmp.id}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Employee Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Employee Full Name:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                />
              </div>

              {/* Role Selection (Emp -> Manager Promotion) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Corporate System Role (Promote):
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Individual Contributor)</option>
                  <option value="MANAGER">MANAGER (Team Reporting Manager)</option>
                  <option value="HR">HR (HR Administrator)</option>
                </select>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Promoting an employee to <strong>MANAGER</strong> allows them to review direct reports.
                </span>
              </div>

              {/* Designation Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Job Designation:
                </label>
                <select
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Senior Software Engineer">Senior Software Engineer</option>
                  <option value="Tech Lead">Tech Lead</option>
                  <option value="Engineering Manager">Engineering Manager</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="Senior QA Engineer">Senior QA Engineer</option>
                  <option value="DevOps Lead">DevOps Lead</option>
                  <option value="HR Specialist">HR Specialist</option>
                </select>
              </div>

              {/* Department & Team */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Department:
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Team:
                  </label>
                  <input
                    type="text"
                    value={editTeam}
                    onChange={(e) => setEditTeam(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                  />
                </div>
              </div>

              {/* Reporting Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Reporting Manager:
                </label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                >
                  <option value="">-- No Manager (Independent) --</option>
                  {managers
                    .filter((m) => m.id !== editingEmp.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.employeeCode}) - {m.designationName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Account Status:
                </label>
                <select
                  value={editAccountStatus}
                  onChange={(e) => setEditAccountStatus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteEmployee(editingEmp.id, editingEmp.name || editingEmp.fullName || '')}
                  disabled={deleting}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200 hover:border-rose-600 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>{deleting ? 'Deleting...' : 'Delete Employee'}</span>
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Update Staff'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrEmployeeDirectoryPage;
