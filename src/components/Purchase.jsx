import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Save, 
  Lock,
  Calendar,       
  Package,
  RefreshCw,
  Eye,
  History,
  Edit3,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';

import PinProtected from './reusables/PinProtected';
import PurchasePDF from './PurchasePDF';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DropdownPortal = ({ children, anchorRef, show }) => {
  const [style, setStyle] = useState({});
  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        left: rect.left,
        top: rect.bottom,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [show, anchorRef]);
  if (!show) return null;
  return ReactDOM.createPortal(
    <div style={style}>{children}</div>,
    document.body
  );
};

const Purchase = () => {

 
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);

const [categories, setCategories] = useState([]);
const [units, setUnits] = useState([]);
const [gstRates, setGstRates] = useState([]);
  
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    discount: 0,
    items: []
  });

  const loadMetaData = async () => {
    const [categoriesData, unitsData, gstRatesData] = await Promise.all([
      window.electronAPI.getCategories(),
      window.electronAPI.getUnits(),
      window.electronAPI.getGstRates()
    ]);
    setCategories(categoriesData);
    setUnits(unitsData);
    setGstRates(gstRatesData);
  };
  // Add these payment handler functions after your state declarations
const handlePurchasePaidChange = async (purchaseId, isPaid) => {
  if (isPaid) {
    // Show payment modal for selecting payment method
    const purchase = purchaseHistory.find(p => p.id === purchaseId);
    setPendingPurchasePayment(purchase);
    setPurchasePaymentForm({
      ...purchasePaymentForm,
      amount: purchase.total_amount,
      paymentDetails: {}
    });
    setShowPurchasePaymentModal(true);
  } else {
    // Show payment history instead of unpaid
    try {
      const history = await window.electronAPI.getPurchasePaymentDetails(purchaseId);
      setPurchasePaymentHistory(history);
      setShowPurchasePaymentHistoryModal(true);
    } catch (error) {
      toast.error('Error loading payment history');
    }
  }
}; 

