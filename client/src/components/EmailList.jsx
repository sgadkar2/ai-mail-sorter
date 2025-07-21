import React, { useState, useEffect } from 'react';
import { api } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import { LoadingSpinner, ErrorState, EmptyState } from './LoadingErrorStates';
import { Icons } from './Icons';
import EmailItem from './EmailItem';
import EmailDetail from './EmailDetail';
import { useParams, useNavigate } from 'react-router-dom';

export default function EmailList({ categoryId, onBack }) {
  const [category, setCategory] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch category details if not provided
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all categories and find the one with categoryId
        const categories = await api.categories.getAll();
        const found = categories.find((cat) => cat._id === categoryId);
        setCategory(found);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    if (!categoryId) return;
    fetchCategory();
  }, [categoryId]);

  const fetchEmails = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 20,
        ...(search && { search })
      };
      const data = await api.emails.getByCategory(categoryId, params);
      setEmails(data.emails);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);
    } catch (err) {
      setError(err);
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchEmails();
    }
  }, [categoryId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    try {
      setSearchLoading(true);
      setCurrentPage(1);
      await fetchEmails(1, searchTerm);
    } catch (err) {
      setError(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePageChange = async (page) => {
    try {
      setCurrentPage(page);
      await fetchEmails(page, searchTerm);
    } catch (err) {
      setError(err);
    }
  };

  const handleEmailSelect = (emailId, checked) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEmails(new Set(emails.map(email => email._id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedEmails.size) return;

    if (!confirm(`Are you sure you want to delete ${selectedEmails.size} email(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      setError(null);
      
      await api.emails.delete(Array.from(selectedEmails));
      
      // Refresh the email list
      await fetchEmails(currentPage, searchTerm);
      setSelectedEmails(new Set());
    } catch (err) {
      setError(err);
      console.error('Error deleting emails:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnsubscribe = async () => {
    if (!selectedEmails.size) return;

    if (!confirm(`Are you sure you want to unsubscribe from ${selectedEmails.size} email(s)? This will attempt to unsubscribe from each sender.`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      setError(null);
      
      const response = await api.emails.unsubscribe(Array.from(selectedEmails));
      
      console.log('Unsubscribe results:', response);
      
      // Show success message with results
      const successCount = response.results.filter(r => r.success).length;
      const totalCount = response.results.length;
      
      if (successCount === totalCount) {
        alert(`✅ Successfully processed ${successCount} unsubscribe requests`);
      } else {
        alert(`⚠️ Processed ${totalCount} requests: ${successCount} successful, ${totalCount - successCount} failed`);
      }
      
      // Refresh the email list
      await fetchEmails(currentPage, searchTerm);
      setSelectedEmails(new Set());
    } catch (err) {
      setError(err);
      console.error('Error unsubscribing:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleEmailClick = (email) => {
    navigate(`/dashboard/emails/${email._id}`);
  };

  if (loading || !category) {
    return <LoadingSpinner message="Loading emails..." />;
  }

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
          <div>
            <button 
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1 transition-colors"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              Back to Categories
            </button>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Icons.Email className="w-5 h-5 text-blue-600" />
              {category.name} ({emails.length} emails)
            </h2>
            <p className="text-gray-600 text-sm">{category.description}</p>
          </div>
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 min-w-64">
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={searchLoading}
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchTerm.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Icons.Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </form>

          {selectedEmails.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkUnsubscribe}
                disabled={bulkActionLoading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icons.Unsubscribe className="w-4 h-4" />
                    Unsubscribe ({selectedEmails.size})
                  </>
                )}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icons.Trash className="w-4 h-4" />
                    Delete ({selectedEmails.size})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="divide-y">
        {loading ? (
          <LoadingSpinner message="Loading emails..." />
        ) : error && emails.length === 0 ? (
          <ErrorState 
            error={error} 
            onRetry={() => fetchEmails(currentPage, searchTerm)}
            title="Failed to load emails"
          />
        ) : emails.length === 0 ? (
          <EmptyState
            title="No emails found"
            message={searchTerm ? `No emails match "${searchTerm}"` : "No emails in this category yet"}
            icon={<Icons.Inbox className="w-12 h-12 text-gray-400" />}
          />
        ) : (
          <>
            {/* Select All */}
            <div className="p-4 bg-gray-50 border-b">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEmails.size === emails.length && emails.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedEmails.size} selected)
                </span>
              </label>
            </div>

            {/* Email Items */}
            {emails.map((email) => (
              <EmailItem
                key={email._id}
                email={email}
                isSelected={selectedEmails.has(email._id)}
                onSelect={(checked) => handleEmailSelect(email._id, checked)}
                onClick={() => handleEmailClick(email)}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 