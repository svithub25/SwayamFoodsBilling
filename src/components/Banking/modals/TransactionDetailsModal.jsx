import React from 'react';
import { X, FileText, Calendar, CreditCard, Building2, TrendingDown, TrendingUp } from 'lucide-react';

function TransactionDetailsModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Voucher Number</p>
                <p className="text-2xl font-bold text-gray-900">{transaction.voucher_number || 'N/A'}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full
                ${transaction.voucher_type === 'Payment' ? 'bg-red-100 text-red-800' : ''}
                ${transaction.voucher_type === 'Receipt' ? 'bg-green-100 text-green-800' : ''}
                ${transaction.voucher_type === 'Contra' ? 'bg-blue-100 text-blue-800' : ''}
              `}>
                {transaction.voucher_type || 'N/A'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">
                  {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <div className="flex items-center">
                  {transaction.transaction_type === 'Debit' ? (
                    <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  )}
                  <div>
                    <p className={`text-2xl font-bold ${transaction.transaction_type === 'Debit' ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{transaction.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.transaction_type === 'Debit' ? 'Money OUT (Debit)' : 'Money IN (Credit)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Building2 className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="font-semibold text-gray-900">Bank Account</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-medium text-gray-900">{transaction.account_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank:</span>
                <span className="font-medium text-gray-900">{transaction.bank_name || 'N/A'}</span>
              </div>
              {transaction.account_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-medium text-gray-900">{transaction.account_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Party/Category Details */}
          {transaction.party_name && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Party Details</h4>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Party Name:</span>
                  <span className="font-medium text-gray-900">{transaction.party_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="font-semibold text-gray-900">Payment Details</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Mode:</span>
                <span className="font-medium text-gray-900">{transaction.payment_mode || 'N/A'}</span>
              </div>
              {transaction.cheque_number && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cheque Number:</span>
                    <span className="font-medium text-gray-900">{transaction.cheque_number}</span>
                  </div>
                  {transaction.cheque_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cheque Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(transaction.cheque_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </>
              )}
              {transaction.reference_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference Number:</span>
                  <span className="font-medium text-gray-900">{transaction.reference_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full
                  ${transaction.cleared_status === 'Cleared' ? 'bg-green-100 text-green-800' : ''}
                  ${transaction.cleared_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${transaction.cleared_status === 'Deposited' ? 'bg-blue-100 text-blue-800' : ''}
                  ${transaction.cleared_status === 'Bounced' ? 'bg-red-100 text-red-800' : ''}
                  ${transaction.cleared_status === 'Cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {transaction.cleared_status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Narration */}
          {transaction.narration && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Narration</h4>
              <p className="text-sm text-gray-700">{transaction.narration}</p>
            </div>
          )}

          {/* Ledger Entries */}
          {/* {transaction.ledgerEntries && transaction.ledgerEntries.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Ledger Entries (Double Entry Bookkeeping)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ledger</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                        <div className="text-xs text-gray-400 font-normal normal-case">(Asset/Expense ↑)</div>
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                        <div className="text-xs text-gray-400 font-normal normal-case">(Liability/Income ↑)</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transaction.ledgerEntries.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <div className="font-medium">{entry.ledger_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{entry.ledger_type}</div>
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                          {entry.debit_amount > 0 ? (
                            <span className="text-gray-900">
                              ₹{entry.debit_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                          {entry.credit_amount > 0 ? (
                            <span className="text-gray-900">
                              ₹{entry.credit_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-2 text-sm font-semibold text-right text-gray-900">
                        ₹{transaction.ledgerEntries.reduce((sum, e) => sum + (e.debit_amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold text-right text-gray-900">
                        ₹{transaction.ledgerEntries.reduce((sum, e) => sum + (e.credit_amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> In double-entry bookkeeping, every transaction affects at least two accounts. 
                  The total debits must always equal the total credits.
                </p>
              </div>
            </div>
          )} */}

          {/* PDC Info */}
          {transaction.pdcInfo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-yellow-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Post Dated Cheque (PDC)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full
                    ${transaction.pdcInfo.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${transaction.pdcInfo.status === 'Cleared' ? 'bg-green-100 text-green-800' : ''}
                    ${transaction.pdcInfo.status === 'Bounced' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {transaction.pdcInfo.status}
                  </span>
                </div>
                {transaction.pdcInfo.deposit_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(transaction.pdcInfo.deposit_date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contra Transfer Info */}
          {transaction?.voucher_type === 'Contra' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2" />
                Bank Transfer Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-gray-600 text-xs mb-1">From Account (Money OUT)</p>
                  <p className="font-medium text-red-700">{transaction.account_name}</p>
                  <p className="text-gray-500 text-xs">{transaction.bank_name}</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-gray-600 text-xs mb-1">To Account (Money IN)</p>
                  <p className="font-medium text-green-700">{transaction.party_name?.replace('Transfer to ', '')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Transaction Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {transaction.created_by && (
                <div>
                  <p className="text-gray-600">Created By:</p>
                  <p className="font-medium text-gray-900">{transaction.created_by}</p>
                </div>
              )}
              {transaction.created_at && (
                <div>
                  <p className="text-gray-600">Created At:</p>
                  <p className="font-medium text-gray-900">
                    {new Date(transaction.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {transaction.reconciled && (
                <>
                  <div>
                    <p className="text-gray-600">Reconciled:</p>
                    <p className="font-medium text-green-600">Yes</p>
                  </div>
                  {transaction.reconciled_date && (
                    <div>
                      <p className="text-gray-600">Reconciled Date:</p>
                      <p className="font-medium text-gray-900">
                        {new Date(transaction.reconciled_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;