const handlePurchasePaymentSubmit = async () => {
  try {
    const result = await window.electronAPI.savePurchasePayment({
      purchaseId: pendingPurchasePayment.id,
      paymentMethod: purchasePaymentForm.paymentMethod,
      amount: purchasePaymentForm.amount,
      paymentDate: purchasePaymentForm.paymentDate,
      paymentDetails: purchasePaymentForm.paymentDetails
    });

    if (result.success) {
      setPurchaseHistory(prevHistory => 
        prevHistory.map(purchase => 
          purchase.id === pendingPurchasePayment.id 
            ? { ...purchase, is_paid: 1, payment_method: purchasePaymentForm.paymentMethod } 
            : purchase
        )
      );
      setShowPurchasePaymentModal(false);
      setPendingPurchasePayment(null);
      setPurchasePaymentForm({
        paymentMethod: 'cash',
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentDetails: {}
      });
      toast.success('Payment recorded successfully');
    }
  } catch (error) { 
    console.log(error);
    toast.error('Error recording payment');
  }
};

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    address: ''
  });

  const [showItemHistory, setShowItemHistory] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [supplierDropdownIndex, setSupplierDropdownIndex] = useState(0);
  const supplierInputRef = React.useRef();
  const navigate = useNavigate();

  // For item dropdown search
  const [itemSearch, setItemSearch] = useState({});
  const [showItemList, setShowItemList] = useState({});
  const [itemDropdownIndex, setItemDropdownIndex] = useState({});

  // For item input refs
  const itemInputRefs = React.useRef({});

  // New state for history filters
  const [historyFilters, setHistoryFilters] = useState({
    supplier: '',
    invoice: '',
    date: ''
  });

  // State for delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Add these state variables after your existing state
  const [showPurchasePaymentModal, setShowPurchasePaymentModal] = useState(false);
  const [showPurchasePaymentHistoryModal, setShowPurchasePaymentHistoryModal] = useState(false);
  const [pendingPurchasePayment, setPendingPurchasePayment] = useState(null);
  const [purchasePaymentHistory, setPurchasePaymentHistory] = useState(null);
  const [purchasePaymentForm, setPurchasePaymentForm] = useState({
    paymentMethod: 'cash',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentDetails: {}
  });

  // New states and functions for product form
  const [showProductForm, setShowProductForm] = useState(false);
  const initialProductForm = {
    name: '',
    sku: '',
    hsn_code: '',
    description: '',
    unit: '',
    mrp: '',
    purchase_rate: '',
    sale_rate: '',
    gst_percentage: '',
    category_id: '',
    current_stock: '',
    minimum_stock: 10
  };
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productErrors, setProductErrors] = useState({});

  const validateProductForm = (form) => {
    const errors = {};
    const isEmpty = (v) => v === '' || v === null || v === undefined;
    if (isEmpty(form.name) || String(form.name).trim().length < 2) errors.name = 'Name is required';
    if (isEmpty(form.sku) || String(form.sku).trim().length < 1) errors.sku = 'SKU is required';
    if (isEmpty(form.unit)) errors.unit = 'Unit is required';
    if (isEmpty(form.category_id)) errors.category_id = 'Category is required';
    const mrp = parseFloat(form.mrp);
    if (isNaN(mrp) || mrp <= 0) errors.mrp = 'MRP must be greater than 0';
    const pr = parseFloat(form.purchase_rate);
    if (isNaN(pr) || pr <= 0) errors.purchase_rate = 'Purchase rate must be greater than 0';
    const sr = parseFloat(form.sale_rate);
    if (isNaN(sr) || sr <= 0) errors.sale_rate = 'Sale rate must be greater than 0';
    if (isEmpty(form.gst_percentage) && form.gst_percentage !== 0) errors.gst_percentage = 'GST rate is required';
    return errors;
  };

  const buildProductPayload = (form) => ({
    name: String(form.name).trim(),
    sku: String(form.sku).trim(),
    hsn_code: String(form.hsn_code || '').trim(),
    description: String(form.description || '').trim(),
    unit: String(form.unit),
    mrp: Math.max(0, parseFloat(form.mrp) || 0),
    purchase_rate: Math.max(0, parseFloat(form.purchase_rate) || 0),
    sale_rate: Math.max(0, parseFloat(form.sale_rate) || 0),
    gst_percentage: parseFloat(form.gst_percentage) || 0,
    category_id: parseInt(form.category_id, 10),
    current_stock: Math.max(0, parseInt(form.current_stock, 10) || 0),
    minimum_stock: Math.max(0, parseInt(form.minimum_stock, 10) || 0)
  });

  const handleAddProduct = async () => {
    const errors = validateProductForm(productForm);
    if (Object.keys(errors).length) {
      setProductErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      // Check SKU uniqueness
      const skuExists = await window.electronAPI.checkSkuExists(productForm.sku);
      if (skuExists) {
        setProductErrors({ ...errors, sku: 'SKU already exists' });
        toast.error('SKU already exists');
        return;
      }
      const payload = buildProductPayload(productForm);
      const newProduct = await window.electronAPI.addItem(payload);
      toast.success('Product added successfully');
      setItems([...items, newProduct]);
      setShowProductForm(false);
      setProductForm(initialProductForm);
      setProductErrors({});
    } catch (error) {
      toast.error('Error adding product');
      console.error('Error adding product:', error);
    }
  };

  useEffect(() => {
   
      loadData(); 
      loadMetaData();
    
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersData, itemsData, historyData] = await Promise.all([
        window.electronAPI.getSuppliers(),
        window.electronAPI.getInventory(),
        window.electronAPI.getPurchaseHistory()
      ]);
      
      setSuppliers(suppliersData);
      setItems(itemsData);
      setPurchaseHistory(historyData); 
      console.log(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

const updateOverallDiscount = (newDiscount) => {
  setOverallDiscount(newDiscount);
  
  // Apply to all existing items that haven't been manually changed
  setPurchaseForm(prev => ({
    ...prev,
    items: prev.items.map(item => ({
      ...item,
      discount: newDiscount
    }))
  }));
};
  const addItemToPurchase = () => { 
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { id: '', quantity: '', unit_price: '', total_price: 0, 
      discount: overallDiscount }]
    });
  };

  const updatePurchaseItem = (index, field, value) => {
    const updatedItems = [...purchaseForm.items];
    updatedItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setPurchaseForm({ ...purchaseForm, items: updatedItems });
  };

  const removePurchaseItem = (index) => {
    const updatedItems = purchaseForm.items.filter((_, i) => i !== index);

    // Remove related search/dropdown state for this row
    const newItemSearch = { ...itemSearch };
    const newShowItemList = { ...showItemList };
    const newItemDropdownIndex = { ...itemDropdownIndex };
    delete newItemSearch[index];
    delete newShowItemList[index];
    delete newItemDropdownIndex[index];

    // Shift keys for rows after the deleted one
    const shiftKeys = (obj) => {
      const shifted = {};
      Object.keys(obj).forEach(key => {
        const k = parseInt(key, 10);
        if (k < index) shifted[k] = obj[k];
        else if (k > index) shifted[k - 1] = obj[k];
      });
      return shifted;
    };

    setPurchaseForm({ ...purchaseForm, items: updatedItems });
    setItemSearch(shiftKeys(newItemSearch));
    setShowItemList(shiftKeys(newShowItemList));
    setItemDropdownIndex(shiftKeys(newItemDropdownIndex));
  };

  const addNewSupplier = async () => {
    try {
      const supplier = await window.electronAPI.addSupplier(newSupplier);
      setSuppliers([...suppliers, supplier]);
      setNewSupplier({ name: '', contact: '', address: '' });
      setShowNewSupplierForm(false);
    } catch (error) { 
      console.error('Error adding supplier:', error);
    }
  };

  const savePurchase = async () => {


     const supplierValid = suppliers.some(s => s.id === purchaseForm.supplier_id);
  if (!supplierValid) {
    toast.error('Please select a valid supplier from the dropdown.');
    return;
  }

  // Validate items selection
  const invalidItemIndex = purchaseForm.items.findIndex(item => {
    // Must have a valid item id from dropdown
    return !items.some(i => i.id == item.id);
  });
  if (invalidItemIndex !== -1) {
    toast.error(`Please select a valid item for row ${invalidItemIndex + 1} from the dropdown.`);
    return;
  } 

    if (!purchaseForm.supplier_id  || purchaseForm.items.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    
    // Filter out invalid items
    const validItems = purchaseForm.items.filter(item => {
      const selectedItem = items.find(i => i.id == item.id);
      return (
        selectedItem &&
        selectedItem.name &&
        item.quantity && item.quantity > 0 &&
        item.unit_price && item.unit_price > 0
      );
    });

    if (validItems.length === 0) {
      toast.error('Please enter at least one valid item (with name, quantity, and unit price)');
      return;
    }


    const total_amount = getFinalTotal();
    const rounding_off = getRoundingOff();
 
    const cgst_total = purchaseForm.items.reduce((sum, item) => {
  const selectedItem = items.find(i => i.id == item.id);
  const gstRate = selectedItem?.gst_percentage || 0;
  const baseAmount = item.quantity * item.unit_price;
  const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
  const discountedAmount = baseAmount - itemDiscount;
  return sum + (discountedAmount * gstRate) / 200;
}, 0);

const sgst_total = purchaseForm.items.reduce((sum, item) => {
  const selectedItem = items.find(i => i.id == item.id);
  const gstRate = selectedItem?.gst_percentage || 0;
  const baseAmount = item.quantity * item.unit_price;
  const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
  const discountedAmount = baseAmount - itemDiscount;
  return sum + (discountedAmount * gstRate) / 200;
}, 0);

    // Calculate GST for each valid item
const itemsWithGST = validItems.map(item => {
  const selectedItem = items.find(i => i.id == item.id);
  const baseAmount = item.quantity * item.unit_price;
  const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
  const discountedAmount = baseAmount - itemDiscount;
  const gstRate = selectedItem?.gst_percentage || 0;
  const cgstAmount = (discountedAmount * gstRate) / 200;
  const sgstAmount = (discountedAmount * gstRate) / 200;
  const totalPrice = discountedAmount + cgstAmount + sgstAmount;
  return {
    ...item, 
    gst_percentage: gstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    total_price: totalPrice
  };
});

 

    try {
      await window.electronAPI.savePurchase({
      ...purchaseForm,
      items: itemsWithGST, // each item includes .discount
      total_amount,
      cgst_total,
      sgst_total, 
      rounding_off,
      discount: purchaseForm.discount
    });
 
      // Reset form: clear all except date
      setPurchaseForm({
        supplier_id: '',
        invoice_number: '',
        purchase_date: purchaseForm.purchase_date, // keep the same date
        items: []
      });
      setSupplierSearch('');
      setItemSearch({});
      setShowSupplierList(false);
      setShowItemList({});
      loadData();
      toast.success('Purchase saved successfully!');
    } catch (error) { 
      console.error('Error saving purchase:', error);
      toast.error('Error saving purchase');
    } 
  };
 
  const showPurchaseHistory = async (itemId) => {
    try {
      if (window.electronAPI) {
        const history = await window.electronAPI.getItemPurchaseHistory(itemId);
        setItemHistory(history);
        setShowItemHistory(itemId);
        console.log(history); 
      }
    } catch (error) {
      toast.error('Error loading item history');
    }
  };

  // Filter suppliers based on input
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // Keyboard navigation for supplier dropdown
  const handleSupplierInputKeyDown = (e) => {
    if (showSupplierList && filteredSuppliers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSupplierDropdownIndex((prev) =>
          prev < filteredSuppliers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSupplierDropdownIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuppliers.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredSuppliers[supplierDropdownIndex]) {
          handleSupplierSelect(filteredSuppliers[supplierDropdownIndex]);
          e.preventDefault();
          // Move focus to next field (invoice number)
          document.getElementById('invoice-input')?.focus();
        }
      } else if (e.key === 'Escape') {
        setShowSupplierList(false);
      }
    }
  };

  const handleSupplierSelect = (supplier) => {
    setPurchaseForm({ ...purchaseForm, supplier_id: supplier.id });
    setSupplierSearch(supplier.name);
    setShowSupplierList(false);
    setSupplierDropdownIndex(0);
  };

  // Filter items for a row
