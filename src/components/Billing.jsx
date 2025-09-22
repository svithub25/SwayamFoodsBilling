import { Download, FileText, Plus,History, Printer, RefreshCw, Save, Search, ShoppingCart, Trash2, User,SendHorizontal } from 'lucide-react';
import { useHotkeys } from "react-hotkeys-hook";
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import BillPDF from './BillPDF';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Billing = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDropdown, setSearchDropdown] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [billNumber, setBillNumber] = useState('');
  const [showItemHistory, setShowItemHistory] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [lastSaleData, setLastSaleData] = useState(null);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState('');
  const [isSalesmanCustomer, setIsSalesmanCustomer] = useState(false);
  const discountInputRef = useRef();
  const qtyInputRefs = useRef({});
  const searchInputRef = useRef();
  const billPdfRef = useRef();

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({ name: '', contact: '', address: '', gstin: '' });

  // Hotkeys
  useHotkeys('ctrl+k', (e) => { e.preventDefault(); searchInputRef.current?.focus(); }, { enableOnTags: ['INPUT'] });
  useHotkeys('ctrl+f', (e) => { e.preventDefault(); discountInputRef.current?.focus(); }, { enableOnTags: ['INPUT'] });
  useHotkeys('ctrl+c', () => completeSale('save'));

  useEffect(() => {
    loadItems();
    generateBillNumber();
  }, []);

  useEffect(() => {
    async function fetchSalesmen() {
      const list = await window.electronAPI.getSalesmen();
      setSalesmen(list);
    }
    fetchSalesmen();
  }, []);

  const loadItems = async () => {
    try {
      const data = await window.electronAPI.getInventory();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBillNumber = async () => {
    try {
      const number = await window.electronAPI.generateBillNumber();
      setBillNumber(number);
    } catch (error) {
      console.error('Error generating bill number:', error);
    }
  };

  // --- Fast item search and add ---
  const filteredItems = items.filter(item =>
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())))
    && item.current_stock > 0
  );

  const handleSearchKeyDown = (e) => {
    if (filteredItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      setSearchIndex(i => (i + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      setSearchIndex(i => (i - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      addToCart(filteredItems[searchIndex]);
      setSearchTerm('');
      setSearchDropdown(false);
      setSearchIndex(0);
    }
  };

  // --- Add to cart with empty quantity ---
  const addToCart = (item) => {
    const rate = isSalesmanCustomer ? item.salesman_rate : item.customer_rate;
    const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    if (existingIndex !== -1) {
      setCart(cart.map((cartItem, idx) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: '', unit_price: rate }
          : cartItem
      ));
      setTimeout(() => {
        qtyInputRefs.current[item.id]?.focus();
      }, 0);
    } else {
      setCart(prevCart => {
        const newCart = [
          ...prevCart,
          {
            id: item.id,
            name: item.name,
            sku: item.sku,
            hsn_code: item.hsn_code,
            unit_price: rate,
            quantity: '', // <-- empty
            current_stock: item.current_stock,
            gst_percentage: item.gst_percentage,
            unit: item.unit
          }
        ];
        setTimeout(() => {
          qtyInputRefs.current[item.id]?.focus();
        }, 0);
        return newCart;
      });
    }
  };

  // --- Cart keyboard controls ---
  const handleCartKeyDown = (e, idx, itemId) => {
    if (e.key === 'Delete') {
      removeFromCart(itemId);
    } else if (e.key === '+' || e.key === '=') {
      updateCartItemQuantity(itemId, (parseInt(cart[idx].quantity) || 0) + 1);
    } else if (e.key === '-' || e.key === '_') {
      updateCartItemQuantity(itemId, (parseInt(cart[idx].quantity) || 0) - 1);
    }
    // Tab or Enter returns focus to search
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    // Ctrl+F focuses discount
    if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      discountInputRef.current?.focus();
    }
    // Ctrl+C saves
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      completeSale('save');
    }
  };

  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (!newQuantity || newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // --- Totals ---
  const calculateItemTotal = (item) => {
    const baseAmount = item.unit_price * item.quantity;
    return { baseAmount, totalAmount: baseAmount };
  };
  const getSubtotal = () => cart.reduce((sum, item) => sum + calculateItemTotal(item).baseAmount, 0);
  const getTotal = () => {
    const subtotal = getSubtotal();
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  // Rounding off calculation
const getRoundingOff = () => {
  const total = getSubtotal();
  const discountAmount = (total * discount) / 100;
  const net = total - discountAmount;
  // Round to nearest integer
  return +(Math.round(net) - net).toFixed(2);
};

const getFinalTotal = () => {
  const total = getSubtotal();
  const discountAmount = (total * discount) / 100;
  const net = total - discountAmount;
  return Math.round(net);
};

  // --- Sale completion ---
  const completeSale = async (action = 'complete') => {
    const filteredCart = cart.filter(item => parseInt(item.quantity) > 0);
    if (filteredCart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    for (const cartItem of filteredCart) {
      if (parseInt(cartItem.quantity) > cartItem.current_stock) {
        toast.error(`Insufficient stock for ${cartItem.name}. Available: ${cartItem.current_stock}`);
        return;
      }
    }
    try {
      // Check and create customer if needed
      if (
        customerInfo.contact &&
        /^\d{10}$/.test(customerInfo.contact.trim())
      ) {
        await window.electronAPI.createCustomerIfNeeded({
          name: customerInfo.name,
          contact: customerInfo.contact,
          address: customerInfo.address,
          gstin: customerInfo.gstin
        });
      }

      const saleItems = filteredCart.map(item => {
        const { baseAmount, totalAmount } = calculateItemTotal({ ...item, quantity: parseInt(item.quantity) });
        return {
          id: item.id,
          quantity: parseInt(item.quantity),
          unit_price: item.unit_price, 
          gst_percentage: item.gst_percentage,
          total_price: totalAmount
        };
      });
      const saleData = {
        bill_number: billNumber,
        customer_name: customerInfo.name || null,
        customer_contact: customerInfo.contact || null,
        customer_address: customerInfo.address || null,
        customer_gstin: customerInfo.gstin || null,
        sale_date: new Date().toISOString().split('T')[0],
        items: saleItems,
        discount,
        total_amount: getFinalTotal(),
        rounding_off: getRoundingOff(),
        salesman_id: selectedSalesman || null
      };
      if (window.electronAPI) {
        await window.electronAPI.saveSale(saleData);
        console.log('saleData:', saleData); 
      }

      // --- PDF GENERATION: Do this BEFORE resetting cart/bill/customer ---
      if (action === 'pdf') {
        try {
          const element = billPdfRef.current;
          // Temporarily render BillPDF with current sale data
          await new Promise(resolve => setTimeout(resolve, 100)); // Ensure DOM updates
          const canvas = await html2canvas(element, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({ 
            orientation: "portrait",
            unit: "mm", 
            format: "a4",
          }); 
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pageWidth;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Invoice_${billNumber}.pdf`);
          toast.success('PDF generated and downloaded!');
        } catch (err) {
          toast.error('Error generating PDF');
        }
      }
      // --- END PDF GENERATION ---

      // Now reset form
      setLastSaleData({
        billNumber,
        customer: customerInfo,
        items: cart.map(item => ({
          hsn_code: item.hsn_code,
          sku: item.sku,
          name: item.name,
          quantity: parseInt(item.quantity) || 0,
          unit_price: item.unit_price
        })),
        discount,
        subtotal: getSubtotal(),
        total: getTotal()
      });
      setCart([]);
      setDiscount(0);
      setCustomerInfo({ name: '', contact: '', address: '', gstin: '' });
      await generateBillNumber();
      await loadItems();
      toast.success('Sale completed successfully!');
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Error completing sale');
    }
  };

  // --- Show purchase history for item ---
  const showPurchaseHistory = async (itemId) => {
    try {
      const history = await window.electronAPI.getItemPurchaseHistory(itemId);
      setItemHistory(history || []);
      setShowItemHistory(itemId);
    } catch (error) {
      setItemHistory([]);
      setShowItemHistory(itemId);
    }
  };

  useEffect(() => {
    setCart(cart =>
      cart.map(cartItem => {
        const item = items.find(i => i.id === cartItem.id);
        if (!item) return cartItem;
        const rate = isSalesmanCustomer ? item.salesman_rate : item.customer_rate;
        return { ...cartItem, unit_price: rate };
      })
    );
    // eslint-disable-next-line
  }, [isSalesmanCustomer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Create invoices and manage billing transactions</p>
        </div>
        <div className="mt-4 sm:mt-0 bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-blue-800">Bill No: {billNumber}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer name"
                  tabIndex={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
               <input
                  type="number"
                  value={customerInfo.contact}
                  onWheel={e => e.target.blur()} 
                  onChange={e => {
                    // Only allow up to 10 digits, remove non-digits
                    let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setCustomerInfo({ ...customerInfo, contact: val });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number"
                  tabIndex={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer address"
                  tabIndex={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={customerInfo.gstin}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="GST number"
                  tabIndex={0}
                />
              </div>
            </div>
            <div className="flex items-center mt-2">
      <input
        type="checkbox"
        checked={isSalesmanCustomer}
        onChange={e => setIsSalesmanCustomer(e.target.checked)}
        id="isSalesmanCustomer"
        className="mr-2"
      />
      <label htmlFor="isSalesmanCustomer" className="text-sm font-medium text-gray-700">
        Is Salesman
      </label>
    </div>
          </div>

          {/* Salesman Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Salesman
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salesman</label>
                <select
                  value={selectedSalesman}
                  onChange={e => setSelectedSalesman(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Salesman</option>
                  {salesmen.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search items... (Ctrl+K to focus, Enter/Tab to add)"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setSearchDropdown(true);
                  setSearchIndex(0);
                }}
                onFocus={() => setSearchDropdown(true)}
                onBlur={() => setTimeout(() => setSearchDropdown(false), 100)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        addToCart(item);
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

          {/* Items Grid (optional, for mouse users) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <button
                      onClick={() => showPurchaseHistory(item.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">SKU: {item.sku}</p>
                  {item.hsn_code && <p className="text-sm text-gray-600 mb-1">HSN: {item.hsn_code}</p>}
                  <p className="text-sm text-gray-600 mb-2">Stock: {item.current_stock} {item.unit}</p>
                  <div className="flex items-center justify-between mb-3"> 
                    <span className="text-lg font-bold text-gray-900">₹{item.mrp}</span>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.current_stock === 0}
                    className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shopping Cart</h2>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => {
                  const { baseAmount, totalAmount } = calculateItemTotal({ ...item, quantity: parseInt(item.quantity) || 0 });
                  return (
                    <div key={item.id} className="border-b border-gray-200 pb-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800"
                          tabIndex={0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="sr-only">Quantity</label>
                        <input
                          ref={el => qtyInputRefs.current[item.id] = el}
                          type="number"
                          onWheel={e => e.target.blur()} 
                          value={item.quantity}
                          min={1}
                          max={item.current_stock}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!val || val <= 0) {
                              removeFromCart(item.id);
                            } else {
                              updateCartItemQuantity(item.id, val);
                            }
                          }}
                          onKeyDown={e => handleCartKeyDown(e, idx, item.id)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                          autoFocus={item.quantity === ''}
                        />
                        <span className="text-gray-500">/ {item.current_stock} {item.unit}</span>
                        <span className="ml-auto font-medium">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Discount */}
                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    ref={discountInputRef}
                    type="number"
                    onWheel={e => e.target.blur()} 
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                        e.preventDefault();
                        completeSale('save');
                      } 
                    }}
                  />
                </div>

                {/* Totals */}
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%):</span>
                      <span>-₹{(getSubtotal() * discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Rounding Off:</span>
                    <span>₹{getRoundingOff() >= 0 ? '+' : ''}{getRoundingOff().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>₹{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => completeSale('complete')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    tabIndex={0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Complete Sale (Ctrl+C)
                  </button>
                  <button
                    onClick={() => completeSale('print')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    tabIndex={0}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Complete & Print
                  </button>
                  <button
                    onClick={() => completeSale('pdf')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    tabIndex={0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Complete & Generate PDF
                  </button>
                  <button
                    onClick={() => completeSale('pdf')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    tabIndex={0}
                  >
                    <SendHorizontal className="w-4 h-4 mr-2" />
                    WhatsApp Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item History Modal */}
      {showItemHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Purchase History</h2>
              <button
                onClick={() => setShowItemHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            {itemHistory.length > 0 ? (
              <div className="space-y-3">
                {itemHistory.map((record, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Supplier:</span> {record.supplier_name}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(record.purchase_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {record.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> ₹{record.unit_price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No purchase history available</p>
            )}
          </div>
        </div>
      )}

      {/* Hidden BillPDF for PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      {/* <div> */}
        <div ref={billPdfRef}>
      <BillPDF
      billNumber={billNumber} 
      customer={customerInfo}
      items={cart.map(item => ({
        hsn_code: item.hsn_code,
        sku: item.sku,
        name: item.name,
        quantity: parseInt(item.quantity) || 0,
        unit_price: item.unit_price 
      }))}
      discount={discount}
      subtotal={getSubtotal()}
      roundingOff={getRoundingOff()}
      total={getFinalTotal()}
    />
        </div>
      </div>
    </div>
  );
};
 
export default Billing;