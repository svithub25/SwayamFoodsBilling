import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const PinModal = ({ isOpen, onClose, onVerify }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await window.electronAPI.verifyPin(pin);
    if (isValid) {
      onVerify();
      onClose();
      setPin('');
      setError('');
    } else {
      setError('Invalid PIN');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <Lock className="w-6 h-6 text-red-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Enter PIN</h2>
        </div>
        <p className="text-gray-600 mb-4">This module is protected. Please enter your PIN to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            placeholder="Enter 4-digit PIN"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            maxLength="4"
          />
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
