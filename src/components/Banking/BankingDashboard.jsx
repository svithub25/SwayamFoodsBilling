import React, { useState, useEffect } from 'react';
import { Banknote, FileText, Calendar, RefreshCw, Plus, Eye, Edit } from 'lucide-react';
import AddAccountModal from './modals/AddAccountModal';

function BankingDashboard({ bankAccounts, onRefresh }) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [stats, setStats] = useState({
    pendingCheques: 0,
    unreconciledCount: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const pdcList = await window.electronAPI.getPdcList({ status: 'Pending' });
      setStats(prev => ({
        ...prev,
        pendingCheques: pdcList.length
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getTotalBalance = () => {
    return bankAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  };

  const handleAccountAdded = () => {
    setShowAccountModal(false);
    onRefresh();
    loadStats();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className={`text-2xl font-bold ${getTotalBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(getTotalBalance()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Banknote className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bank Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{bankAccounts.length}</p>
            </div>
            <FileText className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Cheques</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCheques}</p>
            </div>
            <Calendar className="w-12 h-12 text-yellow-500" />
          </div>
        </div> */}

        {/* <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unreconciled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreconciledCount}</p>
            </div>
            <RefreshCw className="w-12 h-12 text-orange-500" />
          </div>
        </div> */}
      </div>

      {/* Bank Accounts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Bank Accounts</h2>
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Account
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
                </th>
                {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No bank accounts found. Click "Add Account" to get started.
                  </td>
                </tr>
              ) : (
                bankAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{account.account_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.bank_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.account_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`font-semibold ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(account.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 inline-flex items-center">
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAccountModal && (
        <AddAccountModal 
          onClose={() => setShowAccountModal(false)}
          onSuccess={handleAccountAdded}
        />
      )}
    </div>
  );
}

export default BankingDashboard;