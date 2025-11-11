import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

function BankingPDC({ bankAccounts, onRefresh }) {
  const [pdcList, setPdcList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'Pending',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadPDCList();
  }, [filters]);

  const loadPDCList = async () => {
    setLoading(true);
    try {
      const pdcs = await window.electronAPI.getPdcList(filters);
      setPdcList(pdcs);
    } catch (error) {
      console.error('Error loading PDC list:', error);
      toast.error('Failed to load PDC list: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pdcId, newStatus) => {
    // Confirmation message based on status
    const confirmMessages = {
      'Deposited': 'Mark this cheque as deposited in bank?',
      'Cleared': 'Mark this cheque as cleared?',
      'Bounced': 'Mark this cheque as bounced?',
      'Cancelled': 'Cancel this cheque?'
    };

    if (!confirm(confirmMessages[newStatus] || 'Update PDC status?')) {
      return;
    }

    const notes = prompt(`Enter notes for status change to ${newStatus} (optional):`);
    if (notes === null) return; // User clicked cancel

    setUpdatingId(pdcId);
    const today = new Date().toISOString().split('T')[0];

    try {
      const updateData = {
        pdcId,
        status: newStatus,
        notes: notes || null,
        depositDate: null,
        clearedDate: null
      };

      // Set appropriate dates based on status
      if (newStatus === 'Deposited') {
        updateData.depositDate = today;
      } else if (newStatus === 'Cleared') {
        // If previously deposited, keep that date, otherwise set today
        const pdc = pdcList.find(p => p.id === pdcId);
        updateData.depositDate = pdc.deposit_date || today;
        updateData.clearedDate = today;
      }

      console.log('Updating PDC with data:', updateData);
      
      const result = await window.electronAPI.updatePdcStatus(updateData);

      if (result.success) {
        toast.success(`PDC status updated to ${newStatus} successfully!`);
        await loadPDCList();
        onRefresh();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating PDC status:', error);
      toast.error('Failed to update PDC status: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Deposited': return 'bg-blue-100 text-blue-800';
      case 'Cleared': return 'bg-green-100 text-green-800';
      case 'Bounced': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (chequeDate) => {
    return new Date(chequeDate) < new Date() && filters.status === 'Pending';
  };

  const getTotalAmount = (status) => {
    return pdcList
      .filter(p => p.status === status)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Deposited">Deposited</option>
              <option value="Cleared">Cleared</option>
              <option value="Bounced">Bounced</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPDCList}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pdcList.filter(p => p.status === 'Pending').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ₹{getTotalAmount('Pending').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deposited</p>
              <p className="text-2xl font-bold text-blue-600">
                {pdcList.filter(p => p.status === 'Deposited').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ₹{getTotalAmount('Deposited').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cleared</p>
              <p className="text-2xl font-bold text-green-600">
                {pdcList.filter(p => p.status === 'Cleared').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ₹{getTotalAmount('Cleared').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounced</p>
              <p className="text-2xl font-bold text-red-600">
                {pdcList.filter(p => p.status === 'Bounced').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ₹{getTotalAmount('Bounced').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* PDC Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading PDCs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cheque Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cheque No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pdcList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No post-dated cheques found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  pdcList.map((pdc) => (
                    <tr 
                      key={pdc.id} 
                      className={`hover:bg-gray-50 ${isOverdue(pdc.cheque_date) ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {new Date(pdc.cheque_date).toLocaleDateString('en-IN')}
                          {isOverdue(pdc.cheque_date) && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div> 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {pdc.cheque_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{pdc.party_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{pdc.account_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full
                          ${pdc.voucher_type === 'Payment' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                        `}>
                          {pdc.voucher_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        ₹{pdc.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pdc.status)}`}>
                          {pdc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {updatingId === pdc.id ? (
                          <span className="text-gray-500 flex items-center justify-end">
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          <>
                            {pdc.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={() => handleStatusUpdate(pdc.id, 'Deposited')}
                                  className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                                  title="Mark as deposited in bank"
                                >
                                  Deposit
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(pdc.id, 'Cancelled')}
                                  className="text-gray-600 hover:text-gray-900 font-medium"
                                  title="Cancel this cheque"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {pdc.status === 'Deposited' && (
                              <>
                                <button 
                                  onClick={() => handleStatusUpdate(pdc.id, 'Cleared')}
                                  className="text-green-600 hover:text-green-900 mr-3 font-medium"
                                  title="Mark as cleared"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(pdc.id, 'Bounced')}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                  title="Mark as bounced"
                                >
                                  Bounce
                                </button>
                              </>
                            )}
                            {(pdc.status === 'Cleared' || pdc.status === 'Bounced' || pdc.status === 'Cancelled') && (
                              <span className="text-gray-400 text-xs">No actions</span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Section */}
      {pdcList.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">PDC Status Flow:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Pending:</strong> Cheque issued but not yet deposited</li>
                <li><strong>Deposited:</strong> Cheque submitted to bank for clearing</li>
                <li><strong>Cleared:</strong> Amount successfully credited/debited</li>
                <li><strong>Bounced:</strong> Cheque returned due to insufficient funds or other issues</li>
                <li><strong>Cancelled:</strong> Cheque cancelled before deposit</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankingPDC;