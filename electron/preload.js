const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  verifyPin: (pin) => ipcRenderer.invoke('verify-pin', pin),

  // Dashboard
  getDashboardData: () => ipcRenderer.invoke('get-dashboard-data'),

  // Inventory
  getInventory: () => ipcRenderer.invoke('get-inventory'),
  addItem: (itemData) => ipcRenderer.invoke('add-item', itemData),
  updateItem: (itemData) => ipcRenderer.invoke('update-item', itemData),
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
  getItemDetails: (itemId) => ipcRenderer.invoke('get-item-details', itemId), 
  getCategories: () => ipcRenderer.invoke('get-categories'),
  checkSkuExists: (sku, excludeId) => ipcRenderer.invoke('check-sku-exists', sku, excludeId),
  checkCategoryExists: (name, excludeId) => ipcRenderer.invoke('check-category-exists', name, excludeId), 
  checkGstExists: (rate, excludeId) => ipcRenderer.invoke('check-gst-exists', rate, excludeId),

  // Suppliers
  getSuppliers: () => ipcRenderer.invoke('get-suppliers'),   
  addSupplier: (supplierData) => ipcRenderer.invoke('add-supplier', supplierData),
  updateSupplier: (supplierData) => ipcRenderer.invoke('update-supplier', supplierData),
  deleteSupplier: (id) => ipcRenderer.invoke('delete-supplier', id),

  // Units
  getUnits: () => ipcRenderer.invoke('get-units'),
  addUnit: (unitData) => ipcRenderer.invoke('add-unit', unitData),
  deleteUnit: (id) => ipcRenderer.invoke('delete-unit', id),

  // GST Rates
  getGstRates: () => ipcRenderer.invoke('get-gst-rates'),
  addGstRate: (gstData) => ipcRenderer.invoke('add-gst-rate', gstData),
  deleteGstRate: (id) => ipcRenderer.invoke('delete-gst-rate', id),

  // Purchases
  savePurchase: (purchaseData) => ipcRenderer.invoke('save-purchase', purchaseData),
  getPurchaseHistory: () => ipcRenderer.invoke('get-purchase-history'),
  getPurchaseDetails: (purchaseId) => ipcRenderer.invoke('get-purchase-details', purchaseId),
  getPurchaseFullDetails: (purchaseId) => ipcRenderer.invoke('get-purchase-full-details', purchaseId),
  generatePurchaseOrderPdf: (orderData) => ipcRenderer.invoke('generate-purchase-order-pdf', orderData),
  updatePurchase: (purchaseId, purchaseData) => ipcRenderer.invoke('update-purchase', purchaseId, purchaseData),
  checkPurchaseEditStock: (purchaseId, items) => ipcRenderer.invoke('check-purchase-edit-stock', purchaseId, items),
  checkPurchaseDeleteStock: (purchaseId) => ipcRenderer.invoke('check-purchase-delete-stock', purchaseId),

  // Sales
  generateBillNumber: () => ipcRenderer.invoke('generate-bill-number'),
  saveSale: (saleData) => ipcRenderer.invoke('save-sale', saleData),
  getSaleDetails: (saleId) => ipcRenderer.invoke('get-sale-details', saleId),
  getFilteredSales: (filters) => ipcRenderer.invoke('get-filtered-sales', filters),
  getItemPurchaseHistory: (itemId) => ipcRenderer.invoke('get-item-purchase-history', itemId),
  updateSale: (saleId, saleData) => ipcRenderer.invoke('update-sale', saleId, saleData),
  deleteBill: (billId) => ipcRenderer.invoke('delete-bill', billId),
  deletePurchase: (billId) => ipcRenderer.invoke('delete-purchase', billId),
  updateSalePaidStatus: (saleId, isPaid) => ipcRenderer.invoke('update-sale-paid-status', saleId, isPaid),
  updateSaleApprovedStatus: (saleId, isApproved) => ipcRenderer.invoke('update-sale-approved-status', saleId, isApproved),

  // Transactions
  getTransactions: (filters) => ipcRenderer.invoke('get-transactions', filters),

  // Backup
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: () => ipcRenderer.invoke('restore-database'),
  getLastBackupDate: () => ipcRenderer.invoke('get-last-backup-date'),

  // Analytics
  getAnalyticsData: (filters) => ipcRenderer.invoke('get-analytics-data', filters),
  getSalesHistory: () => ipcRenderer.invoke('get-sales-history'),

  // Categories
  addCategory: (categoryData) => ipcRenderer.invoke('add-category', categoryData),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

  // Database
  getDatabaseSize: () => ipcRenderer.invoke('get-database-size'),

  // Customers
  createCustomerIfNeeded: (customer) => ipcRenderer.invoke('create-customer-if-needed', customer),


//salesman 

addSalesman: (salesmanData) => ipcRenderer.invoke('add-salesman', salesmanData),
getSalesmen: () => ipcRenderer.invoke('get-salesmen'),
updateSalesman: (salesmanData) => ipcRenderer.invoke('update-salesman', salesmanData),
deleteSalesman: (id) => ipcRenderer.invoke('delete-salesman', id),

verifyApprovePin: (pin) => ipcRenderer.invoke('verify-approve-pin', pin),

  // Payments
  savePayment: (paymentData) => ipcRenderer.invoke('save-payment', paymentData),
  getPaymentDetails: (saleId) => ipcRenderer.invoke('get-payment-details', saleId),
  updatePaymentStatus: (paymentVerificationId, status) => ipcRenderer.invoke('update-payment-status', paymentVerificationId, status),
  // Add these to your contextBridge.exposeInMainWorld('electronAPI', {
getSalePaymentForApproval: (saleId) => ipcRenderer.invoke('get-sale-payment-for-approval', saleId),
getApprovalHistory: (saleId) => ipcRenderer.invoke('get-approval-history', saleId),
// Add these to your contextBridge.exposeInMainWorld('electronAPI', {
savePurchasePayment: (paymentData) => ipcRenderer.invoke('save-purchase-payment', paymentData),
getPurchasePaymentDetails: (purchaseId) => ipcRenderer.invoke('get-purchase-payment-details', purchaseId),

 

  getExportInventoryData: () => ipcRenderer.invoke('get-export-inventory-data'),
    getExportSalesData: (startDate, endDate) => ipcRenderer.invoke('get-export-sales-data', startDate, endDate),
      getExportPurchaseData: (startDate, endDate) => ipcRenderer.invoke('get-export-purchase-data', startDate, endDate),








});

