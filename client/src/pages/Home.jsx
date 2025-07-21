// src/pages/Home.jsx
import React, { useState } from 'react';
import ErrorNotification from '../components/ErrorNotification';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to backend OAuth endpoint
      window.location.href = '/api/auth/google';
    } catch (err) {
      setError({
        type: 'NETWORK',
        severity: 'HIGH',
        message: 'Failed to initiate Google sign-in',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Error Notification */}
      {error && (
        <ErrorNotification 
          error={error} 
          onClose={() => setError(null)} 
        />
      )}

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-6">📬</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Email Sorter
          </h1>
          <p className="text-gray-600 mb-8">
            Organize your emails with AI-powered categorization and smart management
          </p>
          
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          
          <div className="mt-6 text-xs text-gray-500">
            By signing in, you agree to our terms of service and privacy policy
          </div>
        </div>
      </div>
    </div>
  );
}
