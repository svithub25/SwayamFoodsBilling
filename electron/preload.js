const { contextBridge, ipcRenderer } = require('electron');

const channelGroups = {
  app: {
    getAppInfo: 'get-app-info'
  },
  auth: {
    login: 'login',
    verifyPin: 'verify-pin',
    verifyApprovePin: 'verify-approve-pin'
  },
  dashboard: {
    getDashboardData: 'get-dashboard-data'
  },
  inventory: {
    getInventory: 'get-inventory',
    addItem: 'add-item',
    updateItem: 'update-item',
    deleteItem: 'delete-item',
    getItemDetails: 'get-item-details',
    getItems: 'get-items',
    checkSkuExists: 'check-sku-exists',
    checkCategoryExists: 'check-category-exists',
    checkGstExists: 'check-gst-exists',
    getItemPurchaseHistory: 'get-item-purchase-history',
    getNextSku: 'get-next-sku'
  },
  categories: {
    getCategories: 'get-categories',
    addCategory: 'add-category',
    deleteCategory: 'delete-category'
  },
  suppliers: {
    getSuppliers: 'get-suppliers',
    addSupplier: 'add-supplier',
    updateSupplier: 'update-supplier',
    deleteSupplier: 'delete-supplier'
  },
  units: {
    getUnits: 'get-units',
    addUnit: 'add-unit',
    deleteUnit: 'delete-unit'
  },
  gst: {
    getGstRates: 'get-gst-rates',
    addGstRate: 'add-gst-rate',
    deleteGstRate: 'delete-gst-rate'
  },
  purchases: {
    savePurchase: 'save-purchase',
    getPurchaseHistory: 'get-purchase-history',
    getPurchaseDetails: 'get-purchase-details',
    getPurchaseFullDetails: 'get-purchase-full-details',
    generatePurchaseOrderPdf: 'generate-purchase-order-pdf',
    updatePurchase: 'update-purchase',
    checkPurchaseEditStock: 'check-purchase-edit-stock',
    checkPurchaseDeleteStock: 'check-purchase-delete-stock',
    deletePurchase: 'delete-purchase'
  },
  sales: {
    generateBillNumber: 'generate-bill-number',
    saveSale: 'save-sale',
    updateSale: 'update-sale',
    deleteBill: 'delete-bill',
    getSaleDetails: 'get-sale-details',
    getFilteredSales: 'get-filtered-sales',
    updateSalePaidStatus: 'update-sale-paid-status',
    updateSaleApprovedStatus: 'update-sale-approved-status',
    getSalesHistory: 'get-sales-history',
    getSalePaymentForApproval: 'get-sale-payment-for-approval',
    getApprovalHistory: 'get-approval-history',
    getSalesmanCommission: 'get-Salesman-Commission'
  },
  transactions: {
    getTransactions: 'get-transactions'
  },
  analytics: {
    getAnalyticsData: 'get-analytics-data'
  },
  backup: {
    backupDatabase: 'backup-database',
    restoreDatabase: 'restore-database',
    getLastBackupDate: 'get-last-backup-date'
  },
  database: {
    getDatabaseSize: 'get-database-size'
  },
  customers: {
    createCustomerIfNeeded: 'create-customer-if-needed',
    getCustomers: 'get-customers',
    addCustomer: 'add-customer',
    updateCustomer: 'update-customer',
    deleteCustomer: 'delete-customer'
  },
  salesmen: {
    addSalesman: 'add-salesman',
    getSalesmen: 'get-salesmen',
    updateSalesman: 'update-salesman',
    deleteSalesman: 'delete-salesman'
  },
  payments: {
    savePayment: 'save-payment',
    getPaymentDetails: 'get-payment-details',
    updatePaymentStatus: 'update-payment-status',
    savePurchasePayment: 'save-purchase-payment',
    getPurchasePaymentDetails: 'get-purchase-payment-details'
  },
  exports: {
    getExportInventoryData: 'get-export-inventory-data',
    getExportSalesData: 'get-export-sales-data',
    getExportPurchaseData: 'get-export-purchase-data'
  },
  closingStock: {
    updateClosingStock: 'update-closing-stock',
    getClosingStock: 'get-closing-stock'
  },
  messages: {
    getBillMessage: 'get-bill-message',
    setBillMessage: 'set-bill-message'
  },
  printing: {
    printPdf: 'print-pdf'
  }
};

const createInvoker = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

const electronAPI = Object.entries(channelGroups).reduce((api, [, channels]) => {
  Object.entries(channels).forEach(([name, channel]) => {
    api[name] = createInvoker(channel);
  });
  return api;
}, {});

electronAPI.getExportSalesData = (startDateOrParams, maybeEndDate) => {
  const payload =
    typeof startDateOrParams === 'object'
      ? startDateOrParams
      : { startDate: startDateOrParams, endDate: maybeEndDate };
  return ipcRenderer.invoke('get-export-sales-data', payload);
};

electronAPI.getExportPurchaseData = (startDateOrParams, maybeEndDate) => {
  const payload =
    typeof startDateOrParams === 'object'
      ? startDateOrParams
      : { startDate: startDateOrParams, endDate: maybeEndDate };
  return ipcRenderer.invoke('get-export-purchase-data', payload);
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

