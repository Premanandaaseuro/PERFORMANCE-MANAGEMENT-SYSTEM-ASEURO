import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Designation, KpiMasterItem } from '../../types';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  HelpCircle,
  Briefcase
} from 'lucide-react';

import { RatingScaleLegend } from '../../components/RatingScaleLegend';

export const HrKpisPage: React.FC = () => {
  const navigate = useNavigate();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [kpis, setKpis] = useState<KpiMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add New Role Modal State
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [addRoleLoading, setAddRoleLoading] = useState(false);
  const [addRoleError, setAddRoleError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentKpiId, setCurrentKpiId] = useState<number | null>(null);
  const [formKpiName, setFormKpiName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWeightage, setFormWeightage] = useState<number>(25);
  const [formSelfRatingScale, setFormSelfRatingScale] = useState('1.0 - 5.0 Rating Scale');
  const [formManagerRatingScale, setFormManagerRatingScale] = useState('1.0 - 5.0 Rating Scale');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hrApi.getDesignations()
      .then((data) => {
        setDesignations(data);
        if (data.length > 0) {
          setSelectedDesignation(data[0].name);
          loadKpis(data[0].name);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load designations.');
        setLoading(false);
      });
  }, []);

  const loadKpis = (desig: string) => {
    setLoading(true);
    setError(null);
    hrApi.getKpiMasterList(desig)
      .then((data) => {
        setKpis(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load KPIs.');
        setLoading(false);
      });
  };

  const handleDesignationChange = (newDesig: string) => {
    setSelectedDesignation(newDesig);
    loadKpis(newDesig);
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
      setSelectedDesignation(created.name);
      loadKpis(created.name);
      setNewRoleName('');
      setNewRoleDescription('');
      setAddRoleModalOpen(false);
      setSuccess(`New role "${created.name}" created and automatically selected. You can now add KPIs for this role.`);
    } catch (err: any) {
      console.error(err);
      setAddRoleError(err.response?.data?.message || err.message || 'Failed to create role.');
    } finally {
      setAddRoleLoading(false);
    }
  };

  const totalWeightage = kpis.reduce((sum, k) => sum + k.weightage, 0);

  const isHrRatingKpiName = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('hr assessment') || lower.includes('hr rating') ||
           lower.includes('leave pattern') || lower.includes('team collaboration') ||
           lower.includes('punctuality') || lower.includes('new initiatives') ||
           lower.includes('rewards');
  };

  const hrRatingWeight = kpis.filter(k => isHrRatingKpiName(k.kpiName)).reduce((sum, k) => sum + k.weightage, 0);
  const customKpisWeight = kpis.filter(k => !isHrRatingKpiName(k.kpiName)).reduce((sum, k) => sum + k.weightage, 0);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentKpiId(null);
    setFormKpiName('');
    setFormDescription('');
    setFormWeightage(25);
    setFormSelfRatingScale('1.0 - 5.0 Rating Scale');
    setFormManagerRatingScale('1.0 - 5.0 Rating Scale');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (kpi: KpiMasterItem) => {
    setModalMode('edit');
    setCurrentKpiId(kpi.id);
    setFormKpiName(kpi.kpiName);
    setFormDescription(kpi.description || '');
    setFormWeightage(kpi.weightage);
    setFormSelfRatingScale(kpi.selfRatingScale || '1.0 - 5.0 Rating Scale');
    setFormManagerRatingScale(kpi.managerRatingScale || '1.0 - 5.0 Rating Scale');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(null);

    if (!formKpiName.trim()) {
      setFormError('KPI Name is required.');
      return;
    }

    if (!formWeightage || formWeightage <= 0) {
      setFormError('Measurement Weightage must be greater than 0%.');
      return;
    }

    // Validate 75% non-HR weightage limit and 100% total limit
    const isHrParam = isHrRatingKpiName(formKpiName);
    const nonHrKpis = kpis.filter(k => !isHrRatingKpiName(k.kpiName) && (modalMode === 'create' || k.id !== currentKpiId));
    const otherNonHrWeight = nonHrKpis.reduce((sum, k) => sum + k.weightage, 0);

    if (!isHrParam && (otherNonHrWeight + formWeightage > 75.0)) {
      setFormError(`Total Non-HR KPI weightage cannot exceed 75%! (Currently allocated non-HR: ${otherNonHrWeight.toFixed(1)}%, Maximum remaining available for Non-HR KPIs: ${(75.0 - otherNonHrWeight).toFixed(1)}%). 25% is reserved for HR Parameters.`);
      return;
    }

    const otherKpisWeight = modalMode === 'edit'
      ? kpis.filter(k => k.id !== currentKpiId).reduce((sum, k) => sum + k.weightage, 0)
      : totalWeightage;

    if (otherKpisWeight + formWeightage > 100.0) {
      setFormError(`Total KPI measurement weightage cannot exceed 100%. (Current allocated: ${otherKpisWeight}%, Remaining available: ${100 - otherKpisWeight}%)`);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await hrApi.createKpi({
          designation: selectedDesignation,
          kpiName: formKpiName.trim(),
          description: formDescription.trim(),
          weightage: formWeightage,
          selfRatingScale: formSelfRatingScale.trim(),
          managerRatingScale: formManagerRatingScale.trim()
        });
        setSuccess(`KPI "${formKpiName}" created successfully.`);
      } else if (currentKpiId) {
        await hrApi.updateKpi(currentKpiId, {
          kpiName: formKpiName.trim(),
          description: formDescription.trim(),
          weightage: formWeightage,
          selfRatingScale: formSelfRatingScale.trim(),
          managerRatingScale: formManagerRatingScale.trim()
        });
        setSuccess(`KPI "${formKpiName}" updated successfully.`);
      }

      setModalOpen(false);
      loadKpis(selectedDesignation);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save KPI.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKpi = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the KPI "${name}"?`)) {
      return;
    }
    try {
      await hrApi.deleteKpi(id);
      setSuccess(`KPI "${name}" deleted successfully.`);
      loadKpis(selectedDesignation);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete KPI.');
    }
  };

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
          <h2 className="text-2xl font-bold text-pms-gray">KPI Master Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure role-based KPIs with KPI Name, Measurement, Self Rating, Manager Rating, and 25% Standardized HR Rating rules.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setNewRoleName('');
              setNewRoleDescription('');
              setAddRoleError(null);
              setAddRoleModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-pms-gray text-xs font-bold rounded-xl border border-slate-200 transition-all"
          >
            <Briefcase size={16} className="text-emerald-600" />
            <span>+ Add New Role</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={16} />
            <span>Create KPI</span>
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

      {/* Rating Scale Reference Guide */}
      <RatingScaleLegend defaultExpanded={false} />

      {/* Designation Selection & Weightage Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Select Role / Designation:
            </label>
            <button
              onClick={() => {
                setNewRoleName('');
                setNewRoleDescription('');
                setAddRoleError(null);
                setAddRoleModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Add New Role</span>
            </button>
          </div>
          <select
            value={selectedDesignation}
            onChange={(e) => handleDesignationChange(e.target.value)}
            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
          >
            {designations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Total Weightage & HR Standard 25% Allocation Bar */}
        <div className="flex-1 md:max-w-md space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500 uppercase tracking-wider">Measurement Budget Allocation:</span>
            <span className={totalWeightage === 100 ? 'text-pms-darkGreen font-extrabold' : totalWeightage > 100 ? 'text-rose-600 font-extrabold' : 'text-amber-600'}>
              {totalWeightage}% / 100%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 flex">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 relative group"
              style={{ width: `${Math.min(customKpisWeight, 75)}%` }}
              title={`Custom KPIs: ${customKpisWeight}%`}
            />
            <div
              className="bg-purple-600 h-full transition-all duration-300 relative group"
              style={{ width: `${Math.min(hrRatingWeight, 25)}%` }}
              title={`Standardized HR Rating: ${hrRatingWeight}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-0.5">
            <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              <span>Custom KPIs: {customKpisWeight}% (Max 75%)</span>
            </span>
            <span className="flex items-center space-x-1 text-purple-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
              <span>Standardized HR Rating: {hrRatingWeight}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Mapped KPI Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target size={18} className="text-pms-green" />
            <h3 className="text-sm font-bold text-pms-gray">
              KPI Master List for <span className="text-pms-darkGreen">"{selectedDesignation}"</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {kpis.length} Active KPI{kpis.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading KPIs...</div>
        ) : kpis.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No KPIs configured for this designation. Click "Create KPI" above to add custom KPIs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">#</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">KPI</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Measurement Criteria</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Self Rating</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Manager Rating</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Weightage</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {kpis.map((kpi, idx) => {
                  const isHrStandard = isHrRatingKpiName(kpi.kpiName);
                  return (
                    <tr key={kpi.id} className={`hover:bg-slate-50/50 transition-colors ${isHrStandard ? 'bg-purple-50/20' : ''}`}>
                      <td className="px-5 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-4 text-xs font-bold text-pms-gray">
                        <div className="flex flex-col space-y-1">
                          <span>{kpi.kpiName}</span>
                          {isHrStandard && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 w-fit">
                              Standardized 25% HR Rating (Editable)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 max-w-xs">{kpi.description}</td>
                      <td className="px-5 py-4 text-xs text-center text-slate-600 font-semibold">
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {kpi.selfRatingScale || '1.0 - 5.0 Rating Scale'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-center text-slate-600 font-semibold">
                        <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                          {kpi.managerRatingScale || '1.0 - 5.0 Rating Scale'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-extrabold text-pms-darkGreen text-center">
                        <span className={`px-2.5 py-1 rounded-full border ${isHrStandard ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-pms-lightGreen text-pms-darkGreen border-pms-green/20'}`}>
                          {kpi.weightage}%
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => openEditModal(kpi)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center space-x-1"
                          title="Edit KPI"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteKpi(kpi.id, kpi.kpiName)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center"
                          title="Delete KPI"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit KPI Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-pms-gray">
                  {modalMode === 'create' ? `Create KPI for "${selectedDesignation}"` : `Edit KPI: ${formKpiName}`}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Set fields for KPI, Measurement, Self Rating, Manager Rating, and Weightage
                </p>
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

            <form onSubmit={handleSaveKpi} className="space-y-4">
              {/* Field 1: KPI Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. KPI Name *
                </label>
                <input
                  type="text"
                  required
                  value={formKpiName}
                  onChange={(e) => setFormKpiName(e.target.value)}
                  placeholder="e.g. Sprint Feature Delivery & Quality"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              {/* Field 2: Measurement Criteria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Measurement Criteria / Deliverables *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe measurable targets, deliverables, quality standards, and evaluation criteria..."
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              {/* Field 3: Measurement Weightage (%) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Measurement Weightage Percentage (1% - 75% for Non-HR KPIs) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max="100"
                    required
                    value={formWeightage}
                    onChange={(e) => setFormWeightage(Number(e.target.value))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-black text-slate-400">
                    %
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  💡 <strong>Flexible Weightage:</strong> Enter any exact integer or decimal percentage (e.g. 75.6%, 12.5%, 10%). Any KPI can be added, edited, or deleted freely (Total $\le$ 100%).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving KPI...' : 'Save KPI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <p className="text-xs text-slate-500 font-medium">Create a new role to assign employee accounts and map KPIs</p>
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
                  placeholder="e.g. DevOps Specialist, Data Engineer"
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
    </div>
  );
};
export default HrKpisPage;
