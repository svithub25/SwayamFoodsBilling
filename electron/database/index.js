import Database from 'better-sqlite3';
import { runMigrations } from './migrations.js';

export function initDatabase(dbPath) {
  const db = new Database(dbPath);

  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT  NOT NULL,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    gstin TEXT,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT ,
    hsn_code TEXT,
    description TEXT,
    unit TEXT DEFAULT 'pcs',
    mrp REAL DEFAULT 0,
    purchase_rate REAL DEFAULT 0,
    sale_rate REAL DEFAULT 0,
    customer_rate REAL DEFAULT 0,
    salesman_rate REAL DEFAULT 0,
    gst_percentage REAL DEFAULT 0,
    category_id INTEGER DEFAULT NULL,
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
    last_supplier_id INTEGER DEFAULT NULL,
    last_purchase_date DATETIME DEFAULT NULL,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (last_supplier_id) REFERENCES suppliers (id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    invoice_number TEXT,
    purchase_date DATE NOT NULL,
    total_amount REAL DEFAULT 0,
    cgst_total REAL DEFAULT 0,
    sgst_total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    is_paid INTEGER DEFAULT 0,
    payment_method TEXT,
    rounding_off REAL DEFAULT 0,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
  );

  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    gst_percentage REAL NOT NULL DEFAULT 0,
    cgst_amount REAL NOT NULL DEFAULT 0,
    sgst_amount REAL NOT NULL DEFAULT 0,
    discount REAL DEFAULT 0,
    total_price REAL NOT NULL,
    status_code INTEGER DEFAULT 0,
    FOREIGN KEY (purchase_id) REFERENCES purchases (id),
    FOREIGN KEY (item_id) REFERENCES items (id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_contact TEXT,
    customer_address TEXT,
    customer_gstin TEXT,
    salesman_id INTEGER DEFAULT NULL,
    sale_type TEXT DEFAULT 'customer',
    sale_date DATE NOT NULL,
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    rounding_off REAL DEFAULT 0,
    cgst_total REAL DEFAULT 0,
    sgst_total REAL DEFAULT 0,
    is_paid INTEGER DEFAULT 0,

    is_approved INTEGER DEFAULT 0,
    payment_method TEXT,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    gst_percentage REAL NOT NULL DEFAULT 0,
    cgst_amount REAL NOT NULL DEFAULT 0,
    sgst_amount REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL,
    sale_type TEXT DEFAULT 'customer',
    customer_rate REAL DEFAULT 0,
    salesman_rate REAL DEFAULT 0,
    status_code INTEGER DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (item_id) REFERENCES items (id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    status_code INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gst_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate REAL  NOT NULL,
    description TEXT,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT UNIQUE,
    address TEXT,
    gstin TEXT,
    status_code INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS salesman (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_info TEXT,
  address TEXT,
  joining_date DATE,
  status_code INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

   CREATE TABLE IF NOT EXISTS license (
    machine_id TEXT PRIMARY KEY,
    activated_on DATETIME DEFAULT CURRENT_TIMESTAMP
  );


CREATE TABLE IF NOT EXISTS payment_verification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER DEFAULT NULL,
  purchase_id INTEGER DEFAULT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'neft_rtgs', 'cheque')),
  amount REAL NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales (id),
  FOREIGN KEY (purchase_id) REFERENCES purchases (id)
);

CREATE TABLE IF NOT EXISTS payment_upi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_verification_id INTEGER NOT NULL,
  transaction_id TEXT,
  upi_id TEXT,
  app_name TEXT,
  reference_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_verification_id) REFERENCES payment_verification (id)
);

CREATE TABLE IF NOT EXISTS payment_cash (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_verification_id INTEGER NOT NULL,
  denomination_notes TEXT,
  received_by TEXT,
  receipt_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_verification_id) REFERENCES payment_verification (id)
);

CREATE TABLE IF NOT EXISTS payment_neft_rtgs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_verification_id INTEGER NOT NULL,
  transaction_reference TEXT,
  sender_bank TEXT,
  sender_account TEXT,
  receiver_bank TEXT,
  receiver_account TEXT,
  transfer_type TEXT CHECK(transfer_type IN ('neft', 'rtgs')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_verification_id) REFERENCES payment_verification (id)
);

CREATE TABLE IF NOT EXISTS payment_cheque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_verification_id INTEGER NOT NULL,
  cheque_number TEXT,
  bank_name TEXT,
  branch_name TEXT,
  cheque_date DATE,
  drawer_name TEXT,
  micr_code TEXT,
  status TEXT DEFAULT 'received' CHECK(status IN ('received', 'deposited', 'cleared', 'bounced')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_verification_id) REFERENCES payment_verification (id)
);

