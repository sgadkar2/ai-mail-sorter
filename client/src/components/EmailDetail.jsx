import React, { useState, useEffect } from 'react';
import { api } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import { Icons } from './Icons';

export default function EmailDetail({ email, emailId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('html'); // 'html' or 'text'
  const [fullEmail, setFullEmail] = useState(email);

  useEffect(() => {
    const fetchEmail = async () => {
      if (!emailId || email) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.emails.getById(emailId);
        setFullEmail(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, [emailId, email]);

  if (loading || !fullEmail) {
    return <div className="p-6"><span>Loading email...</span></div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleUnsubscribe = async () => {
    if (!fullEmail.unsubscribeLink) {
      setError({
        type: 'VALIDATION',
        severity: 'MEDIUM',
        message: 'No unsubscribe link found for this email',
        details: 'This email does not contain an unsubscribe link'
      });
      return;
    }

    if (!confirm('Are you sure you want to unsubscribe from this sender? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.emails.unsubscribe([fullEmail._id]);
      
      const result = response.results[0];
      if (result.success) {
        alert('✅ Unsubscribe request processed successfully');
      } else {
        setError({
          type: 'SERVER',
          severity: 'MEDIUM',
          message: 'Failed to unsubscribe',
          details: result.error || 'Unknown error occurred'
        });
      }
    } catch (err) {
      setError(err);
      console.error('Error unsubscribing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.emails.delete([fullEmail._id]);
      
      alert('✅ Email deleted successfully');
      onBack();
    } catch (err) {
      setError(err);
      console.error('Error deleting email:', err);
    } finally {
      setLoading(false);
    }
  };

  // NEW FUNCTION: Render email content based on view mode
  const renderEmailContent = () => {
    if (viewMode === 'html' && fullEmail.htmlBody) {
      return (
        <div 
          className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: fullEmail.htmlBody }}
        />
      );
    } else {
      return (
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
          {fullEmail.body || '(No content)'}
        </pre>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Error Notification */}
      {error && (
        <ErrorNotification 
          error={error} 
          onClose={() => setError(null)} 
        />
      )}

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
            Back to Email List
          </button>
          
          <div className="flex gap-2">
            {fullEmail.unsubscribeLink && (
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icons.Unsubscribe className="w-4 h-4" />
                    Unsubscribe
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Icons.Trash className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {fullEmail.subject || '(No Subject)'}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>From: {fullEmail.from}</span>
          <span>Date: {formatDate(fullEmail.createdAt)}</span>
          {fullEmail.gmailAccount && (
            <span className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
              <Icons.Email className="w-3 h-3" />
              {fullEmail.gmailAccount.email}
            </span>
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className="p-6">
        {/* Summary */}
        {fullEmail.summary && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Icons.Info className="w-4 h-4" />
              AI Summary
            </h3>
            <p className="text-blue-800">{fullEmail.summary}</p>
          </div>
        )}

        {/* Category */}
        {fullEmail.category && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Icons.Folder className="w-4 h-4" />
              Category
            </h3>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
              {fullEmail.category.name}
            </span>
            {fullEmail.category.description && (
              <p className="text-gray-600 text-sm mt-1">
                {fullEmail.category.description}
              </p>
            )}
          </div>
        )}

        {/* NEW: View Mode Toggle */}
        {fullEmail.htmlBody && fullEmail.body && (
          <div className="mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('html')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'html' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rich View
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'text' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Plain Text
              </button>
            </div>
          </div>
        )}

        {/* Email Body - UPDATED */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Email Content</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {renderEmailContent()}
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Email Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Message ID:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs break-all">
                {fullEmail.messageId}
              </span>
            </div>
            <div>
              <span className="font-medium">Thread ID:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs break-all">
                {fullEmail.threadId}
              </span>
            </div>
            <div>
              <span className="font-medium">Has Attachments:</span>
              <span className="ml-2 text-gray-600">
                {fullEmail.hasAttachments ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Unsubscribe Link:</span>
              <span className="ml-2 text-gray-600">
                {fullEmail.unsubscribeLink ? 'Available' : 'Not available'}
              </span>
            </div>
          </div>
          
          {fullEmail.unsubscribeLink && (
            <div className="mt-4">
              <span className="font-medium text-sm">Unsubscribe URL:</span>
              <a 
                href={fullEmail.unsubscribeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800 text-sm break-all"
              >
                {fullEmail.unsubscribeLink}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 