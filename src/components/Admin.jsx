import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Package,
  Users,
  Tag,
  Percent,
  RefreshCw,
  Lock
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import PinProtected from './reusables/PinProtected';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(false);


  // Data states 
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [customers, setCustomers] = useState([]); // NEW: Customers state

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showGstForm, setShowGstForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSalesmanForm, setShowSalesmanForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false); // NEW: Customers form state
  const [editingItem, setEditingItem] = useState(null);
  const [editingSalesman, setEditingSalesman] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null); // NEW: Editing customer state

  // CHANGED: make required fields empty by default; current_stock empty -> will default to 0 on submit
  const initialProductForm = {
    name: '',
    sku: '',
    hsn_code: '',
    description: '',
    unit: '',
    mrp: '',
    purchase_rate: '',
    sale_rate: '',
    customer_rate: '',
    salesman_rate: '',
    gst_percentage: '',
    category_id: '',
    current_stock: '',
    minimum_stock: 10
  };
  const [productForm, setProductForm] = useState(initialProductForm);

  // NEW: validation errors state
  const [productErrors, setProductErrors] = useState({});

  const initialSupplierForm = { name: '', contact: '', address: '', gstin: '' };
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm);
  const [supplierErrors, setSupplierErrors] = useState({});
  const [categoryErrors, setCategoryErrors] = useState({});
  const [unitErrors, setUnitErrors] = useState({});
  const [gstErrors, setGstErrors] = useState({});
  // Product filters
  const [productFilters, setProductFilters] = useState({ name: '', sku: '', category: '', gst: '' });
  // Supplier filters
  const [supplierFilters, setSupplierFilters] = useState({ name: '', contact: '', gstin: '' });
  // Category filters
  const [categoryFilters, setCategoryFilters] = useState({ name: '' });
  // Unit filters
  const [unitFilters, setUnitFilters] = useState({ name: '' });
  // GST filters
  const [gstFilters, setGstFilters] = useState({ rate: '', description: '' });
  // Salesman filters
  const [salesmanFilters, setSalesmanFilters] = useState({ name: '', contact_info: '' });
  // Customer filters
  const [customerFilters, setCustomerFilters] = useState({ name: '', contact: '' });

  const [unitForm, setUnitForm] = useState({ name: '' });
  const [gstForm, setGstForm] = useState({ rate: 0, description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [salesmanForm, setSalesmanForm] = useState({
    name: '',
    contact_info: '',
    address: '',
    joining_date: ''
  });
  const [salesmanErrors, setSalesmanErrors] = useState({});

  const initialCustomerForm = { name: '', contact: '', address: '' }; // NEW: Initial customer form
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [customerErrors, setCustomerErrors] = useState({}); // NEW: Customer errors state

  // Confirm action modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => { });

  // --- VALIDATION FUNCTIONS ---

  const validateCategoryForm = (form) => {
    const errors = {};
    if (!form.name || String(form.name).trim().length < 2) errors.name = 'Category name is required';
    return errors;
  };

  const validateUnitForm = (form) => {
    const errors = {};
    if (!form.name || String(form.name).trim().length < 1) errors.name = 'Unit name is required';
    return errors; 
  };
 
  const validateGstForm = (form) => {
    const errors = {};
    if (form.rate === '' || form.rate === null || isNaN(form.rate)) errors.rate = 'GST rate is required';
    return errors;
  };

  const validateProductForm = (form) => {
    const errors = {};
    const isEmpty = (v) => v === '' || v === null || v === undefined;

    if (isEmpty(form.name) || String(form.name).trim().length < 2) errors.name = 'Name is required';
    if (isEmpty(form.sku) || String(form.sku).trim().length < 1) errors.sku = 'SKU is required';
    if (isEmpty(form.unit)) errors.unit = 'Unit is required';
    if (isEmpty(form.category_id)) errors.category_id = 'Category is required';

    // const mrp = parseFloat(form.mrp);
    // if (isNaN(mrp) || mrp <= 0) errors.mrp = 'MRP must be greater than 0';

    const pr = parseFloat(form.purchase_rate);
    if (isNaN(pr) || pr <= 0) errors.purchase_rate = 'Purchase rate must be greater than 0';

    // const sr = parseFloat(form.sale_rate);
    // if (isNaN(sr) || sr <= 0) errors.sale_rate = 'Sale rate must be greater than 0';

    const cr = parseFloat(form.customer_rate); 
    if (isNaN(cr) || cr < 0) errors.customer_rate = 'Customer rate must be 0 or more';

    const smr = parseFloat(form.salesman_rate);
    if (isNaN(smr) || smr < 0) errors.salesman_rate = 'Salesman rate must be 0 or more';

    if (isEmpty(form.gst_percentage) && form.gst_percentage !== 0) {
      errors.gst_percentage = 'GST rate is required';
    }

    return errors;
  };

  const validateSalesmanForm = (form) => {
    const errors = {};
    if (!form.name || String(form.name).trim().length < 2) errors.name = 'Name is required';
    if (!form.contact_info || String(form.contact_info).trim().length < 5) errors.contact_info = 'Contact info is required';
    if (!form.joining_date) errors.joining_date = 'Joining date is required';
    return errors;
  };

  const validateCustomerForm = (form) => {
    const errors = {};
    if (!form.name || form.name.trim().length < 2) errors.name = 'Name is required';
    if (!form.contact || form.contact.trim().length < 5) errors.contact = 'Contact is required';
    return errors;
  };

const buildProductPayload = (form) => ({
  name: String(form.name).trim(),
  sku: String(form.sku).trim() || getNextSku(), // Fallback to auto-generated if empty
  hsn_code: String(form.hsn_code || '').trim(),
  description: String(form.description || '').trim(),
  unit: String(form.unit),
  mrp: Math.max(0, parseFloat(form.mrp) || 0),
  purchase_rate: Math.max(0, parseFloat(form.purchase_rate) || 0),
  sale_rate: Math.max(0, parseFloat(form.sale_rate) || 0),
  customer_rate: Math.max(0, parseFloat(form.customer_rate) || 0),
  salesman_rate: Math.max(0, parseFloat(form.salesman_rate) || 0),
  gst_percentage: parseFloat(form.gst_percentage) || 0,
  category_id: parseInt(form.category_id, 10),
  current_stock: Math.max(0, parseInt(form.current_stock, 10) || 0),
  minimum_stock: Math.max(0, parseInt(form.minimum_stock, 10) || 0)
});



  useEffect(() => {
    loadAllData();
  }, []);



  const loadAllData = async () => {
    setLoading(true);
    try {


      const [productsData, suppliersData, categoriesData, unitsData, gstData, salesmenData, customersData] = await Promise.all([
        window.electronAPI.getInventory(),
        window.electronAPI.getSuppliers(),
        window.electronAPI.getCategories(),
        window.electronAPI.getUnits(),
        window.electronAPI.getGstRates(),
        window.electronAPI.getSalesmen(),
        window.electronAPI.getCustomers() // NEW: Load customers data
      ]);
      setProducts(productsData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);
      setUnits(unitsData);
      setGstRates(gstData);
      setSalesmen(salesmenData);
      setCustomers(customersData); // NEW: Set customers data

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Product management
  const handleAddProduct = async () => {
    const errors = validateProductForm(productForm);
    if (Object.keys(errors).length) {
      setProductErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (window.electronAPI) {
        const skuExists = await window.electronAPI.checkSkuExists(productForm.sku);
        if (skuExists) {
          setProductErrors({ ...errors, sku: 'SKU already exists' });
          toast.error('SKU already exists');
          return;
        }
        const payload = buildProductPayload(productForm);
        const newProduct = await window.electronAPI.addItem(payload);

        // --- NEW: Set opening stock when adding product ---
        if (payload.current_stock > 0) {
          await window.electronAPI.setOpeningStock({
            itemId: newProduct.id,
            qty: payload.current_stock,
            rate: payload.purchase_rate,
            date: new Date().toISOString().split('T')[0]
          });
          toast.success('Product added with opening stock');
        } else {
          toast.success('Product added successfully');
        }

        setProducts([...products, newProduct]);
      }
      setShowProductForm(false);
      setProductForm(initialProductForm);
      setProductErrors({});
    } catch (error) {
      if (error?.message?.includes('SKU already exists')) {
        setProductErrors({ ...productErrors, sku: 'SKU already exists' });
        toast.error('SKU already exists');
      } else if (error?.message?.includes('locked')) {
        toast.error('Opening stock is locked and cannot be modified');
      } else {
        toast.error('Error adding product');
        console.error('Error adding product:', error);
      }
    }
  };

  const handleUpdateProduct = async () => {
    const errors = validateProductForm(productForm);
    if (Object.keys(errors).length) {
      setProductErrors(errors);
      return;
    }
    try {
      if (window.electronAPI) {
        const skuExists = await window.electronAPI.checkSkuExists(productForm.sku, editingItem);
        if (skuExists) {
          setProductErrors({ ...errors, sku: 'SKU already exists' });
          toast.error('SKU already exists');
          return;
        }

        // Get existing item data
        const existingItem = products.find(p => p.id === editingItem);
        const payload = { id: editingItem, ...buildProductPayload(productForm) };
        
        await window.electronAPI.updateItem(payload);

        // --- NEW: Update opening stock ONLY if it's not locked ---
        try {
          const openingStock = await window.electronAPI.getOpeningStock(editingItem);
          
          if (openingStock.is_locked === 1) {
            toast.warning('Opening stock is locked. Only item details updated.');
          } else {
            // Calculate the difference between old and new stock
            const oldQty = existingItem.current_stock || 0;
            const newQty = payload.current_stock || 0;
            const qtyDifference = newQty - oldQty;

            // Calculate the new opening stock quantity
            const currentOpeningQty = openingStock.opening_qty || 0;
            const updatedOpeningQty = currentOpeningQty + qtyDifference;

            if (updatedOpeningQty >= 0) {
              await window.electronAPI.setOpeningStock({
                itemId: editingItem,
                qty: updatedOpeningQty,
                rate: payload.purchase_rate,
                date: openingStock.opening_date || new Date().toISOString().split('T')[0]
              });
              toast.success('Product and opening stock updated');
            } else {
              toast.warning('Opening stock cannot be negative. Only item details updated.');
            }
          }
        } catch (stockError) {
          console.error('Error updating opening stock:', stockError);
          toast.warning('Product updated but opening stock update failed');
        }

        await loadAllData();
      }
      setEditingItem(null);
      setProductForm(initialProductForm);
      setShowProductForm(false);
      setProductErrors({});
    } catch (error) {
      if (error?.message?.includes('SKU already exists')) {
        setProductErrors({ ...productErrors, sku: 'SKU already exists' });
        toast.error('SKU already exists');
      } else {
        toast.error('Error updating product');
        console.error('Error updating product:', error);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    setConfirmMessage('Are you sure you want to delete this product?');
    setOnConfirmAction(() => async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteItem(id);
          toast.success('Product deleted successfully');
          setProducts(products.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Supplier management
  const validateSupplierForm = (form) => {
    const errors = {};
    const isEmpty = (v) => v === '' || v === null || v === undefined;

    if (isEmpty(form.name) || String(form.name).trim().length < 2) errors.name = 'Name is required';
    if (isEmpty(form.contact) || String(form.contact).trim().length < 5) errors.contact = 'Contact is required';
    if (isEmpty(form.gstin) || String(form.gstin).trim().length < 3) errors.gstin = 'GSTIN is required';

    return errors;
  };

  const handleAddSupplier = async () => {
    const errors = validateSupplierForm(supplierForm);
    if (Object.keys(errors).length) {
      toast.error('Please fill all required fields');
      setSupplierErrors(errors || {});
      return;
    }
    try {
      if (window.electronAPI) {
        const newSupplier = await window.electronAPI.addSupplier(supplierForm);
        toast.success('Supplier added successfully');
        setSuppliers([...suppliers, newSupplier]);
      }
      setShowSupplierForm(false);
      setSupplierForm(initialSupplierForm);
      setSupplierErrors({});
    } catch (error) {
      toast.error('Error adding supplier');
      console.error('Error adding supplier:', error);
    }
  };

  const handleUpdateSupplier = async () => {
    const errors = validateSupplierForm(supplierForm);
    if (Object.keys(errors).length) {
      toast.error('Please fill all required fields');
      setSupplierErrors(errors || {});

      return;
    }
    try {
      if (window.electronAPI) {
        await window.electronAPI.updateSupplier({ id: editingItem, ...supplierForm });
        toast.success('Supplier updated successfully');
        await loadAllData();
      }
      setEditingItem(null);
      setSupplierForm(initialSupplierForm);
      setShowSupplierForm(false);
      setSupplierErrors({});
    } catch (error) {
      toast.error('Error updating supplier');
      console.error('Error updating supplier:', error);
    }
  };

  const handleDeleteSupplier = async (id) => {
    setConfirmMessage('Are you sure you want to delete this supplier?');
    setOnConfirmAction(() => async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteSupplier(id);
          toast.success('Supplier deleted successfully');
          setSuppliers(suppliers.filter(s => s.id !== id));
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Unit management
  const handleAddUnit = async () => {
    const errors = validateUnitForm(unitForm);
    if (Object.keys(errors).length) {
      setUnitErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (window.electronAPI) {
        const newUnit = await window.electronAPI.addUnit(unitForm);
        toast.success('Unit added successfully');
        setUnits([...units, newUnit]);
      }
      setShowUnitForm(false);
      setUnitForm({ name: '' });
      setUnitErrors({});
    } catch (error) {
      console.error('Error adding unit:', error);
    }
  };

  const handleDeleteUnit = async (id) => {
    setConfirmMessage('Are you sure you want to delete this unit?');
    setOnConfirmAction(() => async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteUnit(id);
          toast.success('Unit deleted successfully');
          setUnits(units.filter(u => u.id !== id));
        }
      } catch (error) {
        console.error('Error deleting unit:', error);
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // GST Rate management
  const handleAddGstRate = async () => {
    const errors = validateGstForm(gstForm);
    if (Object.keys(errors).length) {
      setGstErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const rateExists = await window.electronAPI.checkGstExists(gstForm.rate, editingItem);
      console.log(' rate edit :' + rateExists)
      if (rateExists) {
        setGstErrors({ ...errors, rate: 'GST rate already exists' });
        toast.error('GST rate already exists');
        return;
      }
      if (window.electronAPI) {
        const newGstRate = await window.electronAPI.addGstRate(gstForm);
        toast.success('GST rate added successfully');
        setGstRates([...gstRates, newGstRate]);
      }
      setShowGstForm(false);
      setGstForm({ rate: 0, description: '' });
      setGstErrors({});
    } catch (error) {
      console.error('Error adding GST rate:', error);
    }
  };

  const handleDeleteGstRate = async (id) => {
    setConfirmMessage('Are you sure you want to delete this GST rate?');
    setOnConfirmAction(() => async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteGstRate(id);
          toast.success('GST rate deleted successfully');
          setGstRates(gstRates.filter(g => g.id !== id));
        }
      } catch (error) {
        console.error('Error deleting GST rate:', error);
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Category management
  const handleAddCategory = async () => {
    const errors = validateCategoryForm(categoryForm);
    if (Object.keys(errors).length) {
      setCategoryErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const nameExists = await window.electronAPI.checkCategoryExists(categoryForm.name, editingItem);
      console.log(' name edit :' + nameExists)
      if (nameExists) {
        setCategoryErrors({ ...errors, name: 'Category already exists' });
        toast.error('Category already exists');
        return;
      }
      if (window.electronAPI) {
        const newCategory = await window.electronAPI.addCategory(categoryForm);
        toast.success('Category added successfully');
        setCategories([...categories, newCategory]);
      }
      setShowCategoryForm(false);
      setCategoryForm({ name: '' });
      setCategoryErrors({});
    } catch (error) {
      toast.error('Error adding category');
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    setConfirmMessage('Are you sure you want to delete this category?');
    setOnConfirmAction(() => async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteCategory(id);
          toast.success('Category deleted successfully');
          setCategories(categories.filter(c => c.id !== id));
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Salesman management
  const handleAddSalesman = async () => {
    const errors = validateSalesmanForm(salesmanForm);
    if (Object.keys(errors).length) {
      setSalesmanErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const newSalesman = await window.electronAPI.addSalesman(salesmanForm);
      toast.success('Salesman added successfully');
      setSalesmen([...salesmen, newSalesman]);
      setShowSalesmanForm(false);
      setSalesmanForm({ name: '', contact_info: '', address: '', joining_date: '' });
      setSalesmanErrors({});
    } catch (error) {
      toast.error('Error adding salesman');
    }
  };

  const handleUpdateSalesman = async () => {
    const errors = validateSalesmanForm(salesmanForm);
    if (Object.keys(errors).length) {
      setSalesmanErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await window.electronAPI.updateSalesman({ id: editingSalesman, ...salesmanForm });
      toast.success('Salesman updated successfully');
      await loadAllData();
      setEditingSalesman(null);
      setShowSalesmanForm(false);
      setSalesmanForm({ name: '', contact_info: '', address: '', joining_date: '' });
      setSalesmanErrors({});
    } catch (error) {
      toast.error('Error updating salesman');
    }
  };

  const handleDeleteSalesman = async (id) => {
    setConfirmMessage('Are you sure you want to delete this salesman?');
    setOnConfirmAction(() => async () => {
      try {
        await window.electronAPI.deleteSalesman(id);
        toast.success('Salesman deleted successfully');
        setSalesmen(salesmen.filter(s => s.id !== id));
      } catch (error) {
        toast.error('Error deleting salesman');
      } finally {
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Customer management
  const handleAddCustomer = async () => {
    const errors = validateCustomerForm(customerForm);
    if (Object.keys(errors).length) {
      setCustomerErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    const newCustomer = await window.electronAPI.addCustomer(customerForm);
    setCustomers([...customers, newCustomer]);
    setShowCustomerForm(false);
    setCustomerForm(initialCustomerForm);
    setCustomerErrors({});
    toast.success('Customer added');
  };

  const handleUpdateCustomer = async () => {
    const errors = validateCustomerForm(customerForm);
    if (Object.keys(errors).length) {
      setCustomerErrors(errors);
      toast.error('Please fill all required fields');
      return;
    }
    await window.electronAPI.updateCustomer({ id: editingCustomer, ...customerForm });
    setCustomers(customers.map(c => c.id === editingCustomer ? { ...customerForm, id: editingCustomer } : c));
    setShowCustomerForm(false);
    setEditingCustomer(null);
    setCustomerForm(initialCustomerForm);
    setCustomerErrors({});
    toast.success('Customer updated');
  };

  const handleDeleteCustomer = async (id) => {
    await window.electronAPI.deleteCustomer(id);
    setCustomers(customers.filter(c => c.id !== id));
    toast.success('Customer deleted');
  };

  const tabs = [
    { id: 'products', name: 'Products', icon: Package },
    { id: 'suppliers', name: 'Suppliers', icon: Users },
    { id: 'categories', name: 'Categories', icon: Tag },
    { id: 'units', name: 'Units', icon: Tag },
    { id: 'gst', name: 'GST Rates', icon: Percent },
    { id: 'salesman', name: 'Salesmen', icon: Users },
    { id: 'customers', name: 'Customers', icon: Users } // NEW: Customers tab
  ];

  useEffect(() => {
    // Auto-generate SKU when product form is opened for new product
    if (showProductForm && !editingItem) {
      const generateSku = async () => {
        try {
          const nextSku = await window.electronAPI.getNextSku();
          setProductForm(prev => ({ ...prev, sku: nextSku }));
        } catch (error) {
          console.error('Error generating SKU:', error);
        }
      };
      generateSku();
    }
  }, [showProductForm, editingItem]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }



  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename='Admin'>
      <div className="space-y-6">
        {/* <ToastContainer position="top-right" autoClose={3000} /> */}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage products, suppliers, and system settings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={productFilters.name}
                      onChange={e => setProductFilters({ ...productFilters, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={productFilters.sku}
                      onChange={e => setProductFilters({ ...productFilters, sku: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={productFilters.category}
                      onChange={e => setProductFilters({ ...productFilters, category: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <select
                      value={productFilters.gst}
                      onChange={e => setProductFilters({ ...productFilters, gst: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">GST %</option>
                      {gstRates.map(gst => (
                        <option key={gst.id} value={gst.rate}>{gst.rate}%</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex mt-2">
                    <button
                      onClick={() => setProductFilters({ name: '', sku: '', category: '', gst: '' })}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Product Management</h2>
                  <button
                    onClick={() => {
                      setProductForm(initialProductForm);
                      setShowProductForm(true);
                      // Auto-generate SKU will be handled by useEffect
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Rate</th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST%</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products
                        .filter(product =>
                          (!productFilters.name || product.name.toLowerCase().includes(productFilters.name.toLowerCase())) &&
                          (!productFilters.sku || product.sku.toLowerCase().includes(productFilters.sku.toLowerCase())) &&
                          (!productFilters.category || categories.find(cat => cat.id === product.category_id)?.name === productFilters.category) &&
                          (!productFilters.gst || String(product.gst_percentage) === String(productFilters.gst))
                        )
                        .map(product => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {product.sku}
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{product.mrp}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{product.sale_rate}
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{product.customer_rate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{product.salesman_rate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {product.gst_percentage}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {product.current_stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingItem(product.id);
                                  setProductForm(product);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {/* <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>*/}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={supplierFilters.name}
                      onChange={e => setSupplierFilters({ ...supplierFilters, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Contact"
                      value={supplierFilters.contact}
                      onChange={e => setSupplierFilters({ ...supplierFilters, contact: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {/* <input
                      type="text"
                      placeholder="GSTIN"
                      value={supplierFilters.gstin}
                      onChange={e => setSupplierFilters({ ...supplierFilters, gstin: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    /> */}
                  </div>
                  <div className="flex mt-2">
                    <button
                      onClick={() => setSupplierFilters({ name: '', contact: '', gstin: '' })}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Supplier Management</h2>
                  <button
                    onClick={() => {
                      setSupplierForm(initialSupplierForm); // <-- Reset supplier form
                      setShowSupplierForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {suppliers
                        .filter(supplier =>
                          (!supplierFilters.name || supplier.name.toLowerCase().includes(supplierFilters.name.toLowerCase())) &&
                          (!supplierFilters.contact || supplier.contact.toLowerCase().includes(supplierFilters.contact.toLowerCase())) &&
                          (!supplierFilters.gstin || supplier.gstin.toLowerCase().includes(supplierFilters.gstin.toLowerCase()))
                        )
                        .map(supplier => (
                          <tr key={supplier.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {supplier.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {supplier.contact}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {supplier.gstin}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingItem(supplier.id);
                                  setSupplierForm(supplier);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Units Tab */}
            {activeTab === 'units' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Unit Management</h2>
                  <button
                    onClick={() => {
                      setUnitForm({ name: '' }); // <-- Reset unit form
                      setShowUnitForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Unit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {units.map((unit) => (
                    <div key={unit.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <span className="font-medium">{unit.name}</span>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GST Rates Tab */}
            {activeTab === 'gst' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">GST Rate Management</h2>
                  <button
                    onClick={() => {
                      setGstForm({ rate: 0, description: '' }); // <-- Reset GST form
                      setShowGstForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add GST Rate
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gstRates.map((gst) => (
                    <div key={gst.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{gst.rate}%</span>
                        <p className="text-sm text-gray-600">{gst.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteGstRate(gst.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryFilters.name}
                    onChange={e => setCategoryFilters({ ...categoryFilters, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => setCategoryFilters({ name: '' })}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg mt-2"
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Category Management</h2>
                  <button
                    onClick={() => {
                      setCategoryForm({ name: '' }); // <-- Reset category form
                      setShowCategoryForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories
                    .filter(category =>
                      !categoryFilters.name || category.name.toLowerCase().includes(categoryFilters.name.toLowerCase())
                    )
                    .map(category => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Salesmen Tab */}
            {activeTab === 'salesman' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={salesmanFilters.name}
                      onChange={e => setSalesmanFilters({ ...salesmanFilters, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Contact Info"
                      value={salesmanFilters.contact_info}
                      onChange={e => setSalesmanFilters({ ...salesmanFilters, contact_info: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => setSalesmanFilters({ name: '', contact_info: '' })}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg mt-2"
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Salesman Management</h2>
                  <button
                    onClick={() => {
                      setSalesmanForm({ name: '', contact_info: '', address: '', joining_date: '' });
                      setShowSalesmanForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Salesman
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200"> 
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joining Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {salesmen
                        .filter(salesman =>
                          (!salesmanFilters.name || salesman.name.toLowerCase().includes(salesmanFilters.name.toLowerCase())) &&
                          (!salesmanFilters.contact_info || salesman.contact_info.toLowerCase().includes(salesmanFilters.contact_info.toLowerCase()))
                        )
                        .map(salesman => (
                          <tr key={salesman.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salesman.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{salesman.contact_info}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{salesman.address}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{salesman.joining_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingSalesman(salesman.id);
                                  setSalesmanForm({
                                    name: salesman.name,
                                    contact_info: salesman.contact_info,
                                    address: salesman.address,
                                    joining_date: salesman.joining_date
                                  });
                                  setShowSalesmanForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSalesman(salesman.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={customerFilters.name}
                      onChange={e => setCustomerFilters({ ...customerFilters, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Contact"
                      value={customerFilters.contact}
                      onChange={e => setCustomerFilters({ ...customerFilters, contact: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => setCustomerFilters({ name: '', contact: '' })}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg mt-2"
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Customer Management</h2>
                  <button
                    onClick={() => {
                      setCustomerForm(initialCustomerForm); // <-- Reset customer form
                      setShowCustomerForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customers
                        .filter(customer =>
                          (!customerFilters.name || customer.name.toLowerCase().includes(customerFilters.name.toLowerCase())) &&
                          (!customerFilters.contact || customer.contact.toLowerCase().includes(customerFilters.contact.toLowerCase()))
                        )
                        .map(customer => (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {customer.contact}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {customer.address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCustomer(customer.id);
                                  setCustomerForm(customer);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Form Modal */}
        {(showProductForm || editingItem) && activeTab === 'products' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Edit Product' : 'Add New Product'}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => {
                      setProductForm({ ...productForm, name: e.target.value });
                      if (productErrors.name) setProductErrors({ ...productErrors, name: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {productErrors.name && <p className="text-red-600 text-xs mt-1">{productErrors.name}</p>}
                </div>

                {/* SKU - Updated with auto-generation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                    <span className="text-xs text-gray-500 ml-1">(Auto-generated or custom)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setProductForm({ ...productForm, sku: value });
                        if (productErrors.sku) setProductErrors({ ...productErrors, sku: undefined });
                      }}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        productErrors.sku ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Auto-generated or enter custom"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const nextSku = await window.electronAPI.getNextSku();
                          setProductForm({ ...productForm, sku: nextSku });
                          if (productErrors.sku) setProductErrors({ ...productErrors, sku: undefined });
                        } catch (error) {
                          console.error('Error generating SKU:', error);
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                      title="Generate next SKU"
                    >
                      Auto
                    </button>
                  </div>
                  {productErrors.sku && <p className="text-red-600 text-xs mt-1">{productErrors.sku}</p>}
                </div>

                {/* HSN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code</label>
                  <input
                    type="text"
                    value={productForm.hsn_code}
                    onChange={(e) => setProductForm({ ...productForm, hsn_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 48025610"
                  />
                </div>

                {/* Unit (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => {
                      setProductForm({ ...productForm, unit: e.target.value });
                      if (productErrors.unit) setProductErrors({ ...productErrors, unit: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.unit ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.name}>{unit.name}</option>
                    ))}
                  </select>
                  {productErrors.unit && <p className="text-red-600 text-xs mt-1">{productErrors.unit}</p>}
                </div>

                {/* Category (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => {
                      setProductForm({ ...productForm, category_id: e.target.value });
                      if (productErrors.category_id) setProductErrors({ ...productErrors, category_id: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.category_id ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>

                {/* MRP (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRP</label>
                  <input
                    type="number"
                    step="0.01"
                    onWheel={e => e.target.blur()}
                    value={productForm.mrp}
                    onChange={(e) => {
                      setProductForm({ ...productForm, mrp: e.target.value });
                      if (productErrors.mrp) setProductErrors({ ...productErrors, mrp: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.mrp ? 'border-red-500' : 'border-gray-300'
                      }`}
                    min={0}
                  />
                  {productErrors.mrp && <p className="text-red-600 text-xs mt-1">{productErrors.mrp}</p>}
                </div>

                {/* Purchase Rate (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    onWheel={e => e.target.blur()}
                    value={productForm.purchase_rate}
                    onChange={(e) => {
                      setProductForm({ ...productForm, purchase_rate: e.target.value });
                      if (productErrors.purchase_rate) setProductErrors({ ...productErrors, purchase_rate: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.purchase_rate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    min={0}
                  />
                  {productErrors.purchase_rate && <p className="text-red-600 text-xs mt-1">{productErrors.purchase_rate}</p>}
                </div>

              {/* Sale Rate (required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Rate</label>
                <input
                  type="number"
                  step="0.01"
                  onWheel={e => e.target.blur()}
                  value={productForm.sale_rate}
                  onChange={(e) => {
                    setProductForm({ ...productForm, sale_rate: e.target.value });
                    if (productErrors.sale_rate) setProductErrors({ ...productErrors, sale_rate: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    productErrors.sale_rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={0}
                />
                {productErrors.sale_rate && <p className="text-red-600 text-xs mt-1">{productErrors.sale_rate}</p>}
              </div>

              {/* Customer Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Rate</label>
                <input
                  type="number"
                  step="0.01"
                  onWheel={e => e.target.blur()}
                  value={productForm.customer_rate}
                  onChange={(e) => {
                    setProductForm({ ...productForm, customer_rate: e.target.value });
                    if (productErrors.customer_rate) setProductErrors({ ...productErrors, customer_rate: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    productErrors.customer_rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={0}
                />
                {productErrors.customer_rate && <p className="text-red-600 text-xs mt-1">{productErrors.customer_rate}</p>}
              </div>

              {/* Salesman Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salesman Rate</label>
                <input
                  type="number"
                  step="0.01"
                  onWheel={e => e.target.blur()}
                  value={productForm.salesman_rate}
                  onChange={(e) => {
                    setProductForm({ ...productForm, salesman_rate: e.target.value });
                    if (productErrors.salesman_rate) setProductErrors({ ...productErrors, salesman_rate: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    productErrors.salesman_rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={0}
                />
                {productErrors.salesman_rate && <p className="text-red-600 text-xs mt-1">{productErrors.salesman_rate}</p>}
              </div>

                {/* GST % (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST %</label>
                  <select
                    value={productForm.gst_percentage}
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setProductForm({ ...productForm, gst_percentage: v });
                      if (productErrors.gst_percentage) setProductErrors({ ...productErrors, gst_percentage: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${productErrors.gst_percentage ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select GST %</option>
                    {gstRates.map(gst => (
                      <option key={gst.id} value={gst.rate}>{gst.rate}%</option>
                    ))}
                  </select>
                  {productErrors.gst_percentage && <p className="text-red-600 text-xs mt-1">{productErrors.gst_percentage}</p>}
                </div>

                {/* Current Stock (optional -> defaults to 0) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={productForm.current_stock}
                    onChange={(e) => setProductForm({ ...productForm, current_stock: e.target.value })}
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
                    onWheel={e => e.target.blur()}
                    value={productForm.minimum_stock}
                    onChange={(e) => setProductForm({ ...productForm, minimum_stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={editingItem ? handleUpdateProduct : handleAddProduct}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {editingItem ? 'Update' : 'Add'} Product
                </button>
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingItem(null);
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

        {/* Supplier Form Modal */}
        {(showSupplierForm || (editingItem && activeTab === 'suppliers')) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>

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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${supplierErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${supplierErrors.contact ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {supplierErrors.contact && <p className="text-red-600 text-xs mt-1">{supplierErrors.contact}</p>}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${supplierErrors.gstin ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {supplierErrors.gstin && <p className="text-red-600 text-xs mt-1">{supplierErrors.gstin}</p>}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={editingItem ? handleUpdateSupplier : handleAddSupplier}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {editingItem ? 'Update' : 'Add'} Supplier
                </button>
                <button
                  onClick={() => {
                    setShowSupplierForm(false);
                    setEditingItem(null);
                    setSupplierForm(initialSupplierForm);
                    setSupplierErrors({});
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unit Form Modal */}
        {showUnitForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Add New Unit</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Name</label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) => {
                    setUnitForm({ ...unitForm, name: e.target.value });
                    if (unitErrors.name) setUnitErrors({ ...unitErrors, name: undefined });
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${unitErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., kg, pcs, ltr"
                />
                {unitErrors.name && <p className="text-red-600 text-xs mt-1">{unitErrors.name}</p>}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddUnit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Add Unit
                </button>
                <button
                  onClick={() => {
                    setShowUnitForm(false);
                    setUnitForm({ name: '' });
                    setUnitErrors({});
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GST Form Modal */}
        {showGstForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Add New GST Rate</h2>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    onWheel={e => e.target.blur()}
                    value={gstForm.rate}
                    onChange={(e) => {
                      setGstForm({ ...gstForm, rate: parseFloat(e.target.value) });
                      if (gstErrors.rate) setGstErrors({ ...gstErrors, rate: undefined });
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${gstErrors.rate ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {gstErrors.rate && <p className="text-red-600 text-xs mt-1">{gstErrors.rate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={gstForm.description}
                    onChange={(e) => setGstForm({ ...gstForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Standard rate"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddGstRate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Add GST Rate
                </button>
                <button
                  onClick={() => {
                    setShowGstForm(false);
                    setGstForm({ rate: 0, description: '' });
                    setGstErrors({});
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Add New Category</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryForm({ ...categoryForm, name: e.target.value });
                    if (categoryErrors.name) setCategoryErrors({ ...categoryErrors, name: undefined });
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${categoryErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., Stationery"
                />
                {categoryErrors.name && <p className="text-red-600 text-xs mt-1">{categoryErrors.name}</p>}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Add Category
                </button>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryForm({ name: '' });
                    setCategoryErrors({});
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Salesman Form Modal */}
        {(showSalesmanForm || editingSalesman) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingSalesman ? 'Edit Salesman' : 'Add New Salesman'}
              </h2>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={salesmanForm.name}
                    onChange={e => setSalesmanForm({ ...salesmanForm, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${salesmanErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {salesmanErrors.name && <p className="text-red-600 text-xs mt-1">{salesmanErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info</label>
                  <input
                    type="text"
                    value={salesmanForm.contact_info}
                    onChange={e => setSalesmanForm({ ...salesmanForm, contact_info: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${salesmanErrors.contact_info ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {salesmanErrors.contact_info && <p className="text-red-600 text-xs mt-1">{salesmanErrors.contact_info}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={salesmanForm.address}
                    onChange={e => setSalesmanForm({ ...salesmanForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    value={salesmanForm.joining_date}
                    onChange={e => setSalesmanForm({ ...salesmanForm, joining_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${salesmanErrors.joining_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {salesmanErrors.joining_date && <p className="text-red-600 text-xs mt-1">{salesmanErrors.joining_date}</p>}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={editingSalesman ? handleUpdateSalesman : handleAddSalesman}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {editingSalesman ? 'Update' : 'Add'} Salesman
                </button>
                <button
                  onClick={() => {
                    setShowSalesmanForm(false);
                    setEditingSalesman(null);
                    setSalesmanForm({ name: '', contact_info: '', address: '', joining_date: '' });
                    setSalesmanErrors({});
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Form Modal */}
        {(showCustomerForm || editingCustomer) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${customerErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {customerErrors.name && <p className="text-red-600 text-xs mt-1">{customerErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                  <input
                    type="text"
                    value={customerForm.contact}
                    onChange={e => setCustomerForm({ ...customerForm, contact: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${customerErrors.contact ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {customerErrors.contact && <p className="text-red-600 text-xs mt-1">{customerErrors.contact}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={customerForm.address}
                    onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
                <button
                  onClick={() => {
                    setShowCustomerForm(false);
                    setEditingCustomer(null);
                    setCustomerForm(initialCustomerForm);
                    setCustomerErrors({});
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}



        {/* --- End PIN Modal --- */}

        {/* Confirm Action Modal */}
        <ConfirmModal
          open={confirmOpen}
          message={confirmMessage}
          onConfirm={onConfirmAction}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </PinProtected>
  );
};

{/* // --- PIN Modal (copy from Purchase.jsx) --- */ }

{/* // --- End PIN Modal --- */ }

const ConfirmModal = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
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
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;