CREATE TABLE IF NOT EXISTS closing_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  closing_date TEXT,
  closing_qty REAL,
  purchase_rate REAL,
  closing_amount REAL,
  FOREIGN KEY(item_id) REFERENCES items(id)
);


  CREATE TABLE IF NOT EXISTS bill_message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    status_code INTEGER DEFAULT 0,
    is_print INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
   

CREATE TABLE IF NOT EXISTS sale_item_cost_allocation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_item_id INTEGER NOT NULL,
  purchase_item_id INTEGER NOT NULL,
  quantity_allocated REAL NOT NULL,
  purchase_rate REAL NOT NULL,
  cost_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items (id),
  FOREIGN KEY (purchase_item_id) REFERENCES purchase_items (id)
);

 CREATE TABLE IF NOT EXISTS opening_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    financial_year TEXT NOT NULL,
    opening_qty REAL NOT NULL,
    opening_rate REAL NOT NULL,
    opening_amount REAL NOT NULL,
    opening_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id),
    UNIQUE(item_id, financial_year)
  );

  `);

  const defaultUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!defaultUser) {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'admin');
  }

  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('last_backup', new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('bill_counter', '0');
// Add to your database initialization:
db.exec(`
  -- Bank Accounts Master
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_name TEXT NOT NULL ,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    branch_name TEXT,
    ifsc_code TEXT,
    account_type TEXT CHECK(account_type IN ('Savings', 'Current', 'Cash Credit', 'Overdraft')) DEFAULT 'Current',
    opening_balance REAL DEFAULT 0,
   -- opening_balance_type TEXT CHECK(opening_balance_type IN ('Debit', 'Credit')) DEFAULT 'Debit',
    current_balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status_code INTEGER DEFAULT 0
  );

  -- Bank Transactions

CREATE TABLE IF NOT EXISTS bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_number TEXT NOT NULL ,
  voucher_type TEXT NOT NULL CHECK(voucher_type IN ('Payment', 'Receipt', 'Contra')),
  transaction_date TEXT NOT NULL,
  bank_account_id INTEGER NOT NULL,
  party_name TEXT,
  amount REAL NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Debit', 'Credit')),
  cheque_number TEXT,
  cheque_date TEXT,
  narration TEXT,
  cleared_status TEXT DEFAULT 'Pending' CHECK(cleared_status IN ('Pending', 'Deposited', 'Cleared', 'Bounced', 'Cancelled')),
  cleared_date TEXT,
  reconciled INTEGER DEFAULT 0,
  reconciled_date TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status_code INTEGER DEFAULT 0,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);


  -- Bank Transaction Ledger Entries (for double entry)
  CREATE TABLE IF NOT EXISTS bank_ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    ledger_type TEXT CHECK(ledger_type IN ('Bank', 'Party', 'Expense', 'Income')) NOT NULL,
    ledger_name TEXT NOT NULL,
    debit_amount REAL DEFAULT 0,
    credit_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES bank_transactions (id) ON DELETE CASCADE
  );

  -- Bank Reconciliation
  CREATE TABLE IF NOT EXISTS bank_reconciliation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_account_id INTEGER NOT NULL,
    statement_date DATE NOT NULL,
    statement_balance REAL NOT NULL,
    book_balance REAL NOT NULL,
    difference REAL NOT NULL,
    reconciled_by TEXT,
    reconciled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id)
  );

  -- Expense/Income Categories
  CREATE TABLE IF NOT EXISTS transaction_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL UNIQUE,
    category_type TEXT CHECK(category_type IN ('Expense', 'Income')) NOT NULL,
    description TEXT,
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Replace the post_dated_cheques table creation with this updated version:
  CREATE TABLE IF NOT EXISTS post_dated_cheques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    cheque_number TEXT NOT NULL,
    cheque_date DATE NOT NULL,
    amount REAL NOT NULL,
    party_name TEXT NOT NULL,
    bank_name TEXT,
    status TEXT CHECK(status IN ('Pending', 'Deposited', 'Cleared', 'Bounced', 'Cancelled')) DEFAULT 'Pending',
    deposit_date DATE,
    cleared_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES bank_transactions (id)
  );

   CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
  CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
  CREATE INDEX IF NOT EXISTS idx_bank_transactions_voucher ON bank_transactions(voucher_number);
  CREATE INDEX IF NOT EXISTS idx_pdc_status ON post_dated_cheques(status);
  CREATE INDEX IF NOT EXISTS idx_pdc_date ON post_dated_cheques(cheque_date);
