import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const ChequeStatusModal = ({ isOpen, onClose, transaction, onStatusUpdate }) => {
  const [action, setAction] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [depositBank, setDepositBank] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!action) {
      toast.error('Please select an action');
      return;
    }

    if (action === 'bounce' && !reason.trim()) {
      toast.error('Please provide bounce reason');
      return;
    }

    if (action === 'cancel' && !reason.trim()) {
      toast.error('Please provide cancellation reason');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      switch (action) {
        case 'deposit':
          result = await window.electronAPI.depositCheque({
            transactionId: transaction.id,
            depositDate: date,
            depositBank: depositBank
          });
          toast.success('Cheque deposited successfully');
          break;
          
        case 'clear':
          result = await window.electronAPI.clearCheque({
            transactionId: transaction.id,
            clearedDate: date
          });
          toast.success('Cheque cleared successfully');
          break;
          
        case 'bounce':
          result = await window.electronAPI.bounceCheque({
            transactionId: transaction.id,
            bounceDate: date,
            bounceReason: reason
          });
          toast.warning('Cheque marked as bounced');
          break;
          
        case 'cancel':
          result = await window.electronAPI.cancelCheque({
            transactionId: transaction.id,
            cancelReason: reason
          });
          toast.info('Cheque cancelled');
          break;
      }

      if (result.success) {
        onStatusUpdate();
        onClose();
        setAction('');
        setReason('');
        setDepositBank('');
      }
    } catch (error) {
      console.error('Error updating cheque status:', error);
      toast.error('Failed to update cheque status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Update Cheque Status</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Voucher No:</span>
              <span className="text-sm font-medium">{transaction?.voucher_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cheque No:</span>
              <span className="text-sm font-medium">{transaction?.cheque_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-medium">₹{transaction?.amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Party:</span>
              <span className="text-sm font-medium">{transaction?.party_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Transaction Status:</span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                transaction?.cleared_status === 'Cleared' ? 'bg-green-100 text-green-800' :
                transaction?.cleared_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                transaction?.cleared_status === 'Bounced' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {transaction?.cleared_status}
              </span>
            </div>
            {transaction?.pdc_status && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">PDC Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  transaction?.pdc_status === 'Deposited' ? 'bg-blue-100 text-blue-800' :
                  transaction?.pdc_status === 'Cleared' ? 'bg-green-100 text-green-800' :
                  transaction?.pdc_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {transaction?.pdc_status}
                </span>
              </div>
            )}
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Action <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {transaction?.cleared_status === 'Pending' && (
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="action"
                    value="deposit"
                    checked={action === 'deposit'}
                    onChange={(e) => setAction(e.target.value)}
                    className="mr-3"
                  />
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Deposit Cheque</span>
                </label>
              )}
              
              {(transaction?.cleared_status === 'Pending' || transaction?.cleared_status === 'Deposited') && (
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="action"
                    value="clear"
                    checked={action === 'clear'}
                    onChange={(e) => setAction(e.target.value)}
                    className="mr-3"
                  />
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium">Clear Cheque</span>
                </label>
              )}
              
              {transaction?.cleared_status !== 'Bounced' && transaction?.cleared_status !== 'Cancelled' && (
                <>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="bounce"
                      checked={action === 'bounce'}
                      onChange={(e) => setAction(e.target.value)}
                      className="mr-3"
                    />
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium">Bounce Cheque</span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="cancel"
                      checked={action === 'cancel'}
                      onChange={(e) => setAction(e.target.value)}
                      className="mr-3"
                    />
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium">Cancel Cheque</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {action === 'deposit' ? 'Deposit' : action === 'clear' ? 'Cleared' : action === 'bounce' ? 'Bounce' : 'Cancellation'} Date
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Deposit Bank (only for deposit action) */}
          {action === 'deposit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Bank
              </label>
              <input
                type="text"
                value={depositBank}
                onChange={(e) => setDepositBank(e.target.value)}
                placeholder="Enter bank name where deposited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Reason (for bounce/cancel) */}
          {(action === 'bounce' || action === 'cancel') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter ${action === 'bounce' ? 'bounce' : 'cancellation'} reason...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !action}
              className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                action === 'clear' || action === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                action === 'bounce' ? 'bg-red-600 hover:bg-red-700' :
                action === 'cancel' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChequeStatusModal;