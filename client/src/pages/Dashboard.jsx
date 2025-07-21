import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTokenFromUrl, handleOAuthCallback } from '../utils/auth';
import ErrorNotification from '../components/ErrorNotification';
import { LoadingSpinner } from '../components/LoadingErrorStates';
import { Icons } from '../components/Icons';
import CategoryList from '../components/CategoryList';
import EmailList from '../components/EmailList';
import GmailAccountList from '../components/GmailAccountList';
import EmailDetail from '../components/EmailDetail';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle OAuth callback
        const callbackResult = handleOAuthCallback();
        
        if (callbackResult.success && callbackResult.token) {
          // Token was successfully extracted and stored
          navigate('/dashboard', { replace: true });
        } else if (callbackResult.success && callbackResult.message) {
          // Success message from OAuth
          // Message will be shown via URL params
        } else if (!callbackResult.success && callbackResult.error) {
          // Error from OAuth
          setError(callbackResult.error);
        }

        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/', { replace: true });
          return;
        }

        // Check for URL parameters (messages/errors from OAuth)
        const urlParams = new URLSearchParams(location.search);
        const message = urlParams.get('message');
        const errorParam = urlParams.get('error');

        if (message) {
          // Show success message
          setError({
            type: 'SUCCESS',
            severity: 'LOW',
            message: message,
            details: null
          });
          // Clean up URL
          navigate(location.pathname, { replace: true });
        }

        if (errorParam) {
          // Show error message
          setError({
            type: 'AUTHENTICATION',
            severity: 'HIGH',
            message: errorParam,
            details: null
          });
          // Clean up URL
          navigate(location.pathname, { replace: true });
        }

      } catch (err) {
        console.error('Dashboard initialization error:', err);
        setError({
          type: 'UNKNOWN',
          severity: 'HIGH',
          message: 'Failed to initialize dashboard',
          details: err.message
        });
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Initializing dashboard..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Notification */}
      {error && (
        <ErrorNotification 
          error={error} 
          onClose={() => setError(null)} 
          autoClose={error.type === 'SUCCESS'}
        />
      )}

      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">AI Email Sorter</h1>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => navigate('/dashboard/accounts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                location.pathname.startsWith('/dashboard/accounts')
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icons.Email className="w-4 h-4" />
              Gmail Accounts
            </button>
            <button
              onClick={() => navigate('/dashboard/categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                location.pathname.startsWith('/dashboard/categories')
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icons.Folder className="w-4 h-4" />
              Categories
            </button>
          </nav>
        </div>

        {/* Nested Routes */}
        <Routes>
          <Route path="accounts" element={<GmailAccountList />} />
          <Route path="categories" element={<CategoryListWithNav />} />
          <Route path="categories/:categoryId/emails" element={<EmailListWithNav />} />
          <Route path="emails/:emailId" element={<EmailDetailWithNav />} />
          <Route path="" element={<Navigate to="categories" />} />
        </Routes>
      </div>
    </div>
  );
}

// Wrapper for CategoryList to handle navigation to emails
function CategoryListWithNav() {
  const navigate = useNavigate();
  const handleCategoryClick = (category) => {
    navigate(`/dashboard/categories/${category._id}/emails`);
  };
  return <CategoryList onCategoryClick={handleCategoryClick} />;
}

// Wrapper for EmailList to handle navigation to email details and back
function EmailListWithNav() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const handleBack = () => {
    navigate('/dashboard/categories');
  };
  return <EmailList categoryId={categoryId} onBack={handleBack} />;
}

// Wrapper for EmailDetail to handle navigation back to email list
function EmailDetailWithNav() {
  const { emailId } = useParams();
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
  return <EmailDetail emailId={emailId} onBack={handleBack} />;
}
