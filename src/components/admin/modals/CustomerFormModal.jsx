import React from 'react';

const CustomerFormModal = ({
  isOpen,
  isEditing,
  customerForm,
  customerErrors,
  setCustomerForm,
  setCustomerErrors,
  onSubmit,
  onClose
}) => {
  if (!isOpen) return null;

  const getFieldClass = (error) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className={getFieldClass(customerErrors.name)}
            />
            {customerErrors.name && (
              <p className="text-red-600 text-xs mt-1">{customerErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
            <input
              type="text"
              value={customerForm.contact}
              onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })}
              className={getFieldClass(customerErrors.contact)}
            />
            {customerErrors.contact && (
              <p className="text-red-600 text-xs mt-1">{customerErrors.contact}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {isEditing ? 'Update' : 'Add'} Customer
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;

