import React, { useState, useEffect } from 'react';
import { Package, Lock, Unlock, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const OpeningStockManagement = () => {
  const [openingStocks, setOpeningStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ itemName: '', sku: '' });

  useEffect(() => {
    loadOpeningStocks();
  }, []);

  const loadOpeningStocks = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getAllOpeningStock();
      setOpeningStocks(data);
    } catch (error) {
      console.error('Error loading opening stocks:', error);
      toast.error('Failed to load opening stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleLockStock = async (itemId) => {
    try {
      await window.electronAPI.lockOpeningStock(itemId);
      toast.success('Opening stock locked');
      loadOpeningStocks();
    } catch (error) {
      toast.error('Failed to lock opening stock');
    }
  };

  const handleUnlockStock = async (itemId) => {
    try {
      await window.electronAPI.unlockOpeningStock(itemId);
      toast.success('Opening stock unlocked');
      loadOpeningStocks();
    } catch (error) {
      toast.error('Failed to unlock opening stock');
    }
  };

  const handleLockAll = async () => {
    if (window.confirm('Are you sure you want to lock all opening stocks? This prevents further modifications.')) {
      try {
        await window.electronAPI.lockAllOpeningStocks();
        toast.success('All opening stocks locked');
        loadOpeningStocks();
      } catch (error) {
        toast.error('Failed to lock opening stocks');
      }
    }
  };

  const filteredStocks = openingStocks.filter(stock => {
    const matchesName = !filters.itemName || stock.item_name.toLowerCase().includes(filters.itemName.toLowerCase());
    const matchesSku = !filters.sku || stock.sku.toLowerCase().includes(filters.sku.toLowerCase());
    return matchesName && matchesSku;
  });

  const totalValue = filteredStocks.reduce((sum, stock) => sum + (stock.opening_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opening Stock Management</h1>
          <p className="text-gray-600">Manage opening stock for the current financial year</p>
        </div>
        <button
          onClick={handleLockAll}
          className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
        >
          <Lock className="w-4 h-4 mr-2" />
          Lock All
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStocks.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Locked Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredStocks.filter(s => s.is_locked === 1).length}
              </p>
            </div>
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by item name..."
            value={filters.itemName}
            onChange={(e) => setFilters({ ...filters, itemName: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Search by SKU..."
            value={filters.sku}
            onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setFilters({ itemName: '', sku: '' })}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Opening Stock Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStocks.map((stock) => (
                <tr key={stock.id} className={stock.is_locked ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stock.item_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {stock.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stock.opening_qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{stock.opening_rate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₹{stock.opening_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {stock.current_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stock.is_locked === 1 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Unlock className="w-3 h-3 mr-1" />
                        Unlocked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {stock.is_locked === 1 ? (
                      <button
                        onClick={() => handleUnlockStock(stock.item_id)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                        title="Unlock opening stock"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLockStock(stock.item_id)}
                        className="text-orange-600 hover:text-orange-900 flex items-center"
                        title="Lock opening stock"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStocks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No opening stock records found</p>
        </div>
      )}
    </div>
  );
};

export default OpeningStockManagement;