import React, { useState, useEffect } from 'react';
import PinProtected from './reusables/PinProtected';
import { 
  Plus, Banknote, RefreshCw, FileText, Calendar, CheckCircle, 
  Edit, Trash2, Eye, X, ArrowUpCircle, ArrowDownCircle,
  Search, Filter, Download, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'react-toastify';

function Banking() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pdcList, setPdcList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    account_type: 'Current',
    opening_balance: 0,
    opening_balance_type: 'Debit'
  });
  
  const [transactionForm, setTransactionForm] = useState({
    voucher_type: 'Payment',
    transaction_date: new Date().toISOString().split('T')[0],
    bank_account_id: '',
    party_name: '',
    amount: 0,
    payment_mode: 'Cash',
    cheque_number: '',
    cheque_date: '',
    reference_number: '',
    narration: '',
    category_name: '',
    category_type: 'Expense',
    is_pdc: false,
    to_account_id: '' // For Contra
  });

  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    bank_account_id: '',
    voucher_type: '',
    cleared_status: ''
  });

  // Load initial data
  useEffect(() => {
    loadBankAccounts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'pdc') {
      loadPDCList();
    }
  }, [activeTab, filters]);

  // API Functions
  const loadBankAccounts = async () => {
    try {
      const accounts = await window.electronAPI.getBankAccounts();
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast.error('Failed to load bank accounts');
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const txns = await window.electronAPI.getBankTransactions(filters);
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await window.electronAPI.getTransactionCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const loadPDCList = async () => {
    setLoading(true);
    try {
      const pdcs = await window.electronAPI.getPdcList({ 
        startDate: filters.startDate, 
        endDate: filters.endDate 
      });
      setPdcList(pdcs);
    } catch (error) {
      console.error('Error loading PDC list:', error);
      toast.error('Failed to load PDC list: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.account_name || !accountForm.account_number || !accountForm.bank_name) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const result = await window.electronAPI.addBankAccount(accountForm);
      if (result.success) {
        toast.success('Bank account added successfully!');
        setShowAccountModal(false);
        setAccountForm({
          account_name: '',
          account_number: '',
          bank_name: '',
          branch_name: '',
          ifsc_code: '',
          account_type: 'Current',
          opening_balance: 0,
          opening_balance_type: 'Debit'
        });
        loadBankAccounts();
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast.error('Failed to add bank account: ' + error.message);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.bank_account_id || transactionForm.amount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    if (transactionForm.voucher_type === 'Contra' && !transactionForm.to_account_id) {
      toast.error('Please select destination account for Contra entry');
      return;
    }

    try {
      // Generate voucher number
      const voucherNumber = await window.electronAPI.generateVoucherNumber(transactionForm.voucher_type);
      
      const result = await window.electronAPI.saveBankTransaction({
        ...transactionForm,
        voucher_number: voucherNumber,
        created_by: 'admin' // You can get this from auth context
      });
      
      if (result.success) {
        toast.success('Transaction saved successfully!');
        setShowTransactionModal(false);
        resetTransactionForm();
        loadBankAccounts(); // Refresh balances
        loadTransactions();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction: ' + error.message);
    }
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      voucher_type: 'Payment',
      transaction_date: new Date().toISOString().split('T')[0],
      bank_account_id: '',
      party_name: '',
      amount: 0,
      payment_mode: 'Cash',
      cheque_number: '',
      cheque_date: '',
      reference_number: '',
      narration: '',
      category_name: '',
      category_type: 'Expense',
      is_pdc: false,
      to_account_id: ''
    });
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteBankTransaction(transactionId);
      if (result.success) {
        toast.success('Transaction deleted successfully!');
        loadBankAccounts();
        loadTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction: ' + error.message);
    }
  };

  const getTotalBalance = () => {
    return bankAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  };

  const getPendingCheques = () => {
    return pdcList.filter(pdc => pdc.status === 'Pending').length;
  };

  const getUnreconciledCount = () => {
    return transactions.filter(txn => !txn.reconciled && txn.cleared_status === 'Cleared').length;
  };

  return (
    <PinProtected message="This module is protected and requires PIN verification to access." modulename='Banking'>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Banking & Cash Management</h1>
          <p className="text-gray-600">Manage bank accounts, transactions, and reconciliation</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: Banknote },
                { id: 'transactions', name: 'Transactions', icon: FileText },
                { id: 'reconciliation', name: 'Reconciliation', icon: CheckCircle },
                { id: 'pdc', name: 'PDC Management', icon: Calendar },
                { id: 'reports', name: 'Reports', icon: TrendingUp }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <IconComponent className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content based on active tab will continue in next part... */}
      </div>
    </PinProtected>
  );
}

export default Banking;