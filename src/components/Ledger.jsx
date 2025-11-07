import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Filter, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Eye,
  Package
} from 'lucide-react';
import PinProtected from './reusables/PinProtected';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all'
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getTransactions(filters);
      console.log('Loaded transactions:', data);
      setTransactions(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSales = () => {
    return transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.revenue || t.amount), 0);
  };

  const getTotalPurchases = () => {
    return transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getProfit = () => {
    return transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.gross_profit || 0), 0);
  };

  const getTotalCost = () => {
    return transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.cost || 0), 0);
  };

  const getAvgProfitMargin = () => {
    const sales = transactions.filter(t => t.type === 'sale');
    if (sales.length === 0) return 0;
    const totalMargin = sales.reduce((sum, t) => sum + parseFloat(t.profit_margin || 0), 0);
    return (totalMargin / sales.length).toFixed(2);
  };

  const viewTransactionDetails = async (transaction) => {
    if (transaction.type === 'sale') {
      try {
        const details = await window.electronAPI.getTransactionDetails({
          type: transaction.type,
          refNumber: transaction.ref_number
        });
        console.log('Loaded transaction details:', details);
        setSelectedTransaction(details);
        setShowDetailsModal(true);
      } catch (error) {
        console.error('Error loading transaction details:', error);
      }
    }
  };

  // --- PAGINATION LOGIC ---
  useEffect(() => {
    const total = Math.ceil(transactions.length / itemsPerPage);
    setTotalPages(total);
    
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [transactions.length, itemsPerPage, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.startDate, filters.endDate, filters.type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename='Ledger'> 
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ledger</h1>
            <p className="text-gray-600">Track all transactions with accurate FIFO cost calculation</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Sales</p>
                <p className="text-xl font-bold text-gray-900">₹{getTotalSales().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Purchases</p>
                <p className="text-xl font-bold text-gray-900">₹{getTotalPurchases().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Cost</p>
                <p className="text-xl font-bold text-gray-900">₹{getTotalCost().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${getProfit() >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <IndianRupee className={`w-5 h-5 ${getProfit() >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Gross Profit</p>
                <p className={`text-xl font-bold ${getProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{getProfit().toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Avg Margin</p>
                <p className="text-xl font-bold text-purple-900">{getAvgProfitMargin()}%</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date" 
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Transactions</option>
                <option value="sales">Sales Only</option>
                <option value="purchases">Purchases Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            </div>
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} transactions
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'sale' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'sale' ? 'Sale' : 'Purchase'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {transaction.ref_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                      <span className={transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}>
                        ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                      {transaction.type === 'sale' ? `₹${transaction.cost?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      {transaction.type === 'sale' ? (
                        <span className={transaction.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{transaction.gross_profit?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                      {transaction.type === 'sale' ? `${transaction.profit_margin || '0'}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {transaction.type === 'sale' && (
                        <button
                          onClick={() => viewTransactionDetails(transaction)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {currentTransactions.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found for the selected period</p>
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

        {/* Transaction Details Modal */}
        {showDetailsModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Transaction Details - {selectedTransaction.bill_number}</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold">{selectedTransaction.customer_name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{new Date(selectedTransaction.sale_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sale Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sale Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTransaction.items?.map((item, idx) => {
                      const itemTotal = item.total_amount || item.total_price || 0;
                      const itemProfit = item.profit || 0;
                      const profitMargin = itemTotal > 0 ? ((itemProfit / itemTotal) * 100).toFixed(2) : '0.00';
                      
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{(item.unit_price || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">₹{itemTotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">₹{(item.cost || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">₹{itemProfit.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-purple-600">{profitMargin}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 flex justify-end space-x-4 text-sm">
                  <div className="text-right">
                    <p className="text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold">₹{(selectedTransaction.total_amount || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div> 
        )}
      </div>
    </PinProtected>
  );
};

export default Ledger;