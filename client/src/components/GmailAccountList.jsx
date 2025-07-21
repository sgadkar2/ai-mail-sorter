import React, { useState, useEffect } from 'react';
import { api } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import { LoadingSpinner, ErrorState, EmptyState } from './LoadingErrorStates';
import { Icons } from './Icons';

export default function GmailAccountList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingAccount, setAddingAccount] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.gmailAccounts.getAll();
      setAccounts(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching Gmail accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      setAddingAccount(true);
      setError(null);
      
      const response = await api.gmailAccounts.add();
      
      // Redirect to Google OAuth
      window.location.href = response.authUrl;
    } catch (err) {
      setError(err);
      console.error('Error adding Gmail account:', err);
    } finally {
      setAddingAccount(false);
    }
  };

  const handleRemoveAccount = async (accountId) => {
    if (!confirm('Are you sure you want to remove this Gmail account? This will stop processing emails from this account and cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await api.gmailAccounts.remove(accountId);
      
      // Refresh the accounts list
      await fetchAccounts();
    } catch (err) {
      setError(err);
      console.error('Error removing Gmail account:', err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Gmail accounts..." />;
  }

  if (error && accounts.length === 0) {
    return (
      <ErrorState 
        error={error} 
        onRetry={fetchAccounts}
        title="Failed to load Gmail accounts"
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Error Notification */}
      {error && (
        <ErrorNotification 
          error={error} 
          onClose={() => setError(null)} 
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icons.Email className="w-6 h-6 text-blue-600" />
            Gmail Accounts
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your connected Gmail accounts for email processing
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddAccount}
            disabled={addingAccount}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {addingAccount ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              <>
                <Icons.Plus className="w-4 h-4" />
                Add Account
              </>
            )}
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="No Gmail accounts connected"
          message="Connect your first Gmail account to start processing emails"
          icon={<Icons.Email className="w-12 h-12 text-gray-400" />}
          action={
            <button
              onClick={handleAddAccount}
              disabled={addingAccount}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {addingAccount ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Icons.Plus className="w-4 h-4" />
                  Connect Gmail Account
                </>
              )}
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account._id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icons.Email className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.email}</h3>
                    <p className="text-sm text-gray-600">
                      Connected {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAccount(account._id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <Icons.Trash className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
