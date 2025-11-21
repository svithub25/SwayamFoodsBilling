import React from 'react';

const SupplierFormModal = ({
  isOpen,
  isEditing,
  supplierForm,
  supplierErrors,
  setSupplierForm,
  setSupplierErrors,
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
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h2>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={supplierForm.name}
              onChange={(e) => {
                setSupplierForm({ ...supplierForm, name: e.target.value });
                if (supplierErrors.name) setSupplierErrors({ ...supplierErrors, name: undefined });
              }}
              className={getFieldClass(supplierErrors.name)}
            />
            {supplierErrors.name && <p className="text-red-600 text-xs mt-1">{supplierErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
            <input
              type="text"
              value={supplierForm.contact}
              onChange={(e) => {
                setSupplierForm({ ...supplierForm, contact: e.target.value });
                if (supplierErrors.contact) setSupplierErrors({ ...supplierErrors, contact: undefined });
              }}
              className={getFieldClass(supplierErrors.contact)}
            />
            {supplierErrors.contact && (
              <p className="text-red-600 text-xs mt-1">{supplierErrors.contact}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
            <input
              type="text"
              value={supplierForm.gstin}
              onChange={(e) => {
                setSupplierForm({ ...supplierForm, gstin: e.target.value });
                if (supplierErrors.gstin) setSupplierErrors({ ...supplierErrors, gstin: undefined });
              }}
              className={getFieldClass(supplierErrors.gstin)}
            />
            {supplierErrors.gstin && (
              <p className="text-red-600 text-xs mt-1">{supplierErrors.gstin}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {isEditing ? 'Update' : 'Add'} Supplier
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

export default SupplierFormModal;

