import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  FileText,
  ArrowLeft,
  RefreshCw,
  Lock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Invoice from './Invoice'; // Make sure the path is correct
import { useHotkeys } from "react-hotkeys-hook";

import PinProtected from './reusables/PinProtected';
// --- PIN Modal (reuse from Purchase.jsx or define here) ---


const PurchaseOrder = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDropdown, setSearchDropdown] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const qtyInputRefs = useRef({});
  const searchInputRef = useRef();
  const invoiceRef = useRef();

  // --- Module protection state ---



  // Hotkeys for fast navigation
  useHotkeys('ctrl+k', (e) => { e.preventDefault(); searchInputRef.current?.focus(); }, { enableOnTags: ['INPUT'] });

  useEffect(() => {

    loadData();

  }, []);

  const loadData = async () => {
    try {
      const [itemsData, suppliersData] = await Promise.all([
        window.electronAPI?.getInventory() || [],
        window.electronAPI?.getSuppliers() || []
      ]);
      setItems(itemsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Module protection handlers ---

  // Filtered items for dropdown
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard navigation for item search
  const handleSearchKeyDown = (e) => {
    if (filteredItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      setSearchIndex(i => (i + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      setSearchIndex(i => (i - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      addToOrder(filteredItems[searchIndex]);
      setSearchTerm('');
      setSearchDropdown(false);
      setSearchIndex(0);
    }
  };

  // Add to order with empty quantity, focus quantity input
  const addToOrder = (item) => {
    const existingIndex = orderItems.findIndex(orderItem => orderItem.id === item.id);
    if (existingIndex !== -1) {
      setOrderItems(orderItems.map((orderItem, idx) =>
        orderItem.id === item.id
          ? { ...orderItem, requested_quantity: '' }
          : orderItem
      ));
      setTimeout(() => {
        qtyInputRefs.current[item.id]?.focus();
      }, 0);
    } else {
      setOrderItems(prevOrder => {
        const newOrder = [
          ...prevOrder,
          {
            ...item,
            requested_quantity: ''
          }
        ];
        setTimeout(() => {
          qtyInputRefs.current[item.id]?.focus();
        }, 0);
        return newOrder;
      });
    }
  };

  // Quantity input keyboard controls
  const handleQtyKeyDown = (e, idx, itemId) => {
    if (e.key === 'Delete') {
      removeFromOrder(itemId);
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  const calculateItemTotal = (item) => {
    const qty = Number(item.requested_quantity) || 0;
    const baseAmount = item.purchase_rate * qty;
    const gstAmount = baseAmount * (item.gst_percentage / 100);
    return baseAmount + gstAmount;
  };

  const getOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // NEW PDF GENERATOR USING INVOICE COMPONENT
  const handleDownloadPDF = async () => {
    if (!selectedSupplier) return;
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    console.log(orderItems)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Shiva_Purchase_order_${Date.now()}.pdf`);
  };

  // --- Module protection UI ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Prepare invoice props
  const selectedSupplierData = suppliers.find(s => s.id == selectedSupplier) || {};
  const invoiceCustomer = {
    name: selectedSupplierData.name || '',
    address: selectedSupplierData.address || '',
    gstin: selectedSupplierData.gstin || ''
  };

  // Map orderItems to invoice items format
  const invoiceItems = orderItems.map(item => ({
    hsn_code: item.hsn_code || '',
    sku: item.sku || '',
    name: item.name,
    quantity: item.requested_quantity,
    unit_price: item.purchase_rate,
    gst_percentage: item.gst_percentage,
    total_price: calculateItemTotal(item)
  }));


  const updateOrderItemQuantity = (itemId, newQuantity) => {
    setOrderItems(orderItems.map(item =>
      item.id === itemId
        ? { ...item, requested_quantity: newQuantity }
        : item
    ));
  };

  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename='Purchase Order'> 
      <div className="space-y-6">
        {/* Hidden Invoice for PDF generation */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={invoiceRef}>
            <Invoice
              billNumber={`PO-${Date.now()}`}
              customer={invoiceCustomer}
              items={invoiceItems}
              discount={0}
              subtotal={getOrderTotal()}
              total={getOrderTotal()}
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/purchase')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
              <p className="text-gray-600">Select items and generate a purchase order for suppliers</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search items by name or SKU... (Ctrl+K to focus, Enter/Tab to add)"
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setSearchDropdown(true);
                    setSearchIndex(0);
                  }}
                  onFocus={() => setSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setSearchDropdown(false), 100)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  tabIndex={0}
                  autoComplete="off"
                />
                {searchDropdown && filteredItems.length > 0 && (
                  <ul className="absolute z-50 bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto w-full mt-1">
                    {filteredItems.map((item, idx) => (
                      <li
                        key={item.id}
                        className={`px-3 py-2 cursor-pointer ${idx === searchIndex ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          addToOrder(item);
                          setSearchTerm('');
                          setSearchDropdown(false);
                          setSearchIndex(0);
                        }}
                        tabIndex={-1}
                      >
                        {item.name} <span className="text-xs text-gray-400">({item.current_stock} {item.unit})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Items Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-600 mb-2">Current Stock: {item.current_stock}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">₹{item.purchase_rate}</span>
                      <span className="text-sm text-gray-600">GST: {item.gst_percentage}%</span>
                    </div>
                    <button
                      onClick={() => addToOrder(item)}
                      className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order</h2>

              {orderItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No items selected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, idx) => (
                    <div key={item.id} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <button
                          onClick={() => removeFromOrder(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">SKU: {item.sku}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            ref={el => qtyInputRefs.current[item.id] = el}
                            type="number"
                            onWheel={e => e.target.blur()}
                            value={item.requested_quantity}
                            min={1}
                            onChange={e => {
                              const val = e.target.value;
                              // Allow empty string for fast typing
                              if (val === '') {
                                updateOrderItemQuantity(item.id, '');
                              } else if (isNaN(Number(val)) || Number(val) <= 0) {
                                removeFromOrder(item.id);
                              } else {
                                updateOrderItemQuantity(item.id, val);
                              }
                            }}
                            onKeyDown={e => handleQtyKeyDown(e, idx, item.id)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            tabIndex={0}
                            autoFocus={item.requested_quantity === ''}
                          />
                          <span className="text-gray-500">/ {item.current_stock} {item.unit}</span>
                        </div>
                        <span className="font-medium">₹{calculateItemTotal(item).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Rate: ₹{item.purchase_rate} + GST ({item.gst_percentage}%)
                      </div>
                    </div>
                  ))}
                  {/* Total */}
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total Amount:</span>
                      <span>₹{getOrderTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Generate Order Button */}
                  <button onClick={handleDownloadPDF} disabled={!selectedSupplier} className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors mt-4">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Purchase Order PDF
                  </button>
                  {!selectedSupplier && (<p className="text-sm text-red-600 text-center">Please select a supplier to generate the order</p>)}
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </PinProtected>);
};

export default PurchaseOrder;