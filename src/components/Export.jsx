import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Filter,
  RefreshCw,
  Lock,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'exceljs';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import PinProtected from './reusables/PinProtected';

const Export = () => {

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    category: 'all',
    reportType: 'inventory'
  });

  const exportToExcel = async (data, filename, sheetName) => {
    const workbook = new XLSX.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (filters.reportType === 'inventory') {
      worksheet.columns = [
        { header: 'Item Name', key: 'name', width: 25 },
        { header: 'Category', key: 'category_name', width: 15 },
        { header: 'Current Stock', key: 'current_stock', width: 15 },
        { header: 'Minimum Stock', key: 'minimum_stock', width: 15 },
        { header: 'Unit Price', key: 'unit_price', width: 12 },
        { header: 'Total Value', key: 'total_value', width: 12 },
        { header: 'Last Supplier', key: 'supplier_name', width: 20 }
      ];

      data.forEach(item => {
        worksheet.addRow({
          ...item,
          total_value: item.current_stock * item.unit_price
        });
      });
    } else if (filters.reportType === 'sales') {
      worksheet.columns = [
        { header: 'Bill Number', key: 'bill_number', width: 15 },
        { header: 'Date', key: 'sale_date', width: 12 },
        { header: 'Total Amount', key: 'total_amount', width: 15 },
        { header: 'Discount', key: 'discount', width: 10 }
      ];

      data.forEach(sale => {
        worksheet.addRow({
          ...sale,
          sale_date: new Date(sale.sale_date).toLocaleDateString()
        });
      });
    } else if (filters.reportType === 'purchases') {
      worksheet.columns = [
        { header: 'Invoice Number', key: 'invoice_number', width: 15 },
        { header: 'Date', key: 'purchase_date', width: 12 },
        { header: 'Supplier', key: 'supplier_name', width: 20 },
        { header: 'Total Amount', key: 'total_amount', width: 15 }
      ];

      data.forEach(purchase => {
        worksheet.addRow({
          ...purchase,
          purchase_date: new Date(purchase.purchase_date).toLocaleDateString()
        });
      });
    }

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = (data, filename, title) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(10);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 105, 30, { align: 'center' });
    
    let yPosition = 50;
    
    if (filters.reportType === 'inventory') {
      // Headers
      doc.text('Item Name', 20, yPosition);
      doc.text('Stock', 100, yPosition);
      doc.text('Price', 130, yPosition);
      doc.text('Value', 160, yPosition);
      
      yPosition += 10;
      doc.line(20, yPosition, 190, yPosition);
      
      data.forEach((item) => {
        yPosition += 8;
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(item.name, 20, yPosition);
        doc.text(item.current_stock.toString(), 100, yPosition);
        doc.text(`₹${item.unit_price}`, 130, yPosition);
        doc.text(`₹${(item.current_stock * item.unit_price).toFixed(2)}`, 160, yPosition);
      });
    } else if (filters.reportType === 'sales') {
      // Headers
      doc.text('Bill No', 20, yPosition);
      doc.text('Date', 80, yPosition);
      doc.text('Amount', 130, yPosition);
      
      yPosition += 10;
      doc.line(20, yPosition, 190, yPosition);
      
      data.forEach((sale) => {
        yPosition += 8;
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(sale.bill_number, 20, yPosition);
        doc.text(new Date(sale.sale_date).toLocaleDateString(), 80, yPosition);
        doc.text(`₹${sale.total_amount.toFixed(2)}`, 130, yPosition);
      });
    }
    
    doc.save(filename);
  };

  const handleExport = async (format) => {
    setLoading(true);
    
    try {
      let data = [];
      let filename = '';
      let title = '';
      
      if (filters.reportType === 'inventory') {
        data = await window.electronAPI.getInventory();
        filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
        title = 'Inventory Report';
      } else if (filters.reportType === 'sales') {
        data = await window.electronAPI.getTransactions({
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: 'sales'
        });
        filename = `sales_report_${filters.startDate}_to_${filters.endDate}`;
        title = 'Sales Report';
      } else if (filters.reportType === 'purchases') {
        data = await window.electronAPI.getPurchaseHistory();
        filename = `purchase_report_${new Date().toISOString().split('T')[0]}`;
        title = 'Purchase Report';
      }
      
      if (format === 'excel') {
        await exportToExcel(data, `${filename}.xlsx`, title);
      } else if (format === 'pdf') {
        exportToPDF(data, `${filename}.pdf`, title);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // PIN protection wrapper
  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename="Export">
      {/* ...existing code... */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4">
            <div className="flex items-center bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <span className="font-semibold text-yellow-800">Still Working On</span>
                <p className="text-yellow-700 text-sm">This export module is under development. Some features may not be available yet.</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
            <p className="text-gray-600">Export your data to Excel or PDF formats</p>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Filter className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Export Filters</h2>
            </div>
            {/* ...existing code... */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="inventory">Inventory Report</option>
                  <option value="sales">Sales Report</option>
                  <option value="purchases">Purchase Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          {/* Export Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Download className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => handleExport('excel')}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                )}
                Export to Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 mr-2" />
                )}
                Export to PDF
              </button>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Export Details</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Excel files include all data columns with formatting</li>
                <li>• PDF files are optimized for printing</li>
                <li>• Date filters apply to sales and purchase reports</li>
                <li>• Inventory reports show current stock levels</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Current Inventory</h3>
                <p className="text-sm text-gray-600">Export all items with stock levels</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFilters({ ...filters, reportType: 'inventory' });
                handleExport('excel');
              }}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Quick Excel Export
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Monthly Sales</h3>
                <p className="text-sm text-gray-600">This month's sales report</p>
              </div>
            </div>
            <button
              onClick={() => {
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                setFilters({ 
                  ...filters, 
                  reportType: 'sales',
                  startDate: startOfMonth,
                  endDate: new Date().toISOString().split('T')[0]
                });
                handleExport('pdf');
              }}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Quick PDF Export
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Purchase History</h3>
                <p className="text-sm text-gray-600">All purchase records</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFilters({ ...filters, reportType: 'purchases' });
                handleExport('excel');
              }}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Quick Excel Export
            </button>
          </div>
        </div>
      </div>
      {/* ...existing code... */}
    </PinProtected>
  ); 

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4">
          <div className="flex items-center bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <span className="font-semibold text-yellow-800">Still Working On</span>
              <p className="text-yellow-700 text-sm">This export module is under development. Some features may not be available yet.</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
          <p className="text-gray-600">Export your data to Excel or PDF formats</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Export Filters</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={filters.reportType}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="inventory">Inventory Report</option>
                <option value="sales">Sales Report</option>
                <option value="purchases">Purchase Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        {/* Export Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Download className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleExport('excel')}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 mr-2" />
              )}
              Export to Excel
            </button>
            
            <button
              onClick={() => handleExport('pdf')}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <FileText className="w-5 h-5 mr-2" />
              )}
              Export to PDF
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Export Details</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Excel files include all data columns with formatting</li>
              <li>• PDF files are optimized for printing</li>
              <li>• Date filters apply to sales and purchase reports</li>
              <li>• Inventory reports show current stock levels</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Current Inventory</h3>
              <p className="text-sm text-gray-600">Export all items with stock levels</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilters({ ...filters, reportType: 'inventory' });
              handleExport('excel');
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Quick Excel Export
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Monthly Sales</h3>
              <p className="text-sm text-gray-600">This month's sales report</p>
            </div>
          </div>
          <button
            onClick={() => {
              const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
              setFilters({ 
                ...filters, 
                reportType: 'sales',
                startDate: startOfMonth,
                endDate: new Date().toISOString().split('T')[0]
              });
              handleExport('pdf');
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Quick PDF Export
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Purchase History</h3>
              <p className="text-sm text-gray-600">All purchase records</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilters({ ...filters, reportType: 'purchases' });
              handleExport('excel');
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Quick Excel Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default Export;