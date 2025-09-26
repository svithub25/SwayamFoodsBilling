import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Package,
  Calendar,
  Filter,
  RefreshCw,
  Eye 
} from 'lucide-react';
import PinProtected from './reusables/PinProtected';

const SalesmanCommission = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesmen, setSalesmen] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    salesman: '',
    billNumber: ''
  });

  useEffect(() => {
    loadCommissions();
    async function fetchSalesmen() { 
      const list = await window.electronAPI.getSalesmen();
      setSalesmen(list);
    } 
    fetchSalesmen();
    // eslint-disable-next-line
  }, []);

const loadCommissions = async () => {
  setLoading(true);
  try {
    const data = await window.electronAPI.getSalesmanCommission();
    // Sort by bill number descending (extract numeric part)
    data.sort((a, b) => {
      // Example bill: SH/25-26/5
      // Extract last number after last slash
      const getBillNum = bill => {
        const parts = bill.split('/');
        return parseInt(parts[parts.length - 1], 10) || 0;
      };
      return getBillNum(b.bill_number) - getBillNum(a.bill_number);
    });
    setCommissions(data); 
    console.log('Loaded commissions:', data);
  } catch (error) {
    console.error('Error loading commissions:', error);
  } finally {
    setLoading(false);
  }
};

  // Filter commissions by date, salesman, and bill number
  const filteredCommissions = commissions.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    const matchDate =
      (!startDate || saleDate >= startDate) &&
      (!endDate || saleDate <= endDate);
    const matchSalesman =
      !filters.salesman || String(sale.salesman_id) === String(filters.salesman);
    const matchBill =
      !filters.billNumber ||
      sale.bill_number.toLowerCase().includes(filters.billNumber.toLowerCase());
    return matchDate && matchSalesman && matchBill;
  });

  const getTotalCommission = () =>
    filteredCommissions.reduce((sum, sale) => sum + sale.totalCommission, 0);

  const getTotalOrders = () => filteredCommissions.length;

  const getAvgCommission = () =>
    filteredCommissions.length > 0
      ? getTotalCommission() / filteredCommissions.length
      : 0;

  // Helper to highlight filter text in bill number
const highlightText = (text, highlight) => {
  if (!highlight) return text;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
  );
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
     <PinProtected message="This module is protected and requires PIN verification to access." modulename='Salesman Commission'>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salesman Commission</h1>
          <p className="text-gray-600">View and manage all salesman commission calculations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalOrders()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900">₹{getTotalCommission().toLocaleString(undefined, {maximumFractionDigits:2})}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Commission</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{getAvgCommission().toLocaleString(undefined, {maximumFractionDigits:2})}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Salesmen</p>
              <p className="text-2xl font-bold text-gray-900">{salesmen.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salesman</label>
            <select
              value={filters.salesman}
              onChange={e => setFilters({ ...filters, salesman: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Salesman</option>
              {salesmen.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
            <input
              type="text"
              value={filters.billNumber}
              onChange={e => setFilters({ ...filters, billNumber: e.target.value })}
              placeholder="Enter bill number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', salesman: '', billNumber: '' })}
            className="flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Commission Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Commission Records</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salesman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items & Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Commission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommissions.map(sale => (
                <tr key={sale.sale_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {highlightText(sale.bill_number, filters.billNumber)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.salesman_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <ul>
                      {sale.items.map((item, idx) => (
                        <li key={idx}>
                          {item.item_name} × {item.quantity} | Comm: ₹{item.commission.toFixed(2)}
                          <span className="text-xs text-gray-500 ml-2">
                            (Cust: ₹{item.customer_rate} - Salesman: ₹{item.salesman_rate})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                    ₹{sale.totalCommission.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCommissions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No commission records found</p>
            </div>
          )}
        </div>
      </div> 
    </div>
    </PinProtected>
  );
};

export default SalesmanCommission;