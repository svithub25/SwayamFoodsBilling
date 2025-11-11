import { toast } from "react-toastify";

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Get status color class
 */
export const getStatusColor = (status) => {
  const colors = {
    Cleared: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Bounced: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-800',
    Deposited: 'bg-blue-100 text-blue-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get voucher type color
 */
export const getVoucherTypeColor = (type) => {
  const colors = {
    Payment: 'bg-red-100 text-red-800',
    Receipt: 'bg-green-100 text-green-800',
    Contra: 'bg-blue-100 text-blue-800',
    Journal: 'bg-purple-100 text-purple-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

/**
 * Check if date is overdue
 */
export const isOverdue = (date) => {
  return new Date(date) < new Date();
};

/**
 * Calculate days difference
 */
export const getDaysDifference = (date1, date2 = new Date()) => {
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN');
  } else if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } else if (format === 'datetime') {
    return d.toLocaleString('en-IN');
  }
  
  return d.toLocaleDateString('en-IN');
};

/**
 * Validate IFSC code
 */
export const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

/**
 * Export to CSV
 */
export const exportToCSV = (data, filename) => {
  // CSV export logic
  console.log('Export to CSV:', filename, data);
  toast.info('CSV export functionality to be implemented');
};

/**
 * Print report
 */
export const printReport = () => {
  window.print();
};