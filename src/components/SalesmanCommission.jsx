import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Package,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import PinProtected from './reusables/PinProtected';

const SalesmanCommission = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesmen, setSalesmen] = useState([]);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    salesman: '',
    billNumber: '',
    item: ''
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCommissions();
    async function fetchSalesmen() { 
      const list = await window.electronAPI.getSalesmen();
      setSalesmen(list);
    }
    async function fetchItems() {
      const list = await window.electronAPI.getItems();
      console.log('Fetched items:', list);
      setItems(list);
    } 
    fetchSalesmen();
    fetchItems();
    // eslint-disable-next-line
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getSalesmanCommission();
      console.log('Fetched commissions:', data);
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
      setCurrentPage(1); // Reset to first page on load
      console.log('Loaded commissions:', data);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

 
// Filter commissions by date, salesman, bill number, and item
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
  const matchItem = 
    !filters.item ||
    sale.items.some(item => {
      // Ensure both values are converted to numbers for comparison
      const itemId = parseInt(item.item_id, 10);
      const filterId = parseInt(filters.item, 10);
      return itemId === filterId;
    });
  return matchDate && matchSalesman && matchBill && matchItem;
});


  // --- PAGINATION LOGIC ---
  useEffect(() => {
    const total = Math.ceil(filteredCommissions.length / itemsPerPage);
    setTotalPages(total);
    
    // If current page exceeds total pages after filtering, reset to page 1
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredCommissions.length, itemsPerPage, currentPage]);

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCommissions = filteredCommissions.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.startDate, filters.endDate, filters.salesman, filters.billNumber, filters.item]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
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
                <option value="">All Salesmen</option>
                {salesmen.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
              <select
                value={filters.item}
                onChange={e => setFilters({ ...filters, item: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Items</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
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
              onClick={() => setFilters({ startDate: '', endDate: '', salesman: '', billNumber: '', item: '' })}
              className="flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Commission Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Commission Records</h2>
            </div>
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCommissions.length)} of {filteredCommissions.length} records
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
                    Customer
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
                {currentCommissions.map(sale => (
                  <tr key={sale.sale_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {highlightText(sale.bill_number, filters.billNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.salesman_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.customer_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <ul>
                        {sale.items.map((item, idx) => {
                          // Highlight item if filtered
                          const isFiltered = filters.item && String(item.item_id) === String(filters.item);
                          return (
                            <li key={idx} className={isFiltered ? 'bg-yellow-100 font-semibold' : ''}>
                              {item.item_name} × {item.quantity} | Comm: ₹{item.commission.toFixed(2)}
                              <span className="text-xs text-gray-500 ml-2">
                                (Cust: ₹{item.customer_rate} - Salesman: ₹{item.salesman_rate})
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                      ₹{sale.totalCommission.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentCommissions.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No commission records found</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-2 rounded-lg mr-2 ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="px-2 py-2">...</span>}
                    </>
                  )}
                  
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 py-2">...</span>}
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-3 py-2 rounded-lg ml-2 ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div> 
      </div>
    </PinProtected>
  );
};

export default SalesmanCommission; 