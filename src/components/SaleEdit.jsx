import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, DollarSign, FileText, Phone, MapPin, Plus, Trash2, Save, Lock, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';

// --- PIN Modal (same as in Backup.jsx) ---
import PinProtected from './reusables/PinProtected';

// --- End PIN Modal ---

const ConfirmModal = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">Confirm Update</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3"> 
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onConfirm}
          >
            Yes, Update
          </button>
        </div>
      </div>
    </div>
  );
};

const SaleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // --- Salesmen state ---
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState('');

  // Editable fields
  const [form, setForm] = useState({
    bill_number: '',
    customer_name: '',
    customer_contact: '',
    customer_address: '',
    customer_gstin: '',
    sale_date: '',
    discount: 0,
    items: []
  });

  // --- New states for salesman/customer logic ---
  const [isSalesmanCustomer, setIsSalesmanCustomer] = useState(false);
  const [isOthers, setIsOthers] = useState(false);

  useEffect(() => {
    loadSaleDetails();
    window.electronAPI.getInventory().then(setItems);
    // Load salesmen
    window.electronAPI.getSalesmen().then(list => setSalesmen(list));
    // eslint-disable-next-line
  }, [id]);

  const loadSaleDetails = async () => { 
  setLoading(true);
  try {
    const result = await window.electronAPI.getSaleDetails(parseInt(id));
    console.log('Fetched sale details:', result);  
    setSale(result); 
    setForm({
      bill_number: result.bill_number,
      customer_name: result.customer_name || '',
      customer_contact: result.customer_contact || '',
      customer_address: result.customer_address || '',
      customer_gstin: result.customer_gstin || '',
      sale_date: result.sale_date,
      discount: result.discount || 0,
      items: result.items.map(item => ({
        id: item.item_id,
        name: item.item_name,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit_price: item.unit_price, // Keep the actual saved price
        total_price: item.total_price,
        // Store the original rates for reset functionality
        original_customer_rate: item.customer_rate,
        original_salesman_rate: item.salesman_rate,
        // Store the actual saved price as well
        saved_unit_price: item.unit_price
      }))
    });
    setSelectedSalesman(result.salesman_id || '');

    // Reflect sale_type in checkboxes
    setIsSalesmanCustomer(result.sale_type === 'salesman');
    setIsOthers(result.sale_type === 'others');
  } catch (error) {
    toast.error('Error loading sale details');
  } finally {
    setLoading(false);
  }
};

  // Item dropdown logic (for adding new items)
  const [itemSearch, setItemSearch] = useState(''); 
  const [showItemList, setShowItemList] = useState(false);
  const [itemDropdownIndex, setItemDropdownIndex] = useState(0);
  const itemInputRef = useRef();
 
  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (i.sku && i.sku.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const handleItemInputKeyDown = (e) => {
    if (showItemList && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        setItemDropdownIndex(idx => (idx + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        setItemDropdownIndex(idx => (idx - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        addItemToSale(filteredItems[itemDropdownIndex]);
      }
    }
  };

  const addItemToSale = (item) => {
    if (!item) return;
    if (form.items.some(i => i.id === item.id)) {
      toast.warn('Item already in sale');
      setShowItemList(false);
      setItemSearch('');
      return;
    }
    // Determine rate based on checkbox logic
    let rate = item.customer_rate;
    if (isOthers || isSalesmanCustomer) {
      rate = item.salesman_rate;
    }
    setForm(f => ({
      ...f,
      items: [
        ...f.items,
        {
          id: item.id,
          name: item.name,
          hsn_code: item.hsn_code,
          quantity: '',
          unit_price: rate,
          total_price: 0,
          original_customer_rate: item.customer_rate,
          original_salesman_rate: item.salesman_rate
        }
      ]
    }));
    setShowItemList(false);
    setItemSearch('');
    setItemDropdownIndex(0);
    setTimeout(() => {
      document.getElementById(`qty-input-${form.items.length}`)?.focus();
    }, 0);
  };

  const updateSaleItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx][field] = value;
      
      // Recalculate total_price when quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(items[idx].quantity) || 0;
        const rate = parseFloat(items[idx].unit_price) || 0;
        items[idx].total_price = qty * rate;
      }
      
      return { ...f, items };
    });
  };

  const removeSaleItem = (idx) => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
  };

  // Reset price to original rate based on sale type
  const resetPriceToOriginal = (idx) => {
    setForm(f => {
      const items = [...f.items];
      const item = items[idx];
      
      // Determine which rate to use based on current sale type
      let originalRate;
      if (isOthers || isSalesmanCustomer) {
        originalRate = item.original_salesman_rate;
      } else {
        originalRate = item.original_customer_rate;
      }
      
      if (originalRate) {
        items[idx].unit_price = originalRate;
        items[idx].total_price = (parseFloat(items[idx].quantity) || 0) * originalRate;
        toast.success(`Price reset to original ${isOthers || isSalesmanCustomer ? 'salesman' : 'customer'} rate`);
      } else {
        toast.error('Original rate not found');
      }
      
      return { ...f, items };
    });
  };

  // Calculate subtotal
  const getSubtotal = () =>
    form.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);

  // Calculate discount amount
  const getDiscountAmount = () => (getSubtotal() * (parseFloat(form.discount) || 0)) / 100;

  // Calculate final amount before rounding
  const getAmountBeforeRounding = () => getSubtotal() - getDiscountAmount();

  // Rounding off
  const getRoundingOff = () => +(Math.round(getAmountBeforeRounding()) - getAmountBeforeRounding()).toFixed(2);

  // Final total
  const getFinalAmount = () => Math.round(getAmountBeforeRounding());

  // --- Update item rate logic when checkboxes change ---
  useEffect(() => {
    // Only update rates if the sale has been loaded and user is actively changing checkboxes
    if (!sale) return; 
    
    setForm(f => ({
      ...f,
      items: f.items.map(item => {
        // Check if the current unit_price matches any of the original rates
        const isUsingOriginalCustomerRate = item.unit_price === item.original_customer_rate;
        const isUsingOriginalSalesmanRate = item.unit_price === item.original_salesman_rate;
        
        // Only change the rate if it's currently using one of the original rates
        // This preserves custom/edited prices
        if (isUsingOriginalCustomerRate || isUsingOriginalSalesmanRate) {
          const rate = isOthers || isSalesmanCustomer 
            ? item.original_salesman_rate 
            : item.original_customer_rate;
          
          return { 
            ...item, 
            unit_price: rate || item.unit_price, 
            total_price: (parseFloat(item.quantity) || 0) * (rate || item.unit_price)
          };
        }
        
        // Keep the current custom price if it doesn't match original rates
        return item;
      })
    }));
  }, [isSalesmanCustomer, isOthers, sale]); // Add 'sale' as dependency

  // --- Auto-select salesman to SELF when Others is checked ---
  useEffect(() => {
    if (isOthers) {
      const selfSalesman = salesmen.find(s => s.name?.toLowerCase() === 'self');
      if (selfSalesman) setSelectedSalesman(selfSalesman.id);
      setIsSalesmanCustomer(false);
    }
  }, [isOthers, salesmen]);

  const handleSave = async () => {
    // Validate
    if (!form.bill_number || !form.sale_date || form.items.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    const validItems = form.items.filter(
      item =>
        item.id &&
        item.name &&
        item.quantity &&
        item.unit_price &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unit_price) > 0
    );
    if (validItems.length === 0) {
      toast.error('Please enter at least one valid item');
      return;
    }
 
    // --- STOCK VALIDATION ---
    for (const item of validItems) {
      const stockItem = items.find(i => i.id === item.id);
      // Find the original quantity from the loaded sale
      const originalSaleItem = sale?.items?.find(si => si.item_id === item.id);
      const originalQty = originalSaleItem ? parseInt(originalSaleItem.quantity) : 0;
      const maxAllowedQty = (stockItem?.current_stock || 0) + originalQty;

      if (parseInt(item.quantity) > maxAllowedQty) {
        toast.error(
          `Insufficient stock for ${item.name}. Available for sale: ${maxAllowedQty} (Current stock: ${stockItem?.current_stock || 0}, Previously sold: ${originalQty})`
        );
        return;
      } 
    }
    // --- END STOCK VALIDATION ---

    try {
      await window.electronAPI.updateSale(parseInt(id), {
        ...form, 
        items: form.items,
        total_amount: getFinalAmount(),
        rounding_off: getRoundingOff(),
        salesman_id: selectedSalesman || null,
        sale_type: isOthers ? 'others' : (isSalesmanCustomer ? 'salesman' : 'customer') 
      });
      toast.success('Sale updated successfully!');
      navigate('/sales-history');
    } catch (error) {
      toast.error('Error updating sale');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading sale details...</div>
      </div>
    );
  }

  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename='Sales Edit'>
      <div className="p-6">
        <ConfirmModal
          open={confirmOpen}
          message="Do you want to save this sale? This will affect the current inventory and can affect past reports."
          onConfirm={() => {
            setConfirmOpen(false);
            handleSave();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/sales-history')}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Sales
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Sale</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
              <input
                type="text"
                value={form.bill_number}
                onChange={e => setForm(f => ({ ...f, bill_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.sale_date}
                onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <input
                type="text"
                value={form.customer_contact}
                onChange={e => setForm(f => ({ ...f, customer_contact: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.customer_address}
                onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.customer_gstin}
                onChange={e => setForm(f => ({ ...f, customer_gstin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {/* Salesman Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesman</label>
              <select
                value={selectedSalesman}
                onChange={e => setSelectedSalesman(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isOthers}
              >
                <option value="">Select Salesman</option>
                {salesmen.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {/* --- UI for checkboxes --- */}
            <div className="flex items-center mt-2 space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isSalesmanCustomer}
                  onChange={e => setIsSalesmanCustomer(e.target.checked)}
                  id="isSalesmanCustomer"
                  className="mr-2 w-5 h-5 accent-blue-600"
                  disabled={isOthers}
                />
                <label htmlFor="isSalesmanCustomer" className="text-sm font-medium text-gray-700">
                  Is Salesman
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isOthers}
                  onChange={e => setIsOthers(e.target.checked)}
                  id="isOthers"
                  className="mr-2 w-5 h-5 accent-blue-600"
                />
                <label htmlFor="isOthers" className="text-sm font-medium text-gray-700">
                  Others
                </label>
              </div>
            </div>
          </div>

          {/* Item Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Item</label>
            <div className="relative">
              <input
                ref={itemInputRef}
                type="text"
                value={itemSearch}
                onChange={e => {
                  setItemSearch(e.target.value);
                  setShowItemList(true);
                  setItemDropdownIndex(0);
                }}
                onFocus={() => setShowItemList(true)}
                onBlur={() => setTimeout(() => setShowItemList(false), 100)}
                onKeyDown={handleItemInputKeyDown}
                placeholder="Type to search item"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                autoComplete="off"
              />
              {showItemList && filteredItems.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto w-full mt-1">
                  {filteredItems.map((itm, idx) => (
                    <li
                      key={itm.id}
                      className={`px-3 py-2 cursor-pointer ${idx === itemDropdownIndex ? 'bg-blue-100' : ''}`}
                      onMouseDown={() => addItemToSale(itm)}
                      tabIndex={-1}
                    >
                      {itm.name} 
                      <span className="text-xs text-gray-500 ml-2">
                        (Customer: ₹{itm.customer_rate}, Salesman: ₹{itm.salesman_rate})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">HSN Code</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => {
                  return (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.hsn_code || 'N/A'}</td>
                      <td className="px-4 py-2">
                        <input
                          id={`qty-input-${idx}`}
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={item.quantity}
                          min={1}
                          onChange={e => updateSaleItem(idx, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            onWheel={e => e.target.blur()}
                            value={item.unit_price}
                            min={0}
                            onChange={e => updateSaleItem(idx, 'unit_price', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="₹0.00"
                          />
                          <button
                            onClick={() => resetPriceToOriginal(idx)}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                            title={`Reset to original ${isOthers || isSalesmanCustomer ? 'salesman' : 'customer'} rate`}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Customer: ₹{item.original_customer_rate || 0} | Salesman: ₹{item.original_salesman_rate || 0}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-semibold">₹{item.total_price?.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => removeSaleItem(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Discount and Totals */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 gap-4">
            <div className="flex flex-col items-end space-y-1 order-1 md:order-2 w-full md:w-auto">
              <div className="flex justify-between w-full md:w-auto">
                <span className="font-medium text-gray-700 mr-2">Subtotal:</span>
                <span>₹{getSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-full md:w-auto">
                <span className="font-medium text-gray-700 mr-2">Discount (%):</span>
                <input
                  type="number"
                  onWheel={e => e.target.blur()}
                  value={form.discount}
                  min={0}
                  max={100}
                  onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-between w-full md:w-auto">
                <span className="font-medium text-gray-700 mr-2">Amount Before Rounding:</span>
                <span>₹{getAmountBeforeRounding().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full md:w-auto">
                <span className="font-medium text-gray-700 mr-2">Rounding Off:</span>
                <span>{getRoundingOff() > 0 ? '+' : '-'}₹{Math.abs(getRoundingOff()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full md:w-auto text-lg font-semibold border-t border-gray-200 pt-2">
                <span>Final Amount:</span>
                <span>₹{getFinalAmount().toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors order-2 md:order-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Update Sale
            </button>
          </div>
        </div>
      </div>
    </PinProtected>
  ); 
};

export default SaleEdit;