import React, { useState } from 'react';
import { Package, Users, Tag, Percent } from 'lucide-react';
import PinProtected from './reusables/PinProtected';
import ProductsTab from './admin/tabs/ProductsTab';
import SuppliersTab from './admin/tabs/SuppliersTab';
import UnitsTab from './admin/tabs/UnitsTab';
import GstTab from './admin/tabs/GstTab';
import CategoriesTab from './admin/tabs/CategoriesTab';
import SalesmanTab from './admin/tabs/SalesmanTab';
import CustomersTab from './admin/tabs/CustomersTab';

const TAB_CONFIG = [
  { id: 'products', name: 'Products', icon: Package, component: ProductsTab },
  { id: 'suppliers', name: 'Suppliers', icon: Users, component: SuppliersTab },
  { id: 'categories', name: 'Categories', icon: Tag, component: CategoriesTab },
  { id: 'units', name: 'Units', icon: Tag, component: UnitsTab },
  { id: 'gst', name: 'GST Rates', icon: Percent, component: GstTab },
  { id: 'salesman', name: 'Salesmen', icon: Users, component: SalesmanTab },
  { id: 'customers', name: 'Customers', icon: Users, component: CustomersTab }
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0].id);

  const ActiveTabComponent =
    TAB_CONFIG.find((tab) => tab.id === activeTab)?.component ?? TAB_CONFIG[0].component;

  return (
    <PinProtected
      message="This module is protected and requires PIN verification to access."
      modulename="Admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage products, suppliers, and system settings</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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
            <ActiveTabComponent />
          </div>
        </div>
      </div>
    </PinProtected>
  );
};

export default Admin;