const getFilteredItems = (search) =>
  items.filter(i =>
    i.name.toLowerCase().includes((search || '').toLowerCase()) ||
    (i.sku && i.sku.toLowerCase().includes((search || '').toLowerCase()))
  ); 

  // Keyboard navigation for item dropdown
  const handleItemInputKeyDown = (e, rowIdx) => {
    const filtered = getFilteredItems(itemSearch[rowIdx]);
    if (showItemList[rowIdx] && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setItemDropdownIndex(idx => ({
          ...idx,
          [rowIdx]: idx[rowIdx] < filtered.length - 1 ? idx[rowIdx] + 1 : 0
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setItemDropdownIndex(idx => ({
          ...idx,
          [rowIdx]: idx[rowIdx] > 0 ? idx[rowIdx] - 1 : filtered.length - 1
        }));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered[itemDropdownIndex[rowIdx] || 0]) {
          handleItemSelect(filtered[itemDropdownIndex[rowIdx] || 0], rowIdx);
          e.preventDefault();
          // Move focus to quantity input
          document.getElementById(`qty-input-${rowIdx}`)?.focus();
        }
      } else if (e.key === 'Escape') {
        setShowItemList(list => ({ ...list, [rowIdx]: false }));
      }
    }
    // Delete row on Delete key
    if (e.key === 'Delete') {
      removePurchaseItem(rowIdx);
    }
    // Show history on Ctrl+H
    if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
      const itemId = purchaseForm.items[rowIdx]?.id;
      if (itemId) showPurchaseHistory(itemId);
    }
    // Save purchase on Ctrl+C
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      savePurchase();
    }
  };

  const handleItemSelect = (item, rowIdx) => {
    const updatedItems = [...purchaseForm.items];
    updatedItems[rowIdx].id = item.id;
    // Auto-fill unit_price with item's purchase_rate
    updatedItems[rowIdx].unit_price = item.purchase_rate || 0;
    setPurchaseForm({ ...purchaseForm, items: updatedItems });
    setItemSearch(search => ({ ...search, [rowIdx]: item.name }));
    setShowItemList(list => ({ ...list, [rowIdx]: false }));
    setItemDropdownIndex(idx => ({ ...idx, [rowIdx]: 0 }));
  };

  // Save purchase on Ctrl+C anywhere in the form
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        savePurchase();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    // eslint-disable-next-line
  }, [purchaseForm, items]);

  // Filtered and sorted purchase history
  const filteredHistory = purchaseHistory
    .filter(purchase => {
      const supplierMatch = historyFilters.supplier
        ? purchase.supplier_name?.toLowerCase().includes(historyFilters.supplier.toLowerCase())
        : true;
      const invoiceMatch = historyFilters.invoice
        ? purchase.invoice_number?.toLowerCase().includes(historyFilters.invoice.toLowerCase())
        : true;
      const dateMatch = historyFilters.date
        ? new Date(purchase.purchase_date).toLocaleDateString() === new Date(historyFilters.date).toLocaleDateString()
        : true;
      return supplierMatch && invoiceMatch && dateMatch;
    })
    .sort((a, b) => b.id - a.id); // Latest purchase.id first

  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const total = Math.ceil(filteredHistory.length / itemsPerPage);
    setTotalPages(total);
    
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredHistory.length, itemsPerPage, currentPage]);

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [historyFilters.supplier, historyFilters.invoice, historyFilters.date]);

  const handleDeletePurchase = async (purchaseId) => {
    try {
      // 1. Ask Electron for a stock check before deletion
      const check = await window.electronAPI.checkPurchaseDeleteStock(purchaseId);
      if (!check.ok) {
        toast.error(check.message || 'Cannot delete purchase: Inventory will go negative for one or more items.');
        return;
      }
      // 2. Proceed with deletion if stock is safe
      await window.electronAPI.deletePurchase(purchaseId);
      toast.success('Purchase deleted!');
      loadData(); 
    } catch (error) {
    console.log(error);
      toast.error('Error deleting purchase');
    } 
  };

  // --- Subtotal (before any discount) ---
