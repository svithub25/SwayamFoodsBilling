import React from "react";
import companyLogo from "../Assets/logo.png";

const ITEMS_PER_PAGE = 10;

function BillPDF({ billNumber, customer, items, discount = 0, subtotal = 0, roundingOff = 0, total = 0, sale_type = "", salesman_name = "", salesman_contact = "", salesman_address = "", note = ""}) {
  // Split items into pages
  console.log(salesman_contact)  
  const pages = []; 
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  const Header = () => (
    <div className="flex items-center   border-b border-[hsl(0,0%,0%)] pb-2 mb-2">
      <div className="flex items-center gap-8">
        <img
          src={companyLogo}
          alt="Company Logo"
          className="w-45 h-32 object-contain"
        />
        {/* <div>
          <h1 className="text-2xl font-bold text-[hsl(217_19%_35%)]">
            Swayam
          </h1>
        </div> */}
      </div>
      <div className="text-left ml-12 space-y-1">
      
          <h2 className="text-2xl font-bold text-[hsl(0,0%,0%)]">INVOICE</h2>
          <div className="text-sm text-[hsl(0,0%,0%)] space-y-1">
            <p>Office Add. : 1815, D Ward, Shukrawar Peth, kadre Galli, near Piwla wada, Kolhapur</p>
            <p>Shop Add. : Tele Galli, Sukrawar Peth, Kolhapur</p>
            {/* <p>Kolhapur</p> */}
            <p>Phone: 9371446315</p>
          </div>
        </div>
    </div>
  );

  

  // Determine what to show based on sale_type
  const getBilledToInfo = () => {
    if (sale_type === "customer") {
      return {
        name: customer.name,
        address: customer.address || "",
        contact: customer.contact || "",
        gstin: customer.gstin || ""
      };
    } else if (sale_type === "salesman") {
      return {
        name: salesman_name,
        address: salesman_address,
        contact: salesman_contact,
        gstin: ""
      };
    } else if (sale_type === "others") {
      return {
        name: customer.name || "",
        address: customer.address || "",
        contact: customer.contact || "",
        gstin: customer.gstin || ""
      };
    }
    return { name: "", address: "", contact: "", gstin: "" };
  };

  const billedTo = getBilledToInfo();
  const showSalesmanDetails = sale_type === "customer";
  const displaySalesmanName = sale_type === "others" ? "Swayam" : salesman_name;

  const BillDetails = () => (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(0,0%,0%)] uppercase tracking-wider mb-2">
          Bill Details
        </h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-[hsl(0,0%,0%)]">Bill No:</span>
            <span className="font-medium text-[hsl(0,0%,0%)]">{billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(0,0%,0%)]">Date:</span>
            <span className="font-medium text-[hsl(0,0%,0%)]">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          {showSalesmanDetails && displaySalesmanName && (
            <div className="flex justify-between">
              <span className="text-[hsl(0,0%,0%)]">Salesman:</span>
              <span className="font-medium text-[hsl(0,0%,0%)]">{displaySalesmanName}</span>
            </div>
          )}
          {sale_type==="others" && displaySalesmanName && (
            <div className="flex justify-between"> 
              <span className="text-[hsl(0,0%,0%)]">Salesman:</span>
              <span className="font-medium text-[hsl(0,0%,0%)]">{displaySalesmanName}</span>
            </div>
          )}
          {showSalesmanDetails && salesman_contact && (
            <div className="flex justify-between">
              <span className="text-[hsl(0,0%,0%)]">Salesman Contact:</span>
              <span className="font-medium text-[hsl(0,0%,0%)]">{salesman_contact}</span>
            </div>
          )}
          {showSalesmanDetails && salesman_address && (
            <div className="flex justify-between">
              <span className="text-[hsl(0,0%,0%)]">Salesman Address:</span>
              <span className="font-medium text-[hsl(0,0%,0%)]">{salesman_address}</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(0,0%,0%)] uppercase tracking-wider mb-2">
          Billed To
        </h3>
        <div className="bg-[hsl(0,0%,100%)] border border-[hsl(0,0%,0%)] p-1 rounded-lg space-y-1">
          <p className="font-semibold text-[hsl(0,0%,0%)] text-base">{billedTo.name}</p>
          {billedTo.address && (
            <p className="text-sm text-[hsl(0,0%,0%)] text-base">{billedTo.address}</p>
          )}
          {billedTo.gstin && (
            <p className="text-sm text-[hsl(0,0%,0%)] text-base">GSTIN: {billedTo.gstin}</p>
          )}
          {billedTo.contact && (
            <p className="text-sm text-[hsl(0,0%,0%)] text-base">Contact: {billedTo.contact}</p>
          )}
        </div>
      </div>
    </div>
  );

  const ItemsTable = ({ pageItems, isLastPage }) => (
    <div className={`${!isLastPage ? 'mb-4' : 'mb-4'}`}>
     
      <div className="overflow-hidden rounded-lg border border-[hsl(0,0%,0%)]">
          <table className="w-full " > 
          <thead>
            <tr className="bg-[hsl(0,0%,100%)] border-b border-[hsl(0,0%,0%)] text-black">
              <th className="text-left py-3 px-4  font-semibold text-sm w-[40px]">Sr No</th>
              <th className="text-left py-3 px-4 font-semibold text-sm w-[40%]">Item</th>
              <th className="text-center py-3 px-4 font-semibold text-sm w-[12%]">Quantity</th>
              <th className="text-center py-3 px-4 font-semibold text-sm w-[14%]">Rate</th>
              <th className="text-center py-3 px-4 font-semibold text-sm w-[14%]">Total</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, idx) => {
              const globalIndex = pages.flat().findIndex(i => i === item);
              return (
                <tr
                  key={idx}
                  className={`border-b border-[hsl(0,0%,0%)]`}
                >
                  <td className="py-3 px-4 text-sm text-left text-[hsl(0,0%,0%)]">{globalIndex + 1}</td>
                  <td className="py-3 px-4 text-sm text-[hsl(0,0%,0%)] font-medium w-[40%]">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-center text-[hsl(0,0%,0%)] w-[12%]">{item.quantity}</td>
                  <td className="py-3 px-4 text-sm text-center text-[hsl(0,0%,0%)] w-[14%]">₹{item.unit_price}</td>
                  <td className="py-3 px-4 text-sm text-center text-[hsl(0,0%,0%)] w-[14%]">₹{(item.unit_price * item.quantity).toFixed(2)}</td>
                </tr>
              );
            })}
            {/* Fill empty rows to maintain consistent height */}
            {Array.from({ length: ITEMS_PER_PAGE - pageItems.length }, (_, idx) => (
              <tr key={`empty-${idx}`} className="border-b border-[hsl(220_13%_91%)]">
                <td className="py-3 px-4 text-sm">&nbsp;</td>
                <td className="py-3 px-4 text-sm" colSpan={4}>&nbsp;</td>
              </tr>
            ))} 
          </tbody>
        </table>
        
      </div>
       {/* {pages.length > 1 && (
            <div className="text-left text-sm text-[hsl(0,0%,0%)] ml-4 mt-2">
              To be continued on next page... 
            </div>
          )} */}
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
            <span className="font-semibold text-black text-sm">Discount ({discount}%):</span>
            <span className="ml-2 text-black text-sm">-₹{(subtotal * discount / 100).toFixed(2)}</span>
          </div>
        )}
         {roundingOff !== 0 && (
          <div>
            <span className="font-semibold text-sm">Rounding Off:</span>
            <span className="ml-2 text-sm">{roundingOff >= 0 ? '+' : ''}₹{roundingOff.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t  border-[hsl(0,0%,0%)] pt-2">
          <span className="font-bold text-base">Total:</span>
          <span className="ml-2 font-bold text-base">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
const Footer = () => (
  <div>
    {note && note.trim().length > 0 && (<div className="mb-4 text-sm border border-black p-2 rounded-md text-[hsl(0,0%,0%)]">
      <strong>Remark : </strong>
     
     {note}
    </div>)}
    <div className="border-t border-[hsl(0,0%,0%)] pt-4">
      <div className="text-center space-y-2">
        <p className="text-[hsl(0,0%,0%)] font-semibold text-sm">
          Thank you for your business!
        </p>
       
        <div className="flex justify-center space-x-4 text-xs text-[hsl(0,0%,0%)] mt-3">
          <span>Email: swayamkolhapur@gmail.com</span>
          <span>•</span>
          <span>Phone: 9371446315</span>
          <span>•</span>
          <span>Facebook : स्वयंम् </span>
          <span>•</span>
          <span>Instagram : swayamkolhapur </span>
        </div>
      </div>
    </div>
  </div>
);
  return (
    <div id="bill-pdf">
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
            {pageIndex === 0 && <BillDetails />}
            <ItemsTable 
              pageItems={pageItems} 
              isLastPage={pageIndex === pages.length - 1} 
            />
            {pageIndex === pages.length - 1 && <Totals />}
          </div>
          <Footer />
          {/* Page number */}
          {pages.length > 1 && (
            <div className="text-center text-sm text-[hsl(0,0%,0%)] mt-2">
              Page {pageIndex + 1} of {pages.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default BillPDF;