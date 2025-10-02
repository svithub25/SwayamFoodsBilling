import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,  
  ReceiptIndianRupee,
  FileText,
  BookOpen,  
  Download, 
  Database,
  BarChart3,
  Settings,
  LogOut,
  IndianRupee,
  Menu,
ClipboardList,
MessageSquareShare,
  X,
  User
} from 'lucide-react';
import svi from '../Assets/SVILogo.png'

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Layout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation(); 
  const [overallDiscount, setOverallDiscount] = useState(0);


  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Purchase', href: '/purchase', icon: ShoppingCart },
    { name: 'Purchase Order', href: '/purchase-order', icon: ClipboardList },
    { name: 'Billing', href: '/billing', icon: ReceiptIndianRupee },
    { name: 'Sales History', href: '/sales-history', icon: FileText },
    { name: 'Salesman Commission', href: '/salesman-commission', icon: IndianRupee },
    // { name: 'Ledger', href: '/ledger', icon: BookOpen }, 
    { name: 'Analytics', href: '/analytics', icon: BarChart3 }, 
    { name: 'Export', href: '/export', icon: Download }, 
    { name: 'Backup', href: '/backup', icon: Database },
    { name: 'Admin', href: '/admin', icon: Settings },
    { name: 'Contact Us', href: '/contact', icon: MessageSquareShare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <nav className="fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200"> 
              <h1 className="text-xl font-bold text-gray-900">Billing Software</h1>
              {/* <h1 className="text-xl font-bold text-gray-900">Shiva Books & Stationery</h1> */}
              <button tabIndex={-1} onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
                <X className="w-5 h-5" /> 
              </button>  
            </div> 
            <div className="flex flex-col flex-1 pt-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return ( 
                  <NavLink
                    key={item.name}
                    to={item.href}
                    tabIndex={-1} // <-- Add this line
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-3 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white shadow-lg border-r border-gray-200">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold  text-gray-900">Billing Software</h1>
           {/* <h1 className="text-xl font-bold text-gray-900">Shiva Books & Stationery</h1> */}
        </div>
        <div className="flex flex-col flex-1 pt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href} 
                tabIndex={-1} // <-- Add this line
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`} 
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {/^\/sale\/\d+$/.test(location.pathname)
                ? 'Sale Details'
                : location.pathname.slice(1) || 'Dashboard'}
            </h2> 

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.username}</span>
              </div>
              <button
                onClick={onLogout}
                 tabIndex={-1}  
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
  
        {/* Page content */}
        <main className="p-6 pb-12"> 
          {children}
        </main> 
        <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 text-center py-2 z-50 shadow-sm">
          <span className="text-sm text-gray-500">

             © {new Date().getFullYear()} S V IT Hub. All rights reserved. | Licensed Professional Services Provider
          </span>
        </footer>
      </div>
    </div> 
  );
};

export default Layout;