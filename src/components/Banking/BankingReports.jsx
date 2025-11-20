import React, { useState } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Calendar, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';

function BankingReports({ bankAccounts }) {
  const [activeReport, setActiveReport] = useState('statement'); 
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    bank_account_id: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const generateBankStatement = async () => {
    if (!filters.bank_account_id) {
      toast.error('Please select a bank account');
      return;
    }

    setLoading(true);
    try {
      const data = await window.electronAPI.getBankStatement({
        bankAccountId: filters.bank_account_id,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      console.log('Bank Statement data:', data);
      setReportData(data);
    } catch (error) {
      console.error('Error generating bank statement:', error);
      toast.error('Failed to generate bank statement');
    } finally {
      setLoading(false);
    }
  };

  const generateCashflowReport = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getCashflowReport({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      console.log('Cashflow Report data:', data);
      setReportData(data);
    } catch (error) {
      console.error('Error generating cashflow report:', error);
      toast.error('Failed to generate cashflow report');
    } finally {
      setLoading(false);
    }
  };

  const generateDaybook = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getDaybook({
        date: filters.startDate
      });
      console.log('Daybook data:', data);
      setReportData(data);
    } catch (error) {
      console.error('Error generating daybook:', error);
      toast.error('Failed to generate daybook');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    switch (activeReport) {
      case 'statement':
        generateBankStatement();
        break;
      case 'cashflow':
        generateCashflowReport();
        break;
      case 'daybook':
        generateDaybook();
        break;
      default:
        break;
    }
  };

  const handleExportReport = () => {
    if (!reportData) {
      toast.info('Please generate a report first');
      return;
    }
    // Export functionality can be implemented here
    toast.info('Export functionality to be implemented');
  };

  const reports = [
    { id: 'statement', name: 'Bank Statement', icon: FileText },
    { id: 'cashflow', name: 'Cashflow Report', icon: TrendingUp },
    { id: 'daybook', name: 'Day Book', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((report) => {
            const IconComponent = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => {
                  setActiveReport(report.id);
                  setReportData(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeReport === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <IconComponent className={`w-8 h-8 mx-auto mb-2 ${
                  activeReport === report.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <p className={`text-center font-medium ${
                  activeReport === report.id ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {report.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeReport === 'statement' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.bank_account_id}
                onChange={(e) => setFilters({ ...filters, bank_account_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Account</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} - {acc.bank_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {activeReport === 'daybook' ? 'Date' : 'From Date'}
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {activeReport !== 'daybook' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex items-end space-x-2">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
            {/* {reportData && (
              <button
                onClick={handleExportReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            )} */}
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <>
          {/* Bank Statement */}
          {activeReport === 'statement' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{reportData.account.account_name}</h3>
                    <p className="text-sm text-gray-600">{reportData.account.bank_name}</p>
                    <p className="text-sm text-gray-600">Account No: {reportData.account.account_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Statement Period</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(filters.startDate).toLocaleDateString('en-IN')} to {new Date(filters.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Opening Balance</p>
                  <p className={`text-2xl font-bold ${reportData.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(reportData.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {/* <span className="text-sm ml-2">{reportData.openingBalance >= 0 ? 'Dr' : 'Cr'}</span> */}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Closing Balance</p>
                  <p className={`text-2xl font-bold ${reportData.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(reportData.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {/* <span className="text-sm ml-2">{reportData.closingBalance >= 0 ? 'Dr' : 'Cr'}</span> */}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Debits
                        {/* <div className="text-xs text-red-600 font-normal">(Money OUT)</div> */}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Credits
                        {/* <div className="text-xs text-green-600 font-normal">(Money IN)</div> */}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(txn.transaction_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {txn.voucher_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full
                            ${txn.voucher_type === 'Payment' ? 'bg-red-100 text-red-800' : ''}
                            ${txn.voucher_type === 'Receipt' ? 'bg-green-100 text-green-800' : ''}
                            ${txn.voucher_type === 'Contra' ? 'bg-blue-100 text-blue-800' : ''}
                          `}>
                            {txn.voucher_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{txn.party_name || '-'}</div>
                          {txn.narration && (
                            <div className="text-xs text-gray-500 mt-1">{txn.narration}</div>
                          )}
                          {txn.cheque_number && (
                            <div className="text-xs text-blue-600 mt-1">
                              Cheque: {txn.cheque_number}
                              {txn.cleared_status && (
                                <span className={`ml-2 px-1 py-0.5 rounded text-xs
                                  ${txn.cleared_status === 'Cleared' ? 'bg-green-100 text-green-800' : ''}
                                  ${txn.cleared_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                  ${txn.cleared_status === 'Bounced' ? 'bg-red-100 text-red-800' : ''}
                                `}>
                                  {txn.cleared_status}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                          {txn.transaction_type === 'Debit' ? (
                            <span className="text-red-600">
                              ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                          {txn.transaction_type === 'Credit' ? (
                            <span className="text-green-600">
                              ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                          <span className={txn.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₹{Math.abs(txn.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          {/* <span className="text-xs ml-1">{txn.running_balance >= 0 ? 'Dr' : 'Cr'}</span> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right text-sm text-gray-700">
                        Total:
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">
                        ₹{reportData.transactions
                          .filter(t => t.transaction_type === 'Debit')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-green-600">
                        ₹{reportData.transactions
                          .filter(t => t.transaction_type === 'Credit')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span className={reportData.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{Math.abs(reportData.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          {/* <span className="text-xs ml-1">{reportData.closingBalance >= 0 ? 'Dr' : 'Cr'}</span> */}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Cashflow Report */}
          {activeReport === 'cashflow' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Receipts</p>
                      {/* <p className="text-xs text-gray-500 mb-1">(Money IN - Credits)</p> */}
                      <p className="text-2xl font-bold text-green-600">
                        ₹{reportData.totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{reportData.receiptCount} transactions</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Payments</p>
                      {/* <p className="text-xs text-gray-500 mb-1">(Money OUT - Debits)</p> */}
                      <p className="text-2xl font-bold text-red-600">
                        ₹{reportData.totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{reportData.paymentCount} transactions</p>
                    </div>
                    <TrendingDown className="w-12 h-12 text-red-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Cashflow</p>
                      <p className="text-xs text-gray-500 mb-1">(Receipts - Payments)</p>
                      <p className={`text-2xl font-bold ${reportData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(reportData.netCashFlow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {reportData.netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
                      </p>
                    </div>
                    <IndianRupee className={`w-12 h-12 ${reportData.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              </div>

              {/* Income by Category */}
              {reportData.incomeByCategory && reportData.incomeByCategory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    Income by Category 
                  </h3>
                  <div className="space-y-3">
                    {reportData.incomeByCategory.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                            <span className="text-sm font-semibold text-green-600">
                              ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              <span className="text-xs text-gray-500 ml-2">({cat.count} txn{cat.count > 1 ? 's' : ''})</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((cat.amount / reportData.totalReceipts) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {((cat.amount / reportData.totalReceipts) * 100).toFixed(1)}% of total receipts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses by Category */}
              {reportData.expenseByCategory && reportData.expenseByCategory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                    Expenses by Category 
                  </h3>
                  <div className="space-y-3">
                    {reportData.expenseByCategory.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                            <span className="text-sm font-semibold text-red-600">
                              ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              <span className="text-xs text-gray-500 ml-2">({cat.count} txn{cat.count > 1 ? 's' : ''})</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((cat.amount / reportData.totalPayments) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {((cat.amount / reportData.totalPayments) * 100).toFixed(1)}% of total payments
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Day Book */}
          {activeReport === 'daybook' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Day Book</h3>
                  <p className="text-gray-600">
                    Date: {new Date(filters.startDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Debits</p>
                  {/* <p className="text-xs text-gray-500 mb-1">(Debits)</p> */}
                  <p className="text-2xl font-bold text-red-600">
                    ₹{(reportData.summary?.total_debits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Credits</p>
                  {/* <p className="text-xs text-gray-500 mb-1">(Credits)</p> */}
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(reportData.summary?.total_credits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Amount</p>
                  <p className="text-xs text-gray-500 mb-1">(Credits - Debits)</p>
                  <p className={`text-2xl font-bold ${reportData.summary?.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(reportData.summary?.net_cashflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Debits
                        {/* <div className="text-xs text-red-600 font-normal">(OUT)</div> */}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Credits
                        {/* <div className="text-xs text-green-600 font-normal">(IN)</div> */}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No transactions found for this date.
                        </td>
                      </tr>
                    ) : (
                      reportData.transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {txn.voucher_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full
                              ${txn.voucher_type === 'Payment' ? 'bg-red-100 text-red-800' : ''}
                              ${txn.voucher_type === 'Receipt' ? 'bg-green-100 text-green-800' : ''}
                              ${txn.voucher_type === 'Contra' ? 'bg-blue-100 text-blue-800' : ''}
                            `}>
                              {txn.voucher_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{txn.account_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{txn.party_name || '-'}</div>
                            {txn.narration && (
                              <div className="text-xs text-gray-500 mt-1">{txn.narration}</div>
                            )}
                            {txn.cheque_number && (
                              <div className="text-xs text-blue-600 mt-1">
                                Cheque: {txn.cheque_number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                            {txn.transaction_type === 'Debit' ? (
                              <span className="text-red-600">
                                ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                            {txn.transaction_type === 'Credit' ? (
                              <span className="text-green-600">
                                ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right text-sm text-gray-700">
                        Total:
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">
                        ₹{(reportData.summary?.total_debits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-green-600">
                        ₹{(reportData.summary?.total_credits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BankingReports;