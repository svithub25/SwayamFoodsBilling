import React, { useState } from 'react';
import PinModal from './PinModal';
import { Lock } from 'lucide-react';

/**
 * Usage:
 * <PinProtected>
 *   <YourProtectedComponent />
 * </PinProtected>
 */
const PinProtected = ({ children, message = 'This module is protected and requires PIN verification to access.',modulename = '' }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleUnlock = () => setShowPinModal(true);
  const handlePinVerified = () => setIsUnlocked(true);

  if (!isUnlocked) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
          <Lock className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{modulename} Module Locked</h2>
          <p className="text-gray-600 text-center mb-6">{message}</p>
          <button
            onClick={handleUnlock}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            Unlock {modulename} Module 
          </button>
        </div>
        <PinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onVerify={handlePinVerified}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default PinProtected;
