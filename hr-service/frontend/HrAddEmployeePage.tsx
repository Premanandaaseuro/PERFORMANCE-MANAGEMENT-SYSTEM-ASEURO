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
  Users
} from 'lucide-react';

export const HrAddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [mappedKpis, setMappedKpis] = useState<KpiMasterItem[]>([]);
  const [kpisLoading, setKpisLoading] = useState(false);

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
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load designations and managers from database
    Promise.all([hrApi.getDesignations(), hrApi.getManagers()])
      .then(([desigs, mgrs]) => {
        setDesignations(desigs);
        setManagers(mgrs);
        if (desigs.length > 0) {
          const initialDesig = desigs[0].name;
          setDesignation(initialDesig);
          fetchKpisForDesignation(initialDesig);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load designations and managers from database.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password.trim() || !designation) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (role === 'EMPLOYEE' && !managerId) {
      setError('Please select a reporting manager for the employee.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await hrApi.createEmployee({
        name: name.trim(),
        employeeCode: employeeCode.trim() || undefined,
        email: email.trim().toLowerCase(),
        password,
        designation,
        department,
        team,
        managerId: managerId ? Number(managerId) : null,
        joiningDate,
        role
      });

      setSuccess(`Employee ${name} (${email}) created successfully! ${res.assignedKpisCount} KPIs automatically assigned to active PMS cycle.`);
      
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

            {/* Employee ID / Code */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Employee ID / Code
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash size={16} />
                </div>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-105 (Auto-generated if empty)"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>
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

            {/* Designation Dropdown (DB Driven) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Designation / Role *
              </label>
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

            {/* Reporting Manager Dropdown (DB Driven) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Reporting Manager *
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : '')}
                required={role === 'EMPLOYEE'}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray font-medium focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              >
                <option value="">-- Select Reporting Manager --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.employeeCode}) - {m.designationName}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              />
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
    </div>
  );
};
export default HrAddEmployeePage;
