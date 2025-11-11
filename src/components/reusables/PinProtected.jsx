import React, { useState, useEffect, useRef } from 'react';
import PinModal from './PinModal';
import { Lock } from 'lucide-react';

/**
 * Pin-protected wrapper component that requires authentication to access content.
 * The unlock state persists while on the current page (survives refresh).
 * Clears when navigating away to a different page.
 */
const PinProtected = ({ 
  children, 
  message = 'This module is protected and requires PIN verification to access.',
  modulename = 'Protected'
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const hasInitialized = useRef(false);
  
  const storageKey = `pin_unlock_${modulename.toLowerCase().replace(/\s+/g, '_')}`;

  useEffect(() => {
    // Only check storage once on initial mount
    if (!hasInitialized.current) {
      const unlocked = sessionStorage.getItem(storageKey);
      if (unlocked === 'true') {
        setIsUnlocked(true);
      }
      hasInitialized.current = true;
    }

    // Cleanup - runs ONLY when component unmounts (navigate away)
    return () => {
      sessionStorage.removeItem(storageKey);
    };
  }, []); // Empty array means cleanup only runs on unmount

  const handleUnlock = () => setShowPinModal(true);
  
  const handlePinVerified = () => {
    setIsUnlocked(true);
    sessionStorage.setItem(storageKey, 'true');
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
  };

  if (!isUnlocked) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
          <Lock className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{modulename} Module Locked</h2>
          <p className="text-gray-600 text-center mb-6 px-4">{message}</p>
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
          onClose={handlePinModalClose}
          onVerify={handlePinVerified}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default PinProtected;