import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUpdateProfile } from '../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiUpdateProfile({ full_name: fullName });
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-2xl p-8 shadow-lg animate-fade-in-up"
           style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>

        {/* Avatar and header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {user.full_name}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Profile info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg"
               style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </p>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 text-sm"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              ) : (
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name}
                </p>
              )}
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setFullName(user.full_name); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-indigo-500 text-sm font-medium hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Email
            </p>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
              {user.email}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Account Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user.is_verified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate('/app')}
            className="flex-1 py-3 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors text-sm"
          >
            Go to Analyzer
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-lg border text-sm font-semibold transition-colors hover:bg-red-500/10"
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
