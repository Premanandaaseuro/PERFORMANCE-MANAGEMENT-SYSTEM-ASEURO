import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { ManagerOption } from '../../types';
import {
  UserCheck,
  Plus,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3
} from 'lucide-react';

export const HrManagersPage: React.FC = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add Manager Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [managerCode, setManagerCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [designation, setDesignation] = useState('Engineering Manager');
  const [department, setDepartment] = useState('Engineering');
  const [reportingManagerId, setReportingManagerId] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit Manager Modal State
  const [editingMgr, setEditingMgr] = useState<ManagerOption | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('Engineering');
  const [editReportingManagerId, setEditReportingManagerId] = useState<number | ''>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchManagers = () => {
    setLoading(true);
    hrApi.getManagers()
      .then((data) => {
        setManagers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load managers.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    setSaving(true);
    try {
      await hrApi.createManager({
        name: name.trim(),
        managerCode: managerCode.trim() || undefined,
        email: email.trim().toLowerCase(),
        password,
        designation: designation.trim(),
        department: department.trim(),
        managerId: reportingManagerId !== '' ? Number(reportingManagerId) : null
      });

      setSuccess(`Manager "${name}" (${email}) created successfully! Now available in reporting manager assignments.`);
      setModalOpen(false);
      setName('');
      setManagerCode('');
      setEmail('');
      setPassword('Password@123');
      setReportingManagerId('');
      fetchManagers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || err?.message || 'Failed to create manager.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (mgr: ManagerOption) => {
    setEditingMgr(mgr);
    setEditName(mgr.fullName || '');
    setEditDesignation(mgr.designationName || 'Engineering Manager');
    setEditDepartment('Engineering');
    setEditReportingManagerId(mgr.managerId ?? '');
    setEditError(null);
  };

  const handleSaveEditManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMgr) return;

    setEditSaving(true);
    setEditError(null);
    try {
      await hrApi.updateEmployee(editingMgr.id, {
        name: editName.trim(),
        designation: editDesignation.trim(),
        department: editDepartment.trim(),
        managerId: editReportingManagerId !== '' ? Number(editReportingManagerId) : null
      });

      setSuccess(`Updated Manager "${editName}" successfully!`);
      setEditingMgr(null);
      fetchManagers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setEditError(err?.response?.data?.message || err?.message || 'Failed to update manager details.');
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = managers.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.employeeCode || '').toLowerCase().includes(q) ||
      (m.designationName || '').toLowerCase().includes(q) ||
      (m.managerName || '').toLowerCase().includes(q)
    );
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
          <h2 className="text-2xl font-bold text-pms-gray">Reporting Managers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Team leaders and reviewers authorized to conduct performance reviews.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={16} />
            <span>Add New Manager</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-pms-lightGreen border-l-4 border-pms-green p-4 rounded-xl flex items-center space-x-3 text-xs text-pms-darkGreen font-bold animate-slideIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold animate-slideIn">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search managers by name, email, manager code, reporting manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
          />
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading managers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No managers available. Click "+ Add New Manager" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Manager ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Manager Name</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Work Email</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Designation</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Reporting Manager</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-extrabold text-pms-gray">
                      {mgr.employeeCode || `MGR-${mgr.id}`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {mgr.fullName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-pms-gray">{mgr.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                      {mgr.email}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                      {mgr.designationName || 'Engineering Manager'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 font-semibold">
                      {mgr.managerName ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          <span>👔</span>
                          <span>{mgr.managerName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal">-- Independent --</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openEditModal(mgr)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        title="Edit Manager & Reporting Manager"
                      >
                        <Edit3 size={13} />
                        <span>Edit Manager</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Manager Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserCheck size={20} className="text-purple-600" />
                <h3 className="text-base font-bold text-pms-gray">Add Reporting Manager</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg text-xs text-rose-800 font-semibold flex items-start space-x-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManager} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Manager Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Manager ID / Code
                </label>
                <input
                  type="text"
                  value={managerCode}
                  onChange={(e) => setManagerCode(e.target.value)}
                  placeholder="e.g. MGR-103 (Auto-generated if empty)"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Corporate Email (Login Username) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alice.smith@aseuro.com"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Initial Password *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password@123"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              {/* Reporting Manager Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Reporting Manager (Senior Manager / Director)
                </label>
                <select
                  value={reportingManagerId}
                  onChange={(e) => setReportingManagerId(e.target.value ? Number(e.target.value) : '')}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                >
                  <option value="">-- No Reporting Manager (Independent) --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.employeeCode}) - {m.designationName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Engineering Manager"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Save Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Manager Modal */}
      {editingMgr && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit3 size={20} className="text-purple-600" />
                <h3 className="text-base font-bold text-pms-gray">Edit Manager Details</h3>
              </div>
              <button
                onClick={() => setEditingMgr(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg text-xs text-rose-800 font-semibold flex items-start space-x-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditManager} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Manager Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Work Email (Read Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingMgr.email}
                  className="block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono"
                />
              </div>

              {/* Reporting Manager Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Reporting Manager (Senior Manager / Director)
                </label>
                <select
                  value={editReportingManagerId}
                  onChange={(e) => setEditReportingManagerId(e.target.value ? Number(e.target.value) : '')}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                >
                  <option value="">-- No Reporting Manager (Independent) --</option>
                  {managers
                    .filter((m) => m.id !== editingMgr.id) // Exclude self to avoid circular reference
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.employeeCode}) - {m.designationName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMgr(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {editSaving ? 'Updating...' : 'Update Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrManagersPage;
