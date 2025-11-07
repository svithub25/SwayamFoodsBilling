import React from 'react'
import PinProtected from './reusables/PinProtected';

function Banking() {
  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename='Banking'>
      <div>Banking</div>
    </PinProtected>
  )
}

export default Banking