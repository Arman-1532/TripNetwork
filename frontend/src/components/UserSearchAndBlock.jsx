import { useState } from 'react';
import { Search, Lock, LockOpen, AlertCircle, CheckCircle, X } from 'lucide-react';
import { api } from '../services/api';

/**
 * Reusable UserSearchAndBlock Component
 * Allows admins to search for users by email and block/unblock them
 *
 * Props:
 *   - onUserBlocked: callback function when user is blocked
 *   - onUserUnblocked: callback function when user is unblocked
 */
export default function UserSearchAndBlock({ onUserBlocked, onUserUnblocked }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'block' or 'unblock'

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFoundUser(null);

    if (!searchEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setSearching(true);
    try {
      const response = await api.admin.searchUserByEmail(searchEmail.trim());
      if (response?.success && response?.data) {
        setFoundUser(response.data);
      } else {
        setError(response?.message || 'User not found');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search user');
    } finally {
      setSearching(false);
    }
  };

  const initiateBlockUnblock = (action) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const handleBlockUnblock = async () => {
    if (!foundUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (confirmAction === 'block') {
        response = await api.admin.blockUser(foundUser.user_id);
      } else {
        response = await api.admin.unblockUser(foundUser.user_id);
      }

      if (response?.success) {
        setSuccess(response.message);

        // Update the found user status
        const updatedUser = { ...foundUser };
        updatedUser.status = confirmAction === 'block' ? 'BLOCKED' : 'ACTIVE';
        setFoundUser(updatedUser);

        // Trigger callback
        if (confirmAction === 'block' && onUserBlocked) {
          onUserBlocked(updatedUser);
        } else if (confirmAction === 'unblock' && onUserUnblocked) {
          onUserUnblocked(updatedUser);
        }
      } else {
        setError(response?.message || `Failed to ${confirmAction} user`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || `Failed to ${confirmAction} user`);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleClearSearch = () => {
    setSearchEmail('');
    setFoundUser(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Search User</h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                <Search size={18} />
              </span>
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl px-12 py-3.5 border border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm shadow-inner"
                placeholder="search by user email..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={searching}
            className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity w-full"
          >
            {searching ? 'Searching...' : 'Search User'}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container/20 border border-error/30 text-error-dim rounded-2xl text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400/50 text-green-900 dark:text-green-100 rounded-2xl text-sm">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}
      </section>

      {/* User Details & Actions */}
      {foundUser && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-extrabold text-on-surface dark:text-white">User Information</h2>
            <button
              onClick={handleClearSearch}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              title="Clear search"
            >
              <X size={20} className="text-on-surface-variant" />
            </button>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                Name
              </label>
              <div className="text-on-surface dark:text-white font-medium">
                {foundUser.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                Email
              </label>
              <div className="text-on-surface dark:text-white font-medium break-all">
                {foundUser.email}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                Phone
              </label>
              <div className="text-on-surface dark:text-white">
                {foundUser.phone || 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                Role
              </label>
              <div>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black bg-primary/20 text-primary">
                  {foundUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                Status
              </label>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${
                    foundUser.status === 'BLOCKED'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100'
                      : foundUser.status === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100'
                  }`}
                >
                  {foundUser.status}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                Joined
              </label>
              <div className="text-on-surface dark:text-white">
                {new Date(foundUser.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Provider Details */}
            {foundUser.provider_type && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                    Provider Type
                  </label>
                  <div className="text-on-surface dark:text-white">
                    {foundUser.provider_type}
                  </div>
                </div>

                {foundUser.agency_name && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                      Agency Name
                    </label>
                    <div className="text-on-surface dark:text-white">
                      {foundUser.agency_name}
                    </div>
                  </div>
                )}

                {foundUser.hotel_name && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                      Hotel Name
                    </label>
                    <div className="text-on-surface dark:text-white">
                      {foundUser.hotel_name}
                    </div>
                  </div>
                )}

                {foundUser.trade_license_id && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                      License ID
                    </label>
                    <div className="text-on-surface dark:text-white">
                      {foundUser.trade_license_id}
                    </div>
                  </div>
                )}

                {foundUser.address && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant dark:text-white/80">
                      Address
                    </label>
                    <div className="text-on-surface dark:text-white">
                      {foundUser.address}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-outline-variant/10">
            {foundUser.status === 'BLOCKED' ? (
              <button
                onClick={() => initiateBlockUnblock('unblock')}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
              >
                <LockOpen size={18} />
                Unblock User
              </button>
            ) : (
              <button
                onClick={() => initiateBlockUnblock('block')}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Lock size={18} />
                Block User
              </button>
            )}

            <button
              onClick={handleClearSearch}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
            >
              Clear
            </button>
          </div>
        </section>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && foundUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm space-y-6 border border-outline-variant/10">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-on-surface dark:text-white">
                {confirmAction === 'block' ? 'Block User?' : 'Unblock User?'}
              </h3>
              <p className="text-sm text-on-surface-variant dark:text-white/80">
                {confirmAction === 'block'
                  ? `Are you sure you want to block ${foundUser.email}? They will not be able to access the system.`
                  : `Are you sure you want to unblock ${foundUser.email}? They will be able to access the system again.`}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="px-6 py-2 bg-surface-container-low text-on-surface dark:text-white rounded-2xl font-bold hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUnblock}
                disabled={loading}
                className={`px-6 py-2 text-white font-bold rounded-2xl disabled:opacity-50 transition-all ${
                  confirmAction === 'block' ? 'bg-red-600 hover:opacity-90' : 'bg-green-600 hover:opacity-90'
                }`}
              >
                {loading ? 'Processing...' : confirmAction === 'block' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

