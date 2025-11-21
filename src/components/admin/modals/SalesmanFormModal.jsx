import React from 'react';

const SalesmanFormModal = ({
  isOpen,
  isEditing,
  salesmanForm,
  salesmanErrors,
  setSalesmanForm,
  setSalesmanErrors,
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
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Salesman' : 'Add New Salesman'}</h2>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={salesmanForm.name}
              onChange={(e) => setSalesmanForm({ ...salesmanForm, name: e.target.value })}
              className={getFieldClass(salesmanErrors.name)}
            />
            {salesmanErrors.name && (
              <p className="text-red-600 text-xs mt-1">{salesmanErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info</label>
            <input
              type="text"
              value={salesmanForm.contact_info}
              onChange={(e) => setSalesmanForm({ ...salesmanForm, contact_info: e.target.value })}
              className={getFieldClass(salesmanErrors.contact_info)}
            />
            {salesmanErrors.contact_info && (
              <p className="text-red-600 text-xs mt-1">{salesmanErrors.contact_info}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={salesmanForm.address}
              onChange={(e) => setSalesmanForm({ ...salesmanForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
            <input
              type="date"
              value={salesmanForm.joining_date}
              onChange={(e) => setSalesmanForm({ ...salesmanForm, joining_date: e.target.value })}
              className={getFieldClass(salesmanErrors.joining_date)}
            />
            {salesmanErrors.joining_date && (
              <p className="text-red-600 text-xs mt-1">{salesmanErrors.joining_date}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {isEditing ? 'Update' : 'Add'} Salesman
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

export default SalesmanFormModal;

