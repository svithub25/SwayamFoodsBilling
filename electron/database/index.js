import Database from 'better-sqlite3';

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

  `);

  const defaultUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!defaultUser) {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'admin');
  }

  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('last_backup', new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('bill_counter', '0');

  return db;
}


