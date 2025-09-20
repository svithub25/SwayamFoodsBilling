import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, DollarSign, FileText, Phone, MapPin, Plus, Trash2, Save, Lock } from 'lucide-react';
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

  // --- PIN protection state ---



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

  useEffect(() => {
    
      loadSaleDetails();
      window.electronAPI.getInventory().then(setItems);
 
    // eslint-disable-next-line
  }, [id ]);

  const loadSaleDetails = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getSaleDetails(parseInt(id));
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
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      });
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
    i.name.toLowerCase().includes(itemSearch.toLowerCase())
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
    setForm(f => ({
      ...f,
      items: [
        ...f.items,
        {
          id: item.id,
          name: item.name,
          hsn_code: item.hsn_code,
          quantity: '',
          unit_price: '',
          total_price: 0
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
      // Update total_price
      const qty = parseFloat(items[idx].quantity) || 0;
      const rate = parseFloat(items[idx].unit_price) || 0;
      items[idx].total_price = qty * rate;
      return { ...f, items };
    });
  };

  const removeSaleItem = (idx) => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
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
    try {
      await window.electronAPI.updateSale(parseInt(id), {
        ...form,
        items: validItems,
        total_amount: getFinalAmount(),
        rounding_off: getRoundingOff()
      });
      toast.success('Sale updated successfully!');
      navigate('/sales-history');
    } catch (error) {
      toast.error('Error updating sale');
    }
  };

  // --- PIN protection UI ---


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
              {form.items.map((item, idx) => (
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
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={item.unit_price}
                      min={0}
                      step={0.01}
                      onChange={e => updateSaleItem(idx, 'unit_price', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                    />
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
              ))}
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