import React, { useEffect, useState, useRef } from 'react';
import { employeeApi } from '../api/employeeApi';
import { Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Calendar,
  Mail,
  ShieldAlert,
  Award,
  Edit3,
  Camera,
  CheckCircle2,
  Phone,
  X,
  Upload,
  Trash2
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    employeeApi.getProfile()
      .then((res) => {
        setProfile(res);
        setEditName(res.name);
        setEditPhone(res.phone || '');
        setEditPhoto(res.profilePhoto || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch profile details.');
        setLoading(false);
      });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setEditPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await employeeApi.updateProfile({
        name: editName,
        phone: editPhone,
        profilePhoto: editPhoto || ''
      });

      setProfile(updated);
      updateUser({
        name: updated.name,
        profilePhoto: updated.profilePhoto
      });

      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-96 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading Profile</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={fetchProfile} className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-pms-gray">My Professional Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your personal profile details and upload your official avatar photo.</p>
        </div>

        <button
          onClick={() => {
            if (profile) {
              setEditName(profile.name);
              setEditPhone(profile.phone || '');
              setEditPhoto(profile.profilePhoto || null);
            }
            setIsEditing(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Edit3 size={15} />
          <span>Edit Profile & Photo</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-pms-lightGreen border-l-4 border-pms-green p-4 rounded-xl flex items-center space-x-3 text-xs text-pms-darkGreen font-bold animate-slideIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold animate-slideIn">
          <ShieldAlert size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Profile Banner */}
        <div className="h-36 bg-gradient-to-r from-slate-800 via-slate-700 to-pms-darkGreen relative">
          <div className="absolute top-0 right-0 w-64 h-full bg-pms-green/20 rounded-l-full filter blur-2xl"></div>
        </div>

        {/* Profile Avatar Card */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 mb-6 gap-4">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-5">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-lg overflow-hidden">
                  {profile?.profilePhoto ? (
                    <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-pms-green/20 text-pms-darkGreen font-extrabold flex items-center justify-center text-4xl shadow-inner">
                      {profile?.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-1 right-1 p-2 bg-pms-green hover:bg-pms-darkGreen text-white rounded-full shadow-md transition-all border-2 border-white"
                  title="Change Profile Photo"
                >
                  <Camera size={14} />
                </button>
              </div>
              
              <div className="text-center sm:text-left pb-1">
                <h3 className="text-2xl font-bold text-pms-gray">{profile?.name}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{profile?.designation}</p>
              </div>
            </div>

            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20 uppercase tracking-wider">
              {profile?.accountStatus}
            </span>

          </div>

          {/* Details list */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-xs">
            
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Employee ID</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <User size={16} className="text-slate-400" />
                <span className="font-bold text-sm">EMP-{profile?.id}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Corporate Email</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Mail size={16} className="text-slate-400" />
                <span className="font-semibold">{profile?.email}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Phone / Mobile</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Phone size={16} className="text-slate-400" />
                <span className="font-semibold">{profile?.phone || 'Not Provided'}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Department</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Award size={16} className="text-slate-400" />
                <span className="font-semibold">{profile?.department}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Functional Team</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Award size={16} className="text-slate-400" />
                <span className="font-semibold">{profile?.team || 'N/A'}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Reporting Manager</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <User size={16} className="text-slate-400" />
                <span className="font-semibold">{profile?.managerName}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Joining Date</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Calendar size={16} className="text-slate-400" />
                <span className="font-semibold">{profile?.joiningDate}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-pms-lightGreen text-pms-darkGreen rounded-xl">
                  <Edit3 size={18} />
                </div>
                <h3 className="text-base font-bold text-pms-gray">Edit Profile Information</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Photo Upload Box */}
              <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-200 flex items-center justify-center">
                  {editPhoto ? (
                    <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 font-bold text-2xl">
                      {editName.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <Upload size={13} />
                    <span>Upload Photo</span>
                  </button>

                  {editPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">PNG, JPG or WEBP (Max 2MB)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Phone / Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Profile;
