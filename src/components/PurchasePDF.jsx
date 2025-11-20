import React, { useState, useEffect } from "react";
import companyLogo from "../Assets/logo.png";
import { Building2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function PurchasePDF({
  purchaseNumber,
  supplier,
  items,
  discount = 0,
  subtotal = 0,
  roundingOff = 0,
  total = 0,
  purchaseDate = "",
  invoiceNumber = ""
}) {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const result = await window.electronAPI.getCompanyInfo();
      if (result.success && result.data) {
        setCompanyInfo(result.data);
        
        // Load logo if exists
        if (result.data.logo_path) {
          const logoResult = await window.electronAPI.getLogoAsBase64(result.data.logo_path);
          if (logoResult.success) {
            setLogoDataUrl(logoResult.dataUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  // Split items into pages
  const pages = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  const Header = () => (
    <div className="border-b border-[hsl(220_13%_91%)] pb-3 mb-8">
      {/* Invoice text centered */}
      <div className="flex justify-center mb-2">
        <h2 className="text-2xl font-bold text-[hsl(214_84%_56%)]">PURCHASE INVOICE</h2>
      </div>
      
      {/* Company info below */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              alt="Company Logo"
              className="w-28 h-28 object-contain"
            />
          ) : (
            <div className="w-28 h-28 flex items-center justify-center border border-gray-300">
              <Building2 className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        <div className="text-left ml-8 flex-1 space-y-1">
          <h2 className="text-2xl font-bold text-[hsl(217_19%_35%)]">
            {companyInfo?.company_name || 'Company Name'}
          </h2>
          {companyInfo?.tagline && (
            <p className="text-xs italic text-[hsl(215.4_16.3%_46.9%)]">{companyInfo.tagline}</p>
          )}
          <div className="text-xs text-[hsl(215.4_16.3%_46.9%)] space-y-0.5 mt-1">
            {companyInfo?.address_line1 && <p>{companyInfo.address_line1}</p>}
            {companyInfo?.address_line2 && <p>{companyInfo.address_line2}</p>}
            {(companyInfo?.city || companyInfo?.state || companyInfo?.pincode) && (
              <p>
                {[companyInfo?.city, companyInfo?.state, companyInfo?.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {companyInfo?.phone && <p>Phone: {companyInfo.phone}</p>}
            {companyInfo?.mobile && companyInfo?.mobile !== companyInfo?.phone && (
              <p>Mobile: {companyInfo.mobile}</p>
            )}
            {companyInfo?.email && <p>Email: {companyInfo.email}</p>}
            {companyInfo?.gstin && <p>GSTIN: {companyInfo.gstin}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const PurchaseDetails = () => (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-2">
          Purchase Details
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[hsl(215.4_16.3%_46.9%)]">Purchase No:</span>
            <span className="font-medium text-[hsl(222.2_84%_4.9%)]">{purchaseNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(215.4_16.3%_46.9%)]">Invoice No:</span>
            <span className="font-medium text-[hsl(222.2_84%_4.9%)]">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(215.4_16.3%_46.9%)]">Date:</span>
            <span className="font-medium text-[hsl(222.2_84%_4.9%)]">{purchaseDate}</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-2">
          Supplier
        </h3>
        <div className="bg-[hsl(220_14%_96%)] p-3 rounded-lg space-y-1">
          <p className="font-semibold text-[hsl(222.2_84%_4.9%)] text-sm">{supplier.name}</p>
          <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">{supplier.address}</p>
          {supplier.gstin && (
            <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">GSTIN: {supplier.gstin}</p>
          )}
          {supplier.contact && (
            <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">Contact: {supplier.contact}</p>
          )}
        </div>
      </div>
    </div>
  );

  const ItemsTable = ({ pageItems, isLastPage }) => (
    <div className={`${!isLastPage ? 'mb-8' : 'mb-6'}`}>
      <h3 className="text-xs font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-3">
        Items
      </h3>
      <div className="overflow-hidden rounded-lg border border-[hsl(220_13%_91%)]">
        <table className="w-full">
          <thead>
            <tr className="bg-[hsl(214_84%_56%)] text-white">
              <th className="text-left py-3 px-4 font-semibold text-xs">Sr No</th>
              <th className="text-left py-3 px-4 font-semibold text-xs">Item</th>
              <th className="text-center py-3 px-4 font-semibold text-xs">Quantity</th>
              <th className="text-center py-3 px-4 font-semibold text-xs">Rate</th>
              <th className="text-center py-3 px-4 font-semibold text-xs">GST %</th>
              <th className="text-center py-3 px-4 font-semibold text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, idx) => {
              const globalIndex = pages.flat().findIndex(i => i === item);
              return (
                <tr
                  key={idx}
                  className={`border-b border-[hsl(220_13%_91%)] ${
                    idx % 2 === 0 ? "bg-white" : "bg-[hsl(220_14%_96%)]"
                  }`}
                >
                  <td className="py-3 px-4 text-xs text-center text-[hsl(222.2_84%_4.9%)]">{globalIndex + 1}</td>
                  <td className="py-3 px-4 text-xs text-[hsl(222.2_84%_4.9%)] font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-xs text-center text-[hsl(222.2_84%_4.9%)]">{item.quantity}</td>
                  <td className="py-3 px-4 text-xs text-center text-[hsl(222.2_84%_4.9%)]">₹{item.unit_price}</td>
                  <td className="py-3 px-4 text-xs text-center text-[hsl(222.2_84%_4.9%)]">{item.gst_percentage}%</td>
                  <td className="py-3 px-4 text-xs text-center text-[hsl(222.2_84%_4.9%)]">₹{item.total_price?.toFixed(2) ?? ((item.unit_price * item.quantity).toFixed(2))}</td>
                </tr>
              );
            })}
            {/* Fill empty rows to maintain consistent height */}
            {Array.from({ length: ITEMS_PER_PAGE - pageItems.length }, (_, idx) => (
              <tr key={`empty-${idx}`} className="border-b border-[hsl(220_13%_91%)]">
                <td className="py-3 px-4 text-xs">&nbsp;</td>
                <td className="py-3 px-4 text-xs">&nbsp;</td>
                <td className="py-3 px-4 text-xs">&nbsp;</td>
                <td className="py-3 px-4 text-xs">&nbsp;</td>
                <td className="py-3 px-4 text-xs">&nbsp;</td>
                <td className="py-3 px-4 text-xs">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Totals = () => (
    <div className="flex justify-end mb-6">
      <div className="space-y-2 text-right">
        <div>
          <span className="font-semibold text-sm">Subtotal:</span>
          <span className="ml-2 text-sm">₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div>
            <span className="font-semibold text-green-600 text-sm">Discount ({discount}%):</span>
            <span className="ml-2 text-green-600 text-sm">-₹{(subtotal * discount / 100).toFixed(2)}</span>
          </div>
        )}
        {roundingOff !== 0 && (   
        <div>
          <span className="font-semibold text-sm">Rounding Off:</span>
          <span className="ml-2 text-sm">{roundingOff >= 0 ? '+' : '-'}₹{Math.abs(roundingOff).toFixed(2)}</span>
        </div>
        )} 
        <div className="border-t pt-2">
          <span className="font-bold text-base">Total:</span>
          <span className="ml-2 font-bold text-base">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const Footer = () => (
    <div className="border-t border-[hsl(220_13%_91%)] pt-4">
      <div className="text-center space-y-2">
        <p className="text-[hsl(217_19%_35%)] font-semibold text-sm">
          {companyInfo?.footer_text || 'Thank you for your business!'}
        </p>
        <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">
          This is a computer-generated purchase and does not require signature.
        </p>
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(215.4_16.3%_46.9%)] mt-3">
          {companyInfo?.email && <span>Email: {companyInfo.email}</span>}
          {companyInfo?.email && (companyInfo?.phone || companyInfo?.mobile) && <span>•</span>}
          {(companyInfo?.phone || companyInfo?.mobile) && (
            <span>Phone: {companyInfo?.phone || companyInfo?.mobile}</span>
          )}
          {companyInfo?.website && <span>•</span>}
          {companyInfo?.website && <span>Web: {companyInfo.website}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div id="purchase-pdf">
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white p-8 w-[210mm] h-[297mm] mx-auto shadow-lg border border-[hsl(220_13%_91%)] flex flex-col justify-between"
          style={{ 
            width: '210mm',
            height: '297mm',
            minHeight: '297mm',
            maxHeight: '297mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="flex-1">
            <Header />
            {pageIndex === 0 && <PurchaseDetails />}
            <ItemsTable 
              pageItems={pageItems} 
              isLastPage={pageIndex === pages.length - 1} 
            />
            {pageIndex === pages.length - 1 && <Totals />}
          </div>
          <Footer />
          {/* Page number */}
          {pages.length > 1 && (
            <div className="text-center text-xs text-[hsl(215.4_16.3%_46.9%)] mt-2">
              Page {pageIndex + 1} of {pages.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PurchasePDF;