const subtotal = purchaseForm.items.reduce((sum, item) => {
  const baseAmount = item.quantity * item.unit_price;
  return sum + baseAmount;
}, 0);

// --- Total discount amount (sum of all item discounts) ---
const totalDiscountAmount = purchaseForm.items.reduce((sum, item) => {
  const baseAmount = item.quantity * item.unit_price;
  const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
  return sum + itemDiscount;
}, 0);

// --- Subtotal after discount ---
const subtotalAfterDiscount = subtotal - totalDiscountAmount;

// --- CGST/SGST on discounted amount ---
const cgstTotal = purchaseForm.items.reduce((sum, item) => {
  const selectedItem = items.find(i => i.id == item.id);
  const gstRate = selectedItem?.gst_percentage || 0;
  const baseAmount = item.quantity * item.unit_price;
  const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
  const discountedAmount = baseAmount - itemDiscount;
  return sum + (discountedAmount * gstRate) / 200;
}, 0);

const sgstTotal = purchaseForm.items.reduce((sum, item) => {
  const selectedItem = items.find(i => i.id == item.id);
  const gstRate = selectedItem?.gst_percentage || 0;
  const baseAmount = item.quantity * item.unit_price;
  const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
  const discountedAmount = baseAmount - itemDiscount;
  return sum + (discountedAmount * gstRate) / 200;
}, 0);

// --- Total with GST ---
const totalWithGst = subtotalAfterDiscount + cgstTotal + sgstTotal;

