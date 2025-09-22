import React from "react";
import companyLogo from "../Assets/logo.png";

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
  return (
    <div
      id="purchase-pdf"
      className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto shadow-lg rounded-2xl border border-[hsl(220_13%_91%)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsl(220_13%_91%)] pb-8 mb-10">
        <div className="flex items-center gap-10">
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-55 h-40 object-contain bg-transparent"
            style={{ boxShadow: "none", border: "none", background: "none" }}
          />
          <div>
            <h1 className="text-3xl font-bold text-[hsl(217_19%_35%)] tracking-tight">
              Books & Stationary
            </h1>
          </div>
        </div>
        <div className="text-right space-y-1">
          <h2 className="text-2xl font-bold text-[hsl(214_84%_56%)]">PURCHASE</h2>
          <div className="text-sm text-[hsl(215.4_16.3%_46.9%)] space-y-1">
            <p>Panchaganga Hospital Building</p>
            <p>Shukrawar Peth</p>
            <p>Kolhapur</p>
          </div>
        </div>
      </div>

      {/* Purchase Details */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-3">
              Purchase Details
            </h3>
            <div className="space-y-2 text-sm">
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
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-3">
              Supplier
            </h3>
            <div className="bg-[hsl(220_14%_96%)] p-4 rounded-lg space-y-1">
              <p className="font-semibold text-[hsl(222.2_84%_4.9%)] text-base">{supplier.name}</p>
              <p className="text-sm text-[hsl(215.4_16.3%_46.9%)]">{supplier.address}</p>
              {supplier.gstin && (
                <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">GSTIN: {supplier.gstin}</p>
              )}
              {supplier.contact && (
                <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">Contact: {supplier.contact}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-[hsl(217_19%_35%)] uppercase tracking-wider mb-4">
          Items
        </h3>
        <div className="overflow-hidden rounded-lg border border-[hsl(220_13%_91%)]">
          <table className="w-full">
            <thead>
              <tr className="bg-[hsl(214_84%_56%)] text-white">
                <th className="text-left py-4 px-6 font-semibold text-sm">Sr No</th>
                <th className="text-left py-4 px-6 font-semibold text-sm">HSN Code</th>
                <th className="text-left py-4 px-6 font-semibold text-sm">SKU</th>
                <th className="text-left py-4 px-6 font-semibold text-sm">Item</th>
                <th className="text-center py-4 px-6 font-semibold text-sm">Quantity</th>
                <th className="text-center py-4 px-6 font-semibold text-sm">Rate</th>
                <th className="text-center py-4 px-6 font-semibold text-sm">GST %</th>
                <th className="text-center py-4 px-6 font-semibold text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-[hsl(220_13%_91%)] ${
                    idx % 2 === 0 ? "bg-white" : "bg-[hsl(220_14%_96%)]"
                  }`}
                >
                  <td className="py-4 px-6 text-sm text-center text-[hsl(222.2_84%_4.9%)]">{idx + 1}</td>
                  <td className="py-4 px-6 text-sm font-mono text-[hsl(215.4_16.3%_46.9%)]">{item.hsn_code}</td>
                  <td className="py-4 px-6 text-sm font-mono text-[hsl(215.4_16.3%_46.9%)]">{item.sku}</td>
                  <td className="py-4 px-6 text-sm text-[hsl(222.2_84%_4.9%)] font-medium">{item.name}</td>
                  <td className="py-4 px-6 text-sm text-center text-[hsl(222.2_84%_4.9%)]">{item.quantity}</td>
                  <td className="py-4 px-6 text-sm text-center text-[hsl(222.2_84%_4.9%)]">₹{item.unit_price}</td>
                  <td className="py-4 px-6 text-sm text-center text-[hsl(222.2_84%_4.9%)]">{item.gst_percentage}%</td>
                  <td className="py-4 px-6 text-sm text-center text-[hsl(222.2_84%_4.9%)]">₹{item.total_price?.toFixed(2) ?? ((item.unit_price * item.quantity).toFixed(2))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="space-y-2 text-right">
          <div>
            <span className="font-semibold">Subtotal:</span>
            <span className="ml-2">₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div>
              <span className="font-semibold text-green-600">Discount ({discount}%):</span>
              <span className="ml-2 text-green-600">-₹{(subtotal * discount / 100).toFixed(2)}</span>
            </div>
          )}
          <div>
            <span className="font-semibold">Rounding Off:</span>
            <span className="ml-2">{roundingOff >= 0 ? '+' : ''}₹{roundingOff.toFixed(2)}</span>
          </div>
          <div>
            <span className="font-bold text-lg">Total:</span>
            <span className="ml-2 font-bold text-lg">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[hsl(220_13%_91%)] pt-6">
        <div className="text-center space-y-2">
          <p className="text-[hsl(217_19%_35%)] font-semibold">
            Thank you for your business!
          </p>
          <p className="text-xs text-[hsl(215.4_16.3%_46.9%)]">
            This is a computer-generated purchase and does not require signature.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-[hsl(215.4_16.3%_46.9%)] mt-4">
            <span>Email: harshank@gmail.com</span>
            <span>•</span>
            <span>Phone: 9923110805</span>
            <span>•</span>
            <span>Web: www.harshank.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchasePDF;