import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Designation, ManagerOption, KpiMasterItem } from '../../types';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Target,
  ShieldCheck,
  Building,
  Calendar,
  Lock,
  Mail,
  User,
  Hash,
  Users,
  Plus,
  X,
  Briefcase
} from 'lucide-react';

export const HrAddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [mappedKpis, setMappedKpis] = useState<KpiMasterItem[]>([]);
  const [kpisLoading, setKpisLoading] = useState(false);

  // Add New Role Modal State
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [addRoleLoading, setAddRoleLoading] = useState(false);
  const [addRoleError, setAddRoleError] = useState<string | null>(null);

  // Add New Department Modal State
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');
  const [addDeptLoading, setAddDeptLoading] = useState(false);
  const [addDeptError, setAddDeptError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [designation, setDesignation] = useState('');
  const [managerId, setManagerId] = useState<number | ''>('');
  const [department, setDepartment] = useState('Engineering');
  const [team, setTeam] = useState('Core Platform');
  const [joiningDate, setJoiningDate] = useState('2026-08-27');
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'HR'>('EMPLOYEE');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load designations, managers, and departments from database
    Promise.all([hrApi.getDesignations(), hrApi.getManagers(), hrApi.getDepartments()])
      .then(([desigs, mgrs, depts]) => {
        setDesignations(desigs);
        setManagers(mgrs);
        setDepartments(depts);
        if (desigs.length > 0) {
          const initialDesig = desigs[0].name;
          setDesignation(initialDesig);
          fetchKpisForDesignation(initialDesig);
        }
        if (depts.length > 0) {
          setDepartment(depts[0].name);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load designations, managers, or departments from database.');
      });
  }, []);

  const fetchKpisForDesignation = (desigName: string) => {
    if (!desigName) return;
    setKpisLoading(true);
    hrApi.getKpiMasterList(desigName)
      .then((kpis) => {
        setMappedKpis(kpis);
        setKpisLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setKpisLoading(false);
      });
  };

  const handleDesignationChange = (newDesig: string) => {
    setDesignation(newDesig);
    fetchKpisForDesignation(newDesig);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setAddRoleError('Role name is required.');
      return;
    }
    setAddRoleLoading(true);
    setAddRoleError(null);
    try {
      const created = await hrApi.createDesignation(newRoleName.trim(), newRoleDescription.trim());
      const updatedDesigs = await hrApi.getDesignations();
      setDesignations(updatedDesigs);
      setDesignation(created.name);
      fetchKpisForDesignation(created.name);
      setNewRoleName('');
      setNewRoleDescription('');
      setAddRoleModalOpen(false);
      setSuccess(`New role "${created.name}" created and automatically selected.`);
    } catch (err: any) {
      console.error(err);
      setAddRoleError(err.response?.data?.message || err.message || 'Failed to create role.');
    } finally {
      setAddRoleLoading(false);
    }
  };

  const handleCreateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      setAddDeptError('Department name is required.');
      return;
    }
    setAddDeptLoading(true);
    setAddDeptError(null);
    try {
      const created = await hrApi.createDepartment(newDeptName.trim(), newDeptDescription.trim());
      const updatedDepts = await hrApi.getDepartments();
      setDepartments(updatedDepts);
      setDepartment(created.name);
      setNewDeptName('');
      setNewDeptDescription('');
      setAddDeptModalOpen(false);
      setSuccess(`New department "${created.name}" created and automatically selected.`);
    } catch (err: any) {
      console.error(err);
      setAddDeptError(err.response?.data?.message || err.message || 'Failed to create department.');
    } finally {
      setAddDeptLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !employeeCode.trim() || !email.trim() || !password.trim() || !designation) {
      setError('Please fill in all mandatory fields, including Employee ID / Code as per official HR records.');
      return;
    }

    const isMinLength = password.length >= 8;
    const hasAlphabet = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    if (!isMinLength || !hasAlphabet || !hasNumber || !hasSpecialChar) {
      setError('Password must meet all security criteria: minimum 8 characters, alphabets, numbers, and special characters.');
      return;
    }

    if (role === 'EMPLOYEE' && !managerId) {
      setError('Please select a reporting manager for the employee.');
      return;
    }

    setSubmitting(true);
    try {
      const formattedCode = employeeCode.trim().toUpperCase();
      const res = await hrApi.createEmployee({
        name: name.trim(),
        employeeCode: formattedCode,
        email: email.trim().toLowerCase(),
        password,
        designation,
        department,
        team,
        managerId: managerId ? Number(managerId) : null,
        joiningDate,
        role
      });

      const roleLabel = role === 'MANAGER' ? 'Reporting Manager' : role === 'HR' ? 'HR Administrator' : 'Employee';
      setSuccess(`${roleLabel} "${name}" [${formattedCode}] (${email}) created successfully! ${res.assignedKpisCount} KPIs automatically assigned.`);
      
      // Refresh managers list so newly created manager appears in dropdowns immediately
      hrApi.getManagers().then(setManagers).catch(console.error);

      // Clear form fields
      setName('');
      setEmployeeCode('');
      setEmail('');
      setPassword('Password@123');
      setManagerId('');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create employee. Please verify inputs.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalWeightage = mappedKpis.reduce((sum, k) => sum + k.weightage, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/hr/dashboard')}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-pms-gray transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <button
          onClick={() => navigate('/hr/employees')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-pms-gray text-xs font-bold rounded-lg border border-slate-200 transition-colors"
        >
          <Users size={14} />
          <span>View Employee Directory</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 md:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-pms-lightGreen text-pms-darkGreen rounded-xl border border-pms-green/20">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-pms-gray">Add New Employee</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create an employee account and automatically map role-based KPIs from the database.
            </p>
          </div>
        </div>

        {success && (
          <div className="bg-pms-lightGreen border-l-4 border-pms-green p-4 rounded-xl flex items-start space-x-3 text-xs text-pms-darkGreen font-bold mb-6 animate-slideIn">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start space-x-3 text-xs text-rose-800 font-semibold mb-6 animate-slideIn">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Basic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Employee Full Name *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>
            </div>

            {/* Employee ID / Code (Mandatory as per HR records) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Employee ID / Code *</span>
                <span className="text-[10px] text-emerald-700 font-semibold lowercase">Official HR Record</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EMP-105 or DSU-042 (Mandatory HR Code)"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green uppercase"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Enter the exact identifier from your company HR records.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Work Email (Login Username) *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya.nair@aseuro.com"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Initial Security Password *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password@123"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>
            </div>

            {/* Corporate System Role Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Corporate System Role *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={16} />
                </div>
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as 'EMPLOYEE' | 'MANAGER' | 'HR';
                    setRole(newRole);
                    if (newRole === 'MANAGER' && designation.toLowerCase().includes('engineer') && !designation.toLowerCase().includes('manager')) {
                      const mgrDesig = designations.find(d => d.name.toLowerCase().includes('manager'));
                      if (mgrDesig) {
                        handleDesignationChange(mgrDesig.name);
                      }
                    } else if (newRole === 'HR' && !designation.toLowerCase().includes('hr')) {
                      const hrDesig = designations.find(d => d.name.toLowerCase().includes('hr'));
                      if (hrDesig) {
                        handleDesignationChange(hrDesig.name);
                      }
                    }
                  }}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray font-medium focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Individual Contributor)</option>
                  <option value="MANAGER">MANAGER (Team Reporting Manager)</option>
                  <option value="HR">HR (HR Administrator)</option>
                </select>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                {role === 'MANAGER'
                  ? 'Managers can review direct reports and will be available as reporting managers.'
                  : role === 'HR'
                  ? 'HR administrators have full administrative access across the PMS platform.'
                  : 'Individual contributor participating in appraisal review cycles.'}
              </span>
            </div>

            {/* Reporting Manager Dropdown (DB Driven) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Reporting Manager {role === 'EMPLOYEE' ? '*' : '(Optional)'}
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : '')}
                required={role === 'EMPLOYEE'}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray font-medium focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              >
                <option value="">{role === 'EMPLOYEE' ? '-- Select Reporting Manager --' : '-- No Manager (Independent / Self) --'}</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.employeeCode}) - {m.designationName}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation Dropdown (DB Driven) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Designation / Role *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewRoleName('');
                    setNewRoleDescription('');
                    setAddRoleError(null);
                    setAddRoleModalOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1"
                >
                  <Plus size={14} />
                  <span>+ Add New Role</span>
                </button>
              </div>
              <select
                value={designation}
                onChange={(e) => handleDesignationChange(e.target.value)}
                required
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray font-medium focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              >
                {designations.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Dropdown (DB Driven) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewDeptName('');
                    setNewDeptDescription('');
                    setAddDeptError(null);
                    setAddDeptModalOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1"
                >
                  <Plus size={14} />
                  <span>+ Add New Department</span>
                </button>
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray font-medium focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              />
            </div>
          </div>

          {/* Designation -> KPI Mapping Live Review Box */}
          <div className="mt-8 pt-6 border-t border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target size={18} className="text-pms-green" />
                <h3 className="text-sm font-bold text-pms-gray">
                  Automatically Mapped KPIs for <span className="text-pms-darkGreen">"{designation}"</span>
                </h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                totalWeightage === 100
                  ? 'bg-pms-lightGreen text-pms-darkGreen border-pms-green/30'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                Total Weightage: {totalWeightage}% / 100%
              </span>
            </div>

            {kpisLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Loading mapped KPIs for selected designation...
              </div>
            ) : mappedKpis.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No KPIs mapped to this designation yet. You can configure KPIs in the <button type="button" onClick={() => navigate('/hr/kpis')} className="text-pms-green font-bold underline">Add/Edit KPIs</button> section.
              </div>
            ) : (
              <div className="border border-slate-200/70 rounded-xl overflow-hidden shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">KPI Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Measurement Criteria</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Weightage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {mappedKpis.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-xs font-bold text-pms-gray">{kpi.kpiName}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{kpi.description}</td>
                        <td className="px-4 py-3 text-xs font-bold text-pms-darkGreen text-right">{kpi.weightage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/hr/employees')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              <UserPlus size={16} />
              <span>{submitting ? 'Creating Account...' : 'Save Employee & Assign KPIs'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add New Role / Designation Modal */}
      {addRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-scaleUp">
            <button
              onClick={() => setAddRoleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Briefcase size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Role / Designation</h3>
                <p className="text-xs text-slate-500 font-medium">Create a custom role for KPI mapping and employee assignment</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
              {addRoleError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center space-x-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{addRoleError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role / Designation Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. DevOps Specialist, AI Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Responsibilities & profile summary for this role..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddRoleModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addRoleLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Plus size={16} />
                  <span>{addRoleLoading ? 'Saving Role...' : 'Save & Select Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add New Department Modal */}
      {addDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scaleUp">
            <button
              onClick={() => setAddDeptModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Department</h3>
                <p className="text-xs text-slate-500 font-medium">Create a company department for employee assignment</p>
              </div>
            </div>

            <form onSubmit={handleCreateDeptSubmit} className="space-y-4">
              {addDeptError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center space-x-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{addDeptError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Data & Analytics, Customer Success"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDeptDescription}
                  onChange={(e) => setNewDeptDescription(e.target.value)}
                  placeholder="Department function & objectives..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDeptModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeptLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Plus size={16} />
                  <span>{addDeptLoading ? 'Saving...' : 'Save & Select'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrAddEmployeePage;