// --- Rounding off calculation ---
const getRoundingOff = () => {
  return +(Math.round(totalWithGst) - totalWithGst).toFixed(2);
};
const getFinalTotal = () => Math.round(totalWithGst);
 
 const handleReprintPurchase = async (purchaseId) => {
  try {
    const purchaseDetails = await window.electronAPI.getPurchaseDetails(purchaseId);
    console.log('purchaseDetails:', purchaseDetails);

    const supplier = {
      name: purchaseDetails.purchase.supplier_name || "",
      address: purchaseDetails.purchase.supplier_address || "",
      gstin: purchaseDetails.purchase.supplier_gstin || "",
      contact: purchaseDetails.purchase.supplier_contact || ""
    };

    const items = (purchaseDetails.items || []).map(item => ({
      hsn_code: item.hsn_code || "",
      sku: item.sku || "",
      name: item.item_name || "",
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      gst_percentage: item.gst_percentage || 0,
      total_price: item.total_price || 0
    }));

    const purchaseNumber = purchaseDetails.purchase.id || "";
    const invoiceNumber = purchaseDetails.purchase.invoice_number || "";
    const purchaseDate = purchaseDetails.purchase.purchase_date
      ? new Date(purchaseDetails.purchase.purchase_date).toLocaleDateString()
      : "";
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'fixed';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '210mm';
    pdfContainer.style.zIndex = '-1';
    document.body.appendChild(pdfContainer);

    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(pdfContainer);
      root.render(
        <PurchasePDF
          purchaseNumber={purchaseNumber}
          invoiceNumber={invoiceNumber}
          purchaseDate={purchaseDate}
          supplier={supplier}
          items={items}
          discount={purchaseDetails.purchase.discount || 0}
          subtotal={subtotal}
          roundingOff={purchaseDetails.purchase.rounding_off || 0}
          total={purchaseDetails.purchase.total_amount || subtotal}
        />
      );
      
      setTimeout(async () => {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Find all page divs with proper selector
        const pageElements = pdfContainer.querySelectorAll('#purchase-pdf > div');
        
        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const canvas = await html2canvas(pageElements[i], { 
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            width: 794, // A4 width in pixels at 96 DPI
            height: 1123, // A4 height in pixels at 96 DPI
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          // Add image to fill the entire page
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        pdf.save(`Purchase_${invoiceNumber || purchaseNumber || purchaseId}.pdf`);
        root.unmount();
        document.body.removeChild(pdfContainer);
        toast.success('PDF generated!');
      }, 1000); // Increased timeout to ensure proper rendering
    });
  } catch (error) {
    toast.error('Error generating PDF');
    console.error('PDF generation error:', error);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
 
  return (
     <PinProtected message="This module is protected and requires PIN verification to access." modulename='Purchase'>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Record new purchases and manage supplier information</p>
        </div>
      </div>

      {/* Purchase Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Purchase</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Supplier Dropdown */}
          <div>
          <div className="flex items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">Supplier</label>
        <button
          onClick={() => setShowNewSupplierForm(true)}
          className="ml-2 px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          tabIndex={-1}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
            
            <div className="relative">
              <input
                ref={supplierInputRef}
                type="text" 
        
                value={supplierSearch}
                onChange={e => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierList(true);
                  setSupplierDropdownIndex(0);
                  const match = suppliers.find(s => s.name.toLowerCase() === e.target.value.toLowerCase());
                  setPurchaseForm({ ...purchaseForm, supplier_id: match ? match.id : '' });
                }}
                onFocus={() => setShowSupplierList(true)}
                onBlur={() => setTimeout(() => setShowSupplierList(false), 100)}
                onKeyDown={handleSupplierInputKeyDown}
                placeholder="Type to search supplier"
                className="min-w-[160px] w-full md:w-[220px] px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-base"
                autoComplete="off"
                tabIndex={0} 
              />
              {showSupplierList && filteredSuppliers.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto w-full mt-1">
                  {filteredSuppliers.map((supplier, idx) => (
                    <li
                      key={supplier.id}
                      className={`px-3 py-2 cursor-pointer ${
                        idx === supplierDropdownIndex ? 'bg-blue-100' : ''
                      }`}
                      onMouseDown={() => handleSupplierSelect(supplier)}
                      tabIndex={-1}
                    >
                      {supplier.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          
          </div>
          {/* Invoice Number */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Invoice Number</label>
            <input
              id="invoice-input"
              type="text"
              value={purchaseForm.invoice_number}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter invoice number"
              tabIndex={0}
            />
          </div>
          {/* Purchase Date */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Purchase Date</label>
            <input
              type="date"
              value={purchaseForm.purchase_date}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              tabIndex={0}
            />
          </div>

          
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-medium text-gray-900">Items</h3>
              <button
                onClick={() => setShowProductForm(true)}
                className="px-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Add New Item"
                type="button"
                 tabIndex={-1}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={addItemToPurchase}
              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </button> 
          </div>
          
          
          {purchaseForm.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th> 
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount (%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discounted Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (With GST)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchaseForm.items.map((item, index) => {
                    const selectedItem = items.find(i => i.id == item.id);
                    const MRP = selectedItem?.mrp || 0;
                    const gstRate = selectedItem?.gst_percentage || 0;
                    const baseAmount = item.quantity * item.unit_price;
                    const itemDiscount = item.discount ? (baseAmount * item.discount) / 100 : 0;
                    const discountedAmount = baseAmount - itemDiscount; 
                    const gstAmount = (discountedAmount * gstRate) / 100;
                    const totalWithGst = discountedAmount + gstAmount;
                    console.log({
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      baseAmount,
                      itemDiscount,
                      discountedAmount,
                      gstRate,
                      gstAmount
                    });
                    const filtered = getFilteredItems(itemSearch[index]);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-3"> 
                          <div className="relative">
                            <input
                              ref={el => (itemInputRefs.current[index] = el)}
                              type="text"
                              value={itemSearch[index] || (selectedItem?.name || '')}
                              onChange={e => {
                                const value = e.target.value;
                                setItemSearch(search => ({ ...search, [index]: value }));
                                setShowItemList(list => ({ ...list, [index]: true }));
                                setItemDropdownIndex(idx => ({ ...idx, [index]: 0 }));
                                // Only auto-select if not empty
                                if (value.trim() !== '') {
                                  const match = items.find(i => i.name.toLowerCase() === value.toLowerCase());
                                  if (match) {
                                    const updatedItems = [...purchaseForm.items];
                                    updatedItems[index].id = match.id;
                                    setPurchaseForm({ ...purchaseForm, items: updatedItems });
                                  }
                                } else {
                                  // If input is empty, clear the selected item for this row
                                  const updatedItems = [...purchaseForm.items];
                                  updatedItems[index].id = '';
                                  setPurchaseForm({ ...purchaseForm, items: updatedItems });
                                }
                              }}
                              onFocus={() => setShowItemList(list => ({ ...list, [index]: true }))}
                              onBlur={() => setTimeout(() => setShowItemList(list => ({ ...list, [index]: false })), 100)}
                              onKeyDown={e => {
                                const filtered = getFilteredItems(itemSearch[index]);
                                if ((e.key === 'Enter' || e.key === 'Tab') && filtered.length > 0) {
                                  // Select the first filtered item on Enter/Tab
                                  handleItemSelect(filtered[itemDropdownIndex[index] || 0] || filtered[0], index);
                                  e.preventDefault();
                                  // Move focus to quantity input
                                  document.getElementById(`qty-input-${index}`)?.focus();
                                } else {
                                  handleItemInputKeyDown(e, index);
                                }
                              }}
                              placeholder="Type to search item"
                              className="w-[300px] px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-base"
                              autoComplete="off"
                              tabIndex={0}
                            />
                            <DropdownPortal
                              anchorRef={{ current: itemInputRefs.current[index] }}
                              show={showItemList[index] && filtered.length > 0}
                            >
                              <ul
                                className="bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto w-full"
                                style={{ minWidth: 180, maxHeight: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                              >
                                {filtered.map((itm, idx) => (
                                  <li
                                    key={itm.id}
                                    className={`px-3 py-2 cursor-pointer ${
                                      idx === (itemDropdownIndex[index] || 0) ? 'bg-blue-100' : ''
                                    }`}
                                    onMouseDown={() => handleItemSelect(itm, index)}
                                    tabIndex={-1}
                                  >
                                    {itm.name}
                                  </li>
                                ))}
                              </ul>
                            </DropdownPortal>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.id && (
                            <button
                              type="button"
                              onClick={() => showPurchaseHistory(item.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Show Purchase History (Ctrl+H)"
                              tabIndex={-1}
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            id={`qty-input-${index}`}
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            min="0"  
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Delete') removePurchaseItem(index);
                              if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
                                if (item.id) showPurchaseHistory(item.id);
                              }
                              if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                                savePurchase();
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            min="0"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Delete') removePurchaseItem(index);
                              if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
                                if (item.id) showPurchaseHistory(item.id);
                              }
                              if (e.key === 'Tab' && !e.shiftKey) {
                                // On Tab after unit price, add new item
                                addItemToPurchase();
                              }
                              if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                                savePurchase();
                              }
                            }}
                          />
                        </td>
                         <td className="px-4 py-3 text-center">
                          <span className="font-medium">₹{MRP}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium">{gstRate}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            ₹{baseAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.discount || 0}
                          onChange={e => updatePurchaseItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                          min="0"
                          max="100"
                          placeholder="%" 
                        />
                      </td>
                        <td className="px-4 py-3"> 
                          <span className="font-medium">
                            ₹{discountedAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            ₹{gstAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            ₹{totalWithGst.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removePurchaseItem(index)}
                            className="text-red-600 hover:text-red-800"
                            tabIndex={-1}
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
          )}
        </div>

        {/* Total and Save */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 gap-4">
          <button
            onClick={savePurchase}
            className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors order-2 md:order-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Purchase
          </button>
          <div className="flex flex-col items-end space-y-1 order-1 md:order-2 w-full md:w-auto">
            {/* Subtotal before discount */}
            <div className="flex justify-between w-full md:w-auto">
              <span className="font-medium text-gray-700 mr-2">Subtotal :</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {/* Discount amount */}
           <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
         
         
          <span className="font-medium text-gray-700">Total Discount:</span>
           <input
            type="number"
            value={overallDiscount}
            onChange={(e) => updateOverallDiscount(parseFloat(e.target.value) || 0)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            min="0"
            max="100"
            step="0.01"
            tabIndex={0}
          />
          <span className="text-red-600 font-semibold">- ₹{totalDiscountAmount.toFixed(2)}</span>
        </div>
         
           
            {/* Overall Discount input */}
            <div className="flex justify-between w-full md:w-auto items-center">
              <label className="block text-base font-medium text-gray-700 mb-2">Overall Discount (%)</label>
        
            </div>
            {/* CGST */}
            <div className="flex justify-between w-full md:w-auto">
              <span className="font-medium text-gray-700 mr-2">Total CGST:</span>
              <span>₹{cgstTotal.toFixed(2)}</span>
            </div>
            {/* SGST */}
            <div className="flex justify-between w-full md:w-auto">
              <span className="font-medium text-gray-700 mr-2">Total SGST:</span>
              <span>₹{sgstTotal.toFixed(2)}</span>
            </div>
            {/* Total with GST */}
            <div className="flex justify-between w-full md:w-auto">
              <span className="font-medium text-gray-700 mr-2">Total With GST:</span>
              <span>₹{totalWithGst.toFixed(2)}</span>
            </div>
            {/* Rounding Off */}
            <div className="flex justify-between w-full md:w-auto">
              <span className="font-medium text-gray-700 mr-2">Rounding Off:</span>
              <span>
                {getRoundingOff() > 0 ? '+' : '-'}₹{Math.abs(getRoundingOff()).toFixed(2)}
              </span>
            </div>
            {/* Grand Total */}
            <div className="flex justify-between w-full md:w-auto text-lg font-semibold border-t border-gray-200 pt-2">
              <span>Grand Total:</span>
              <span>₹{getFinalTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    
      {/* Purchase History */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h2>
  
  {/* Filters */}
  <div className="flex flex-col md:flex-row gap-4 mb-4">
    <input
      type="text"
      value={historyFilters.supplier}
      onChange={e => setHistoryFilters(f => ({ ...f, supplier: e.target.value }))}
      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="Filter by supplier"
    />
    <input
      type="text"
      value={historyFilters.invoice}
      onChange={e => setHistoryFilters(f => ({ ...f, invoice: e.target.value }))}
      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="Filter by invoice"
    />
    <input
      type="date"
      value={historyFilters.date}
      onChange={e => setHistoryFilters(f => ({ ...f, date: e.target.value }))}
      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="Filter by date"
    />
  </div>

  {/* Record count display */}
  <div className="flex items-center justify-between mb-4">
    <div className="text-sm text-gray-600">
      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredHistory.length)} of {filteredHistory.length} purchases
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase No.</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {currentPurchases.map((purchase) => (
          <tr key={purchase.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {purchase.id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {new Date(purchase.purchase_date).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {purchase.invoice_number}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {purchase.supplier_name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              ₹{purchase.total_amount.toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={purchase.is_paid === 1}
                  onChange={(e) => handlePurchasePaidChange(purchase.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                {purchase.is_paid === 1 && purchase.payment_method && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {purchase.payment_method.toUpperCase()}
                  </span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => navigate(`/purchase/${purchase.id}`)}
                tabIndex={-1}
                title="View Purchase Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                className="text-red-600 hover:text-red-900"
                onClick={() => navigate(`/purchaseupdate/${purchase.id}`)}
                tabIndex={-1} 
                title="Edit Purchase"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                className="text-black-600 hover:text-black-900"
                onClick={() => {
                  setDeleteId(purchase.id);
                  setConfirmDeleteOpen(true);
                }}
                tabIndex={-1}
                title="Delete Purchase"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReprintPurchase(purchase.id)}
                className="text-purple-600 hover:text-purple-900"
                title="Reprint Purchase"
              >
                <FileText className="w-4 h-4" />
              </button> 
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {currentPurchases.length === 0 && (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No purchase records found</p>
      </div>
    )}
  </div>

  {/* Pagination Controls */}
  {totalPages > 1 && (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-4">
      <div className="flex items-center">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`flex items-center px-3 py-2 rounded-lg mr-2 ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>
        
        <div className="flex gap-1">
          {currentPage > 3 && (
            <>
              <button
                onClick={() => goToPage(1)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                1
              </button>
              {currentPage > 4 && <span className="px-2 py-2">...</span>}
            </>
          )}
          
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="px-2 py-2">...</span>}
              <button
                onClick={() => goToPage(totalPages)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`flex items-center px-3 py-2 rounded-lg ml-2 ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )}
</div>

      {/* Confirm Delete Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Purchase</h2>
            <p className="mb-2">
              Are you sure you want to delete this purchase?
              <br />
              <span className="text-sm text-gray-700">
                <strong>Purchase No:</strong> {purchaseHistory.find(p => p.id === deleteId)?.id || 'N/A'}<br />
                <strong>Invoice:</strong> {purchaseHistory.find(p => p.id === deleteId)?.invoice_number || 'N/A'}<br />
                <strong>Supplier:</strong> {purchaseHistory.find(p => p.id === deleteId)?.supplier_name || 'N/A'}
              </span>
            </p>
            <p className="mb-6 text-xs text-gray-500">
              This will revert inventory for all items in this purchase.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  await handleDeletePurchase(deleteId);
                  setConfirmDeleteOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {showNewSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Supplier</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text" 
                  value={newSupplier.name}
                  tabIndex={-1}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input
                  type="text"
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addNewSupplier}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Supplier
              </button>
              <button
                onClick={() => setShowNewSupplierForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item History Modal */}
      {showItemHistory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowItemHistory(null)}
        >
          <div
            className="bg-white rounded-xl p-8 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl relative custom-scroll"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
              <button
                onClick={() => setShowItemHistory(null)}
                className="text-white bg-red-600 hover:bg-red-700 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
                title="Close"
              >
                <span className="text-2xl leading-none font-bold">×</span>
              </button>
            </div>
            {itemHistory.length > 0 ? (() => {
              // Find lowest and highest price records
              const sortedByPrice = [...itemHistory].sort((a, b) => a.unit_price - b.unit_price);
              const lowest = sortedByPrice[0];
              const highest = sortedByPrice[sortedByPrice.length - 1];

              // Remove lowest and highest from the rest (if same record, only show once)
              const rest = itemHistory
                .filter(
                  r =>
                    r !== lowest &&
                    r !== highest
                )
                .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));

              return (
                <div className="space-y-5">
                  {/* Lowest Price */}
                  <div className="border border-green-300 rounded-lg p-5 bg-green-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <span className="font-semibold text-green-800 text-lg">Lowest Price</span>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <span className="font-medium">Supplier:</span> {lowest.supplier_name}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(lowest.purchase_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Quantity:</span> {lowest.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> <span className="text-green-700 font-bold">₹{lowest.unit_price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Highest Price (only if different from lowest) */}
                  {highest !== lowest && (
                    <div className="border border-red-300 rounded-lg p-5 bg-red-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className="font-semibold text-red-800 text-lg">Highest Price</span>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div>
                            <span className="font-medium">Supplier:</span> {highest.supplier_name}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(highest.purchase_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {highest.quantity}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> <span className="text-red-700 font-bold">₹{highest.unit_price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Rest of the history, sorted by date (recent first) */}
                  {rest.length > 0 && rest.map((record, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-5">
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
              );
            })() : (
              <p className="text-gray-600 text-center py-8">No purchase history available</p>
            )}
          </div>
          {/* Custom scrollbar styles */}
          <style>
            {`
              .custom-scroll::-webkit-scrollbar {
                width: 10px;
              }
              .custom-scroll::-webkit-scrollbar-thumb {
                background: #e5e7eb;
                border-radius: 8px;
              }
              .custom-scroll::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1;
              }
              .custom-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
            `}
          </style>
        </div>
      )}

      {/* Purchase Payment Modal */}
      {showPurchasePaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Record Purchase Payment</h2>
            
            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={purchasePaymentForm.paymentMethod}
                onChange={(e) => setPurchasePaymentForm({ 
                  ...purchasePaymentForm, 
                  paymentMethod: e.target.value,
                  paymentDetails: {} 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="neft_rtgs">NEFT/RTGS</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={purchasePaymentForm.amount}
                  onChange={(e) => setPurchasePaymentForm({ ...purchasePaymentForm, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={purchasePaymentForm.paymentDate}
                  onChange={(e) => setPurchasePaymentForm({ ...purchasePaymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Specific Fields - Same as SalesHistory.jsx */}
            {purchasePaymentForm.paymentMethod === 'upi' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.transactionId || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, transactionId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.upiId || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, upiId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.appName || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, appName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.referenceNumber || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, referenceNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {purchasePaymentForm.paymentMethod === 'cash' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.receivedBy || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, receivedBy: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.receiptNumber || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, receiptNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {purchasePaymentForm.paymentMethod === 'neft_rtgs' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.transactionReference || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, transactionReference: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
                  <select
                    value={purchasePaymentForm.paymentDetails.transferType || 'neft'}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, transferType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="neft">NEFT</option>
                    <option value="rtgs">RTGS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Our Bank</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.senderBank || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, senderBank: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Bank</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.receiverBank || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, receiverBank: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {purchasePaymentForm.paymentMethod === 'cheque' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.chequeNumber || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, chequeNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.bankName || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Date</label>
                  <input
                    type="date"
                    value={purchasePaymentForm.paymentDetails.chequeDate || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, chequeDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                  <input
                    type="text"
                    value={purchasePaymentForm.paymentDetails.drawerName || ''}
                    onChange={(e) => setPurchasePaymentForm({
                      ...purchasePaymentForm,
                      paymentDetails: { ...purchasePaymentForm.paymentDetails, drawerName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => {
                  setShowPurchasePaymentModal(false);
                  setPendingPurchasePayment(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handlePurchasePaymentSubmit}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}


{/* Items form */}
{showProductForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Add New Product</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={productForm.name}
            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {productErrors.name && <p className="text-red-600 text-xs mt-1">{productErrors.name}</p>}
        </div>
        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
          <input
            type="text"
            value={productForm.sku}
            onChange={e => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.sku ? 'border-red-500' : 'border-gray-300'}`}
          />
          {productErrors.sku && <p className="text-red-600 text-xs mt-1">{productErrors.sku}</p>}
        </div>
        {/* HSN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code</label>
          <input
            type="text"
            value={productForm.hsn_code}
            onChange={e => setProductForm({ ...productForm, hsn_code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 48025610"
          />
        </div>
        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
          <select
            value={productForm.unit}
            onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.unit ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Unit</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.name}>{unit.name}</option>
            ))}
          </select>
          {productErrors.unit && <p className="text-red-600 text-xs mt-1">{productErrors.unit}</p>}
        </div>
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={productForm.category_id}
            onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.category_id ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          {productErrors.category_id && <p className="text-red-600 text-xs mt-1">{productErrors.category_id}</p>}
        </div>
        {/* Description */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={productForm.description}
            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
        </div>
        {/* MRP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">MRP</label>
          <input
            type="number"
            step="0.01"
            value={productForm.mrp}
            onChange={e => setProductForm({ ...productForm, mrp: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.mrp ? 'border-red-500' : 'border-gray-300'}`}
            min={0}
          />
          {productErrors.mrp && <p className="text-red-600 text-xs mt-1">{productErrors.mrp}</p>}
        </div>
        {/* Purchase Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Rate</label>
          <input
            type="number"
            step="0.01"
            value={productForm.purchase_rate}
            onChange={e => setProductForm({ ...productForm, purchase_rate: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.purchase_rate ? 'border-red-500' : 'border-gray-300'}`}
            min={0}
          />
          {productErrors.purchase_rate && <p className="text-red-600 text-xs mt-1">{productErrors.purchase_rate}</p>}
        </div>
        {/* Sale Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sale Rate</label>
          <input
            type="number"
            step="0.01"
            value={productForm.sale_rate}
            onChange={e => setProductForm({ ...productForm, sale_rate: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.sale_rate ? 'border-red-500' : 'border-gray-300'}`}
            min={0}
          />
          {productErrors.sale_rate && <p className="text-red-600 text-xs mt-1">{productErrors.sale_rate}</p>}
        </div>
        {/* GST % */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GST %</label>
          <select
            value={productForm.gst_percentage}
            onChange={e => setProductForm({ ...productForm, gst_percentage: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.gst_percentage ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select GST %</option>
            {gstRates.map(gst => (
              <option key={gst.id} value={gst.rate}>{gst.rate}%</option>
            ))}
          </select>
          {productErrors.gst_percentage && <p className="text-red-600 text-xs mt-1">{productErrors.gst_percentage}</p>}
        </div>
        {/* Current Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
          <input
            type="number"
            value={productForm.current_stock}
            onChange={e => setProductForm({ ...productForm, current_stock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min={0}
            placeholder="Defaults to 0"
          />
        </div>
        {/* Minimum Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
          <input
            type="number"
            value={productForm.minimum_stock}
            onChange={e => setProductForm({ ...productForm, minimum_stock: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={handleAddProduct}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add Product
        </button>
        <button
          onClick={() => {
            setShowProductForm(false);
            setProductForm(initialProductForm);
            setProductErrors({});
          }}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
        >
          Cancel
        </button> 
      </div>
    </div>
  </div>
)}

      {/* Purchase Payment History Modal */}
      {showPurchasePaymentHistoryModal && purchasePaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase Payment History</h2>
            
            {purchasePaymentHistory.length > 0 ? (
              <div className="space-y-4">
                {purchasePaymentHistory.map((payment, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div><strong>Payment Method:</strong> {payment.payment_method?.toUpperCase()}</div>
                      <div><strong>Amount:</strong> ₹{payment.amount}</div>
                      <div><strong>Payment Date:</strong> {payment.payment_date}</div>
                      <div><strong>Status:</strong> {payment.status}</div>
                    </div>

                   
                    {/* Method-specific details - Same structure as SalesHistory.jsx */}
                    {payment.payment_method === 'upi' && payment.details && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t pt-3">
                        <div><strong>Transaction ID:</strong> {payment.details.transaction_id || 'N/A'}</div>
                        <div><strong>UPI ID:</strong> {payment.details.upi_id || 'N/A'}</div>
                        <div><strong>App Name:</strong> {payment.details.app_name || 'N/A'}</div>
                        <div><strong>Reference:</strong> {payment.details.reference_number || 'N/A'}</div>
                      </div>
                    )}

                    {payment.payment_method === 'cash' && payment.details && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t pt-3">
                        <div><strong>Paid By:</strong> {payment.details.received_by || 'N/A'}</div>
                        <div><strong>Receipt Number:</strong> {payment.details.receipt_number || 'N/A'}</div>
                      </div>
                    )}

                    {payment.payment_method === 'neft_rtgs' && payment.details && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t pt-3">
                        <div><strong>Transaction Ref:</strong> {payment.details.transaction_reference || 'N/A'}</div>
                        <div><strong>Transfer Type:</strong> {payment.details.transfer_type?.toUpperCase() || 'N/A'}</div>
                        <div><strong>Our Bank:</strong> {payment.details.sender_bank || 'N/A'}</div>
                        <div><strong>Supplier Bank:</strong> {payment.details.receiver_bank || 'N/A'}</div>
                      </div>
                    )}

                    {payment.payment_method === 'cheque' && payment.details && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t pt-3">
                        <div><strong>Cheque Number:</strong> {payment.details.cheque_number || 'N/A'}</div>
                        <div><strong>Bank Name:</strong> {payment.details.bank_name || 'N/A'}</div>
                        <div><strong>Cheque Date:</strong> {payment.details.cheque_date || 'N/A'}</div>
                        <div><strong>Issued By:</strong> {payment.details.drawer_name || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No payment history found
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => {
                  setShowPurchasePaymentHistoryModal(false);
                  setPurchasePaymentHistory(null);
                }}
              >
                Close
                
              </button>
            </div>
          </div>
        </div>
      )}
       {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </div>
  
    </PinProtected>
  ); 
}; 

export default Purchase;