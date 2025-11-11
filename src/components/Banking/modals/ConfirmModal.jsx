import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'red', loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              confirmColor === 'red' ? 'bg-red-100' : 
              confirmColor === 'yellow' ? 'bg-yellow-100' : 
              'bg-blue-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                confirmColor === 'red' ? 'text-red-600' :
                confirmColor === 'yellow' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title || 'Confirm Action'}
              </h3>
              <p className="text-sm text-gray-600">
                {message || 'Are you sure you want to proceed?'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700' :
                confirmColor === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' :
                confirmColor === 'green' ? 'bg-green-600 hover:bg-green-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;