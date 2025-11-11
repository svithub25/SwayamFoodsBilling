import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, DollarSign, TrendingDown, TrendingUp, Save, X, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

function BankSettings({ onRefresh }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await window.electronAPI.getTransactionCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    // Check if category is default
    if (category.is_default === 1) {
      toast.warning('Default categories cannot be edited');
      return;
    }
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (category) => {
    // Check if category is default
    if (category.is_default === 1) {
      toast.error('Default categories cannot be deleted');
      return;
    }
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      await window.electronAPI.deleteTransactionCategory(deletingCategory.id);
      toast.success('Category deleted successfully');
      loadCategories();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setShowDeleteModal(false);
      setDeletingCategory(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingCategory(null);
  };

  const filteredCategories = categories.filter(cat => {
    const matchesType = filters.type === 'all' || cat.category_type === filters.type;
    const matchesSearch = !filters.searchTerm || 
      cat.category_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const expenseCategories = filteredCategories.filter(c => c.category_type === 'Expense');
  const incomeCategories = filteredCategories.filter(c => c.category_type === 'Income');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Categories</h2>
            <p className="text-gray-600 mt-1">Manage expense and income categories for banking transactions</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Expense">Expenses Only</option>
              <option value="Income">Income Only</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Categories</label>
            <input
              type="text"
              placeholder="Search by name or description..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <Tag className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expense Categories</p>
              <p className="text-2xl font-bold text-red-600">{expenseCategories.length}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Income Categories</p>
              <p className="text-2xl font-bold text-green-600">{incomeCategories.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-6 py-4">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-900">Expense Categories</h3>
              <span className="ml-auto text-sm text-red-600 font-medium">
                {expenseCategories.length} categories
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {expenseCategories.length > 0 ? (
              expenseCategories.map((category) => (
                <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{category.category_name}</h4>
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          Expense
                        </span>
                        {category.is_default === 1 && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center">
                            <Lock className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    {category.is_default !== 1 && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <TrendingDown className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No expense categories found</p>
              </div>
            )}
          </div>
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 px-6 py-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-900">Income Categories</h3>
              <span className="ml-auto text-sm text-green-600 font-medium">
                {incomeCategories.length} categories
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {incomeCategories.length > 0 ? (
              incomeCategories.map((category) => (
                <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{category.category_name}</h4>
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Income
                        </span>
                        {category.is_default === 1 && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center">
                            <Lock className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    {category.is_default !== 1 && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No income categories found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            loadCategories();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCategory && (
        <DeleteConfirmModal
          categoryName={deletingCategory.category_name}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmModal({ categoryName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700">
            Are you sure you want to delete the category{' '}
            <span className="font-semibold">"{categoryName}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Category Form Modal Component
function CategoryFormModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category_name: category?.category_name || '',
    category_type: category?.category_type || 'Expense',
    description: category?.description || ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category_name.trim()) {
      newErrors.category_name = 'Category name is required';
    }
    if (!formData.category_type) {
      newErrors.category_type = 'Category type is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (category) {
        await window.electronAPI.updateTransactionCategory(category.id, formData);
        toast.success('Category updated successfully');
      } else {
        await window.electronAPI.addTransactionCategory(formData);
        toast.success('Category added successfully');
      }
      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Office Rent, Consulting Income"
            />
            {errors.category_name && (
              <p className="mt-1 text-sm text-red-600">{errors.category_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category_type}
              onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
            {errors.category_type && (
              <p className="mt-1 text-sm text-red-600">{errors.category_type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description for this category"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {saving ? 'Saving...' : category ? 'Update' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BankSettings;