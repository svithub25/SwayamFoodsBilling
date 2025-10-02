import React from "react";
import companyLogo from "../Assets/logo.png";

const ITEMS_PER_PAGE = 10;

function PurchaseOrderPdf({ 
  billNumber, 
  customer, 
  items, 
  discount = 0, 
  subtotal = 0, 
  total = 0 
}) {
  // Split items into pages
  const pages = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  const Header = () => (
    <div className="flex items-center justify-between border-b border-[hsl(220_13%_91%)] pb-6 mb-8">
      <div className="flex items-center gap-8">
        <img
          src={companyLogo}
          alt="Company Logo"
          className="w-45 h-32 object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold text-[hsl(217_19%_35%)]">
            Books & Stationary
          </h1>
        </div>
      </div>
      <div className="text-right space-y-1">
        <h2 className="text-xl font-bold text-[hsl(214_84%_56%)]">PURCHASE ORDER</h2>
        <div className="text-xs text-[hsl(215.4_16.3%_46.9%)] space-y-1">
          <p>Panchaganga Hospital Building</p>
          <p>Shukrawar Peth</p>
          <p>Kolhapur</p>
        </div>
      </div>
    </div>
  );

  const OrderDetails = () => (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-2">
          Order Details
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[hsl(215.4_16.3%_46.9%)]">Order No:</span>
            <span className="font-medium text-[hsl(222.2_84%_4.9%)]">{billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(215.4_16.3%_46.9%)]">Date:</span>
            <span className="font-medium text-[hsl(222.2_84%_4.9%)]">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-2">
          Order To
        </h3>
        <div className="bg-[hsl(220_14%_96%)] p-3 rounded-lg space-y-1">
          <p className="font-semibold text-[hsl(222.2_84%_4.9%)] text-sm">{customer.name}</p>
          <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">{customer.address}</p>
          {customer.gstin && (
            <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">GSTIN: {customer.gstin}</p>
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
              <th className="text-left py-3 px-4 font-semibold text-xs">HSN Code</th>
              {/* <th className="text-left py-3 px-4 font-semibold text-xs">SKU</th> */}
              <th className="text-left py-3 px-4 font-semibold text-xs">Items</th>
              <th className="text-center py-3 px-4 font-semibold text-xs">Quantity</th>
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
                  <td className="py-3 px-4 text-xs font-mono text-[hsl(215.4_16.3%_46.9%)]">{item.hsn_code}</td>
                  {/* <td className="py-3 px-4 text-xs font-mono text-[hsl(215.4_16.3%_46.9%)]">{item.sku}</td> */}
                  <td className="py-3 px-4 text-xs text-[hsl(222.2_84%_4.9%)] font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-xs text-center text-[hsl(222.2_84%_4.9%)]">{item.quantity}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Footer = () => (
    <div className="border-t border-[hsl(220_13%_91%)] pt-4">
      <div className="text-center space-y-2">
        <p className="text-[hsl(217_19%_35%)] font-semibold text-sm">
          Thank you for your business!
        </p>
        <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">
          This is a computer-generated order and does not require signature.
        </p>
        <div className="flex justify-center space-x-4 text-xs text-[hsl(215.4_16.3%_46.9%)] mt-3">
          <span>Email: harshank@gmail.com</span>
          <span>•</span>
          <span>Phone: 9923110805</span>
          <span>•</span>
          <span>Web: www.harshank.com</span>
        </div>
      </div>
    </div>
  );

  return (
    <div id="purchase-order-pdf">
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
            {pageIndex === 0 && <OrderDetails />}
            <ItemsTable 
              pageItems={pageItems} 
              isLastPage={pageIndex === pages.length - 1} 
            />
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

export default PurchaseOrderPdf;