`);

// Insert default categories
// Insert default categories
db.exec(`
  INSERT OR IGNORE INTO transaction_categories (category_name, category_type, description, is_default) VALUES
  -- EXPENSE CATEGORIES
  ('Purchase of Goods', 'Expense', 'Purchase of trading/raw material goods', 1),
  ('Salary & Wages', 'Expense', 'Employee salaries and daily wages', 1),
  ('Rent', 'Expense', 'Office/Shop/Warehouse rent', 1),
  ('Electricity', 'Expense', 'Power and electricity bills', 1),
  ('Telephone & Internet', 'Expense', 'Communication expenses', 1),
  ('Transportation & Freight', 'Expense', 'Vehicle, fuel, and freight charges', 1),
  ('Packaging Material', 'Expense', 'Boxes, bags, and packaging supplies', 1),
  ('Loading & Unloading', 'Expense', 'Labour charges for loading/unloading', 1),
  ('Stationery & Printing', 'Expense', 'Office supplies and printing', 1),
  ('Bank Charges', 'Expense', 'Bank fees, charges, and commission', 1),
  ('Interest on Loan', 'Expense', 'Interest paid on business loans', 1),
  ('GST Payment', 'Expense', 'GST paid to government', 1),
  ('TDS Payment', 'Expense', 'TDS deducted and paid', 1),
  ('Professional Fees', 'Expense', 'CA, Legal, Consultant fees', 1),
  ('Repairs & Maintenance', 'Expense', 'Equipment and building maintenance', 1),
  ('Vehicle Maintenance', 'Expense', 'Vehicle servicing and repairs', 1),
  ('Insurance Premium', 'Expense', 'Business and vehicle insurance', 1),
  ('License & Registration', 'Expense', 'FSSAI, Trade License, GST registration', 1),
  ('Marketing & Advertising', 'Expense', 'Promotion and advertising costs', 1),
  ('Travelling & Conveyance', 'Expense', 'Business travel expenses', 1),
  ('Office Expenses', 'Expense', 'General office running expenses', 1),
  ('Security Charges', 'Expense', 'Watchman and security services', 1),
  ('Water Charges', 'Expense', 'Water supply bills', 1),
  ('Charitable Donations', 'Expense', 'Donations and CSR activities', 1),
  ('Miscellaneous Expenses', 'Expense', 'Other small expenses', 1),
  
  -- INCOME CATEGORIES
  ('Sales Revenue', 'Income', 'Revenue from sales of goods', 1),
  ('Cash Discount Received', 'Income', 'Discount received from suppliers', 1),
  ('Interest Received', 'Income', 'Interest from bank deposits/FD', 1),
  ('Commission Received', 'Income', 'Commission earned from business', 1),
  ('Scrap Sales', 'Income', 'Sale of scrap material', 1),
  ('Rental Income', 'Income', 'Income from property rent', 1),
  ('TDS Refund', 'Income', 'TDS refund received', 1),
  ('GST Refund', 'Income', 'GST refund from government', 1),
  ('Bank Interest', 'Income', 'Interest credited by bank', 1),
  ('Other Income', 'Income', 'Miscellaneous income', 1);
`);
//opening stock 
db.exec(`
   -- Enhanced opening stock table (already exists, but ensure it has all needed columns)
  CREATE TABLE IF NOT EXISTS opening_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    financial_year TEXT NOT NULL,
    opening_qty REAL NOT NULL,
    opening_rate REAL NOT NULL,
    opening_amount REAL NOT NULL,
    opening_date DATE NOT NULL,
    is_locked INTEGER DEFAULT 0,  -- NEW: Prevent tampering
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id),
    UNIQUE(item_id, financial_year)
  );

  -- Create index for faster queries
  CREATE INDEX IF NOT EXISTS idx_opening_stock_item_fy 
  ON opening_stock(item_id, financial_year);
`);

const defaultCashAccount = db.prepare('SELECT * FROM bank_accounts WHERE account_name = ?').get('Cash');
if (!defaultCashAccount) {
  db.prepare(`
    INSERT INTO bank_accounts 
    (account_name, account_number, bank_name, branch_name, ifsc_code, account_type, opening_balance, current_balance, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Cash',           // account_name
    'CASH-001',       // account_number
    'Cash in Hand',   // bank_name
    'N/A',           // branch_name
    'N/A',           // ifsc_code
    'Current',       // account_type
    0,               // opening_balance
    0,               // current_balance
    1                // is_active
  );
}

  try {
    runMigrations(db);
  } catch (error) {
    console.error('❌ Migration error:', error);
  }


  return db;
}


