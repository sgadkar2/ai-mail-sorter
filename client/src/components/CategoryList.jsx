import React, { useEffect, useState } from 'react';
import { api } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import { LoadingSpinner, ErrorState, EmptyState } from './LoadingErrorStates';
import { Icons } from './Icons';

export default function CategoryList({ onCategoryClick }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError({
        type: 'VALIDATION',
        severity: 'MEDIUM',
        message: 'Category name is required',
        details: 'Please enter a category name'
      });
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      const newCategory = await api.categories.create(form);
      setCategories((prev) => [...prev, newCategory]);
      setForm({ name: '', description: '' });
      setShowForm(false);
    } catch (err) {
      setError(err);
      console.error('Error adding category:', err);
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  if (error && categories.length === 0) {
    return (
      <ErrorState 
        error={error} 
        onRetry={fetchCategories}
        title="Failed to load categories"
      />
    );
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
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Icons.Folder className="w-6 h-6 text-blue-600" />
              Categories
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Organize your emails with custom categories
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {showForm ? (
              <>
                <Icons.Close className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Icons.Plus className="w-4 h-4" />
                Add Category
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <form onSubmit={addCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Work, Personal, Shopping"
                disabled={formLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what types of emails should go in this category"
                rows="3"
                disabled={formLoading}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formLoading || !form.name.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Icons.Plus className="w-4 h-4" />
                    Add Category
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ name: '', description: '' });
                  setError(null);
                }}
                disabled={formLoading}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="p-6">
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Create your first category to start organizing emails"
            icon={<Icons.Folder className="w-12 h-12 text-gray-400" />}
            action={
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Icons.Plus className="w-4 h-4" />
                Create Category
              </button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                onClick={() => onCategoryClick(category)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <Icons.ArrowLeft className="w-4 h-4 text-blue-600 transform rotate-180" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
