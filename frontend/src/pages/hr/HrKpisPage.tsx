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
  HelpCircle
} from 'lucide-react';

export const HrKpisPage: React.FC = () => {
  const navigate = useNavigate();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [kpis, setKpis] = useState<KpiMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentKpiId, setCurrentKpiId] = useState<number | null>(null);
  const [formKpiName, setFormKpiName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWeightage, setFormWeightage] = useState<number>(20);
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

  const totalWeightage = kpis.reduce((sum, k) => sum + k.weightage, 0);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentKpiId(null);
    setFormKpiName('');
    setFormDescription('');
    setFormWeightage(20);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (kpi: KpiMasterItem) => {
    setModalMode('edit');
    setCurrentKpiId(kpi.id);
    setFormKpiName(kpi.kpiName);
    setFormDescription(kpi.description || '');
    setFormWeightage(kpi.weightage);
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
      setFormError('Weightage must be greater than 0%.');
      return;
    }

    // Validate 100% limit on frontend
    const otherKpisWeight = modalMode === 'edit'
      ? kpis.filter(k => k.id !== currentKpiId).reduce((sum, k) => sum + k.weightage, 0)
      : totalWeightage;

    if (otherKpisWeight + formWeightage > 100.0) {
      setFormError(`Total KPI weightage cannot exceed 100%. (Current remaining: ${100 - otherKpisWeight}%, Attempted: ${formWeightage}%)`);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await hrApi.createKpi({
          designation: selectedDesignation,
          kpiName: formKpiName.trim(),
          description: formDescription.trim(),
          weightage: formWeightage
        });
        setSuccess(`KPI "${formKpiName}" created successfully.`);
      } else if (currentKpiId) {
        await hrApi.updateKpi(currentKpiId, {
          kpiName: formKpiName.trim(),
          description: formDescription.trim(),
          weightage: formWeightage
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
            Configure role-based KPI definitions and enforce 100% total weightage limits.
          </p>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={16} />
            <span>Add New KPI</span>
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

      {/* Designation Selection & Weightage Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Select Role / Designation:
          </label>
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

        {/* Total Weightage Bar */}
        <div className="flex-1 md:max-w-xs">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Weightage:</span>
            <span className={`text-xs font-bold ${totalWeightage === 100 ? 'text-pms-darkGreen' : totalWeightage > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
              {totalWeightage}% / 100%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalWeightage === 100 ? 'bg-pms-green' : totalWeightage > 100 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(totalWeightage, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            {totalWeightage === 100
              ? '✓ Target 100% weightage reached'
              : totalWeightage > 100
              ? '⚠ Total exceeds 100%! Please adjust KPI weightages'
              : `Pending ${100 - totalWeightage}% weightage allocation`}
          </p>
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
            No KPIs configured for this designation. Click "+ Add New KPI" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">#</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">KPI Name</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Measurement Criteria</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Self Scale</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Mgr Scale</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Weightage</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {kpis.map((kpi, idx) => (
                  <tr key={kpi.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-4 text-xs font-bold text-pms-gray">{kpi.kpiName}</td>
                    <td className="px-5 py-4 text-xs text-slate-500 max-w-md">{kpi.description}</td>
                    <td className="px-5 py-4 text-xs text-center text-slate-500 font-medium">1.0 - 5.0</td>
                    <td className="px-5 py-4 text-xs text-center text-slate-500 font-medium">1.0 - 5.0</td>
                    <td className="px-5 py-4 text-xs font-extrabold text-pms-darkGreen text-center">
                      <span className="px-2.5 py-1 rounded-full bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20">
                        {kpi.weightage}%
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(kpi)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit KPI"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteKpi(kpi.id, kpi.kpiName)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete KPI"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit KPI Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-pms-gray">
                {modalMode === 'create' ? `Add KPI for ${selectedDesignation}` : `Edit KPI: ${formKpiName}`}
              </h3>
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
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  KPI Name *
                </label>
                <input
                  type="text"
                  required
                  value={formKpiName}
                  onChange={(e) => setFormKpiName(e.target.value)}
                  placeholder="e.g. Code Quality & Test Coverage"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Measurement Criteria / Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe measurable targets, deliverables, and expectations..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Weightage Percentage (1% - 100%) *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    step="5"
                    min="1"
                    max="100"
                    required
                    value={formWeightage}
                    onChange={(e) => setFormWeightage(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    %
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total weightage for {selectedDesignation} cannot exceed 100%.
                </p>
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
                  className="px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save KPI'}</span>
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
