import React, { useState, useEffect } from 'react';
import { Calendar, Download, Building, Wallet, RefreshCw } from 'lucide-react';

const BalanceSheet = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadBalanceSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOfDate]);

  const loadBalanceSheet = async () => {
    setLoading(true);
    try {
      const response = await window.electronAPI.getBalanceSheet({ asOfDate });
      setData(response);
    } catch (error) {
      console.error('Error loading balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Export to PDF');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalAssets = (data?.currentAssets || 0) + (data?.fixedAssets || 0);
  const totalLiabilities = (data?.currentLiabilities || 0) + (data?.longTermLiabilities || 0);
  const equity = data?.equity || 0;
  const totalLiabilitiesAndEquity = totalLiabilities + equity;

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={exportToPDF}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Assets</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">₹{totalAssets.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-900 mt-1">₹{totalLiabilities.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Owner's Equity</p>
              <p className="text-2xl font-bold text-green-900 mt-1">₹{equity.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

  {/* Liabilities & Equity Side */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-900">LIABILITIES & EQUITY</h3>
            <p className="text-sm text-red-700">As of {new Date(asOfDate).toLocaleDateString('en-IN')}</p>
          </div>

          <div className="p-6">
            {/* Current Liabilities */}
            <div className="mb-6">
              <div className="py-2 mb-3 border-b-2 border-red-900">
                <span className="font-bold text-gray-900">Current Liabilities</span>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Accounts Payable</span>
                  <span className="font-medium text-gray-900">₹{(data?.accountsPayable || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Short-term Debt</span>
                  <span className="font-medium text-gray-900">₹{(data?.shortTermDebt || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-300 bg-red-50 px-4 rounded">
                <span className="font-semibold text-gray-900">Total Current Liabilities</span>
                <span className="font-bold text-red-600">₹{(data?.currentLiabilities || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div className="mb-6">
              <div className="py-2 mb-3 border-b-2 border-red-900">
                <span className="font-bold text-gray-900">Long-term Liabilities</span>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Long-term Debt</span>
                  <span className="font-medium text-gray-900">₹{(data?.longTermDebt || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-300 bg-red-50 px-4 rounded">
                <span className="font-semibold text-gray-900">Total Long-term Liabilities</span>
                <span className="font-bold text-red-600">₹{(data?.longTermLiabilities || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="mb-6">
              <div className="py-2 mb-3 border-b-2 border-green-900">
                <span className="font-bold text-gray-900">Owner's Equity</span>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Capital</span>
                  <span className="font-medium text-gray-900">₹{(data?.capital || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Retained Earnings</span>
                  <span className="font-medium text-gray-900">₹{(data?.retainedEarnings || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-300 bg-green-50 px-4 rounded">
                <span className="font-semibold text-gray-900">Total Equity</span>
                <span className="font-bold text-green-600">₹{equity.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Liabilities & Equity */}
            <div className="flex justify-between items-center py-4 px-4 bg-red-100 rounded-lg border-2 border-red-600">
              <span className="text-xl font-bold text-red-900">TOTAL LIABILITIES & EQUITY</span>
              <span className="text-xl font-bold text-red-900">₹{totalLiabilitiesAndEquity.toLocaleString('en-IN')}</span>
            </div>

            {/* Balance Check */}
            {totalAssets !== totalLiabilitiesAndEquity && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Note: Assets and Liabilities+Equity don't balance. Please review the data.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Assets Side */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900">ASSETS</h3>
            <p className="text-sm text-blue-700">As of {new Date(asOfDate).toLocaleDateString('en-IN')}</p>
          </div>

          <div className="p-6">
            {/* Current Assets */}
            <div className="mb-6">
              <div className="py-2 mb-3 border-b-2 border-blue-900">
                <span className="font-bold text-gray-900">Current Assets</span>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Cash & Bank</span>
                  <span className="font-medium text-gray-900">₹{(data?.cash || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Accounts Receivable</span>
                  <span className="font-medium text-gray-900">₹{(data?.accountsReceivable || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Inventory</span>
                  <span className="font-medium text-gray-900">₹{(data?.inventory || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-300 bg-blue-50 px-4 rounded">
                <span className="font-semibold text-gray-900">Total Current Assets</span>
                <span className="font-bold text-blue-600">₹{(data?.currentAssets || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Fixed Assets */}
            <div className="mb-6">
              <div className="py-2 mb-3 border-b-2 border-blue-900">
                <span className="font-bold text-gray-900">Fixed Assets</span>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Property & Equipment</span>
                  <span className="font-medium text-gray-900">₹{(data?.propertyEquipment || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Less: Depreciation</span>
                  <span className="font-medium text-red-600">(₹{(data?.depreciation || 0).toLocaleString('en-IN')})</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-300 bg-blue-50 px-4 rounded">
                <span className="font-semibold text-gray-900">Total Fixed Assets</span>
                <span className="font-bold text-blue-600">₹{(data?.fixedAssets || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Assets */}
            <div className="flex justify-between items-center py-4 px-4 bg-blue-100 rounded-lg border-2 border-blue-600">
              <span className="text-xl font-bold text-blue-900">TOTAL ASSETS</span>
              <span className="text-xl font-bold text-blue-900">₹{totalAssets.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default BalanceSheet;