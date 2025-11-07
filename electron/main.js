import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import path from 'path';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
 import { execSync } from "child_process";
const isDev = process.env.NODE_ENV === 'development';
import { app, BrowserWindow, dialog,shell, ipcMain } from 'electron' ;
import { fileURLToPath } from 'url';
import { dirname } from 'path'; 
import Database from 'better-sqlite3'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 👇 ADD THIS: define dbPath globally
const dbPath = isDev 
  ? path.join(__dirname, '..', 'database.db')
  : path.join(process.resourcesPath, 'database.db');


const packageJsonPath = isDev
  ? path.join(__dirname, '..', 'package.json')
  : path.join(process.resourcesPath, 'package.json');


const exePath = isDev 
  ? path.join(__dirname, "..", "get_machine_id.exe") // dev path
  : path.join(process.resourcesPath, "get_machine_id.exe"); // prod path

let machineId;
try {
  machineId = execSync(exePath).toString().trim();
  console.log("Current Machine ID:", machineId);
} catch (err) {
  console.error("Failed to get machine ID:", err);
}

let mainWindow;
let db;


// Initialize SQLite database 
function initDatabase() {
  db = new Database(dbPath);
  
  // Create tables
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
  denomination_notes TEXT, -- JSON string for different denominations
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

  // Insert default data
  const defaultUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!defaultUser) {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'admin');
  } 

  // Insert default categories
  // const categories = ['Pens', 'Papers', 'Files', 'Notebooks', 'Stationery'];
  // const categoryStmt = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  // categories.forEach(cat => categoryStmt.run(cat));

  // Insert default suppliers
  // const suppliers = [
  //   { name: 'ABC Stationery', contact: '9876543210', address: 'Mumbai, Maharashtra', gstin: '27ABCDE1234F1Z5' },
  //   { name: 'XYZ Supplies', contact: '9876543211', address: 'Delhi, NCR', gstin: '07XYZAB1234C1Z8' },
  //   { name: 'Best Papers Ltd', contact: '9876543212', address: 'Bangalore, Karnataka', gstin: '29BESTPA1234P1Z2' }
  // ];
  // const supplierStmt = db.prepare('INSERT OR IGNORE INTO suppliers (name, contact, address, gstin) VALUES (?, ?, ?, ?)');
  // suppliers.forEach(supplier => supplierStmt.run(supplier.name, supplier.contact, supplier.address, supplier.gstin));

  // Insert sample items
  // const sampleItems = [
  //   { name: 'Ball Point Pen Blue', sku: 'PEN001', hsn_code: '96081010', category_id: 1, current_stock: 150, minimum_stock: 20, mrp: 15.00, purchase_rate: 10.00, sale_rate: 12.00, gst_percentage: 18, unit: 'pcs' },
  //   { name: 'A4 Copy Paper', sku: 'PAP001', hsn_code: '48025610', category_id: 2, current_stock: 50, minimum_stock: 10, mrp: 350.00, purchase_rate: 250.00, sale_rate: 280.00, gst_percentage: 12, unit: 'ream' },
  //   { name: 'Ring File', sku: 'FIL001', hsn_code: '48201030', category_id: 3, current_stock: 8, minimum_stock: 15, mrp: 55.00, purchase_rate: 35.00, sale_rate: 45.00, gst_percentage: 18, unit: 'pcs' },
  //   { name: 'Spiral Notebook', sku: 'NOT001', hsn_code: '48201010', category_id: 4, current_stock: 25, minimum_stock: 12, mrp: 100.00, purchase_rate: 70.00, sale_rate: 85.00, gst_percentage: 12, unit: 'pcs' },
  //   { name: 'Stapler', sku: 'STA001', hsn_code: '83051000', category_id: 5, current_stock: 5, minimum_stock: 8, mrp: 150.00, purchase_rate: 100.00, sale_rate: 125.00, gst_percentage: 18, unit: 'pcs' }
  // ];
  // const itemStmt = db.prepare('INSERT OR IGNORE INTO items (name, sku, hsn_code, category_id, current_stock, minimum_stock, mrp, purchase_rate, sale_rate, gst_percentage, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  // sampleItems.forEach(item => itemStmt.run(item.name, item.sku, item.hsn_code, item.category_id, item.current_stock, item.minimum_stock, item.mrp, item.purchase_rate, item.sale_rate, item.gst_percentage, item.unit));

  // Insert settings
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('last_backup', new Date().toISOString());
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('bill_counter', '0');

  // Insert default units
  // const units = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'box', 'pack', 'ream', 'dozen'];
  // const unitStmt = db.prepare('INSERT OR IGNORE INTO units (name) VALUES (?)');
  // units.forEach(unit => unitStmt.run(unit));

  // Insert default GST rates
  // const gstRates = [
  //   { rate: 0, description: 'Exempt' },
  //   { rate: 5, description: 'Essential goods' },
  //   { rate: 12, description: 'Standard rate' },
  //   { rate: 18, description: 'Standard rate' },
  //   { rate: 28, description: 'Luxury goods' }
  // ];
  // const gstStmt = db.prepare('INSERT OR IGNORE INTO gst_rates (rate, description) VALUES (?, ?)');
  // gstRates.forEach(gst => gstStmt.run(gst.rate, gst.description));



//   setTableIdStart('users', 101);
// setTableIdStart('categories', 3001);
// setTableIdStart('suppliers', 2001);
// setTableIdStart('items', 1001);
// setTableIdStart('purchases', 1);
// setTableIdStart('purchase_items', 6001);
// setTableIdStart('sales', 7001);
// setTableIdStart('sale_items', 8001);
// setTableIdStart('customer', 9001);
// setTableIdStart('units', 4001);
// setTableIdStart('gst_rates', 5001);
// setTableIdStart('salesman', 6001);
// setTableIdStart('closing_stock', 13001);


//   function setTableIdStart(table, start) {
//   // Check if entry exists
//   const exists = db.prepare('SELECT 1 FROM sqlite_sequence WHERE name = ?').get(table);
//   if (exists) {
//     db.prepare('UPDATE sqlite_sequence SET seq = ? WHERE name = ?').run(start - 1, table);
//   } else {
//     db.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').run(table, start - 1);
//   }
// }
}




function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { nodeIntegration: true },
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname,  'favicon.ico'),
    show: false
  }); 


  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
    
  mainWindow.loadURL(startUrl);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  mainWindow.on('blur', () => console.log('Window lost focus')); 
  mainWindow.on('focus', () => console.log('Window focused')); 
 mainWindow.on('focus', () => console.log(__dirname)); 
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  initDatabase();
  const id = getPythonMachineId();
  // License check AFTER db is initialized
  // if (!validateLicense()) {
  //   dialog.showErrorBox('License Error', 'This software is not activated for this computer. ' );
  //   app.quit();
  //   return; 
  // }

  createWindow(); 
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit(); // Only quit, do NOT backup or close DB here
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for database operations
ipcMain.handle('login', async (event, username, password) => {
  try {
    // Query your users table and return user object if valid, else null
    const user = db.prepare('SELECT id, username FROM users WHERE username = ? AND password = ?').get(username, password);
    return user || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

ipcMain.handle('verify-pin', async (event, pin) => {
  try {
    return pin === '4040';
  } catch (error) {
    console.error(error);
    throw error;
  }
});  

ipcMain.handle('get-dashboard-data', async () => {
  try {
    const totalSales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM sales  
      WHERE sale_date >= date('now', '-30 days')
      and (status_code = 0 OR status_code IS NULL)
    `).get();
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM items where (status_code = 0 OR status_code IS NULL)').get();
    const lowStockItems = db.prepare('SELECT COUNT(*) as count FROM items WHERE current_stock < minimum_stock and (status_code = 0 OR status_code IS NULL)').get();
    const totalInventoryValue = db.prepare('SELECT COALESCE(SUM(current_stock * customer_rate), 0) as total FROM items where (status_code = 0 OR status_code IS NULL)').get();
    const recentSales = db.prepare(`
      SELECT DATE(sale_date) as date, SUM(total_amount) as amount 
      FROM sales 
      WHERE sale_date >= date('now', '-30 days')
      GROUP BY DATE(sale_date) 
      ORDER BY sale_date DESC 
      LIMIT 30 
    `).all();
    const lowStockItemsList = db.prepare(`
      SELECT i.name, i.current_stock, i.minimum_stock, c.name as category
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.current_stock < i.minimum_stock and (i.status_code = 0 OR i.status_code IS NULL)
      LIMIT 12
    `).all();
    return {
      totalSales: totalSales.total,
      totalItems: totalItems.count,
      lowStockCount: lowStockItems.count,
      totalInventoryValue: totalInventoryValue.total,
      salesChart: recentSales,
      lowStockItems: lowStockItemsList
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});

ipcMain.handle('get-inventory', async () => {
  try {
    const items = db.prepare(`
      SELECT i.*, c.name as category_name, s.name as supplier_name, s.gstin as supplier_gstin
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.last_supplier_id = s.id
      WHERE (i.status_code = 0 OR i.status_code IS NULL)
      ORDER BY i.name
    `).all();
    return items;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

// Add this IPC handler to check SKU uniqueness
ipcMain.handle('check-sku-exists', async (event, sku, excludeId = null) => {
  try {
    let query = 'SELECT id FROM items WHERE sku = ? AND (status_code = 0 OR status_code IS NULL)';
    let params = [sku];
    if (excludeId) {
      query += ' AND id != ?'; 
      params.push(excludeId);
    } 
    const row = db.prepare(query).get(...params);
    return !!row;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

ipcMain.handle('check-category-exists', async (event, name, excludeId = null) => {
  try {
    let query = 'SELECT id FROM categories WHERE name = ? AND (status_code = 0 OR status_code IS NULL)';
    let params = [name ];
    if (excludeId) {
      query += ' AND id != ?'; 
      params.push(excludeId);
    } 
    const row = db.prepare(query).get(...params);
    return !!row;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

ipcMain.handle('check-gst-exists', async (event, rate, excludeId = null) => {
  try {
    let query = 'SELECT id FROM gst_rates WHERE rate = ? AND (status_code = 0 OR status_code IS NULL)';
    let params = [rate];
    if (excludeId) {
      query += ' AND id != ?'; 
      params.push(excludeId);
    } 
    const row = db.prepare(query).get(...params);
    return !!row;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

// Modify add-item to check SKU before insert
ipcMain.handle('add-item', async (event, itemData) => {
  try {
    const exists = db.prepare('SELECT id FROM items WHERE sku = ? AND (status_code = 0 OR status_code IS NULL)').get(itemData.sku);
    if (exists) throw new Error('SKU already exists');
    const stmt = db.prepare(
      `INSERT INTO items 
        (name, sku, hsn_code, description, unit, mrp, purchase_rate, sale_rate, customer_rate, salesman_rate, gst_percentage, category_id, current_stock, minimum_stock) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      itemData.name, itemData.sku, itemData.hsn_code, itemData.description, itemData.unit,
      itemData.mrp, itemData.purchase_rate, itemData.sale_rate, itemData.customer_rate, itemData.salesman_rate,
      itemData.gst_percentage, itemData.category_id, itemData.current_stock, itemData.minimum_stock
    );
    return { id: result.lastInsertRowid, ...itemData };
  } catch (error) {
    console.error(error);
    throw error;
  }
});

// Modify update-item to check SKU before update (exclude current id)
ipcMain.handle('update-item', async (event, { id, sku, ...rest }) => {
  try {
    const exists = db.prepare('SELECT id FROM items WHERE sku = ? AND id != ? AND (status_code = 0 OR status_code IS NULL)').get(sku, id);
    if (exists) throw new Error('SKU already exists');
    const stmt = db.prepare(
      `UPDATE items SET 
        name = ?, sku = ?, hsn_code = ?, description = ?, unit = ?, mrp = ?, purchase_rate = ?, sale_rate = ?, customer_rate = ?, salesman_rate = ?, gst_percentage = ?, category_id = ?, current_stock = ?, minimum_stock = ? 
      WHERE id = ?`
    );
    const result = stmt.run(
      rest.name, sku, rest.hsn_code, rest.description, rest.unit,
      rest.mrp, rest.purchase_rate, rest.sale_rate, rest.customer_rate, rest.salesman_rate,
      rest.gst_percentage, rest.category_id, rest.current_stock, rest.minimum_stock, id
    );
    return result.changes > 0;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

ipcMain.handle('delete-item', async (event, id) => {
  try {
    const stmt = db.prepare('UPDATE items SET status_code = 1 WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

ipcMain.handle('get-categories', async () => {
  return db.prepare('SELECT * FROM categories WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name').all(); 
});
ipcMain.handle('get-items', async () => {
  return db.prepare('SELECT * FROM items WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name').all(); 
});

ipcMain.handle('get-suppliers', async () => {
  return db.prepare('SELECT * FROM suppliers WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name').all();
});

ipcMain.handle('add-supplier', async (event, { name, contact, address, gstin }) => {
  const stmt = db.prepare('INSERT INTO suppliers (name, contact, address, gstin) VALUES (?, ?, ?, ?)');
  const result = stmt.run(name, contact, address, gstin);
  return { id: result.lastInsertRowid, name, contact, address, gstin };
});

ipcMain.handle('update-supplier', async (event, { id, name, contact, address, gstin }) => {
  const stmt = db.prepare('UPDATE suppliers SET name = ?, contact = ?, address = ?, gstin = ? WHERE id = ?');
  const result = stmt.run(name, contact, address, gstin, id);
  return result.changes > 0;
});

ipcMain.handle('delete-supplier', async (event, id) => {
  const stmt = db.prepare('UPDATE suppliers SET status_code = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

ipcMain.handle('get-units', async () => {
  return db.prepare('SELECT * FROM units WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name').all();
});

ipcMain.handle('add-unit', async (event, { name }) => {
  const stmt = db.prepare('INSERT INTO units (name) VALUES (?)');
  const result = stmt.run(name);
  return { id: result.lastInsertRowid, name };
});

ipcMain.handle('delete-unit', async (event, id) => {
  const stmt = db.prepare('UPDATE units SET status_code = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

ipcMain.handle('get-gst-rates', async () => {
  return db.prepare('SELECT * FROM gst_rates WHERE (status_code = 0 OR status_code IS NULL) ORDER BY rate').all();
});

ipcMain.handle('add-gst-rate', async (event, { rate, description }) => {
  const stmt = db.prepare('INSERT INTO gst_rates (rate, description) VALUES (?, ?)');
  const result = stmt.run(rate, description);
  return { id: result.lastInsertRowid, rate, description };
});

ipcMain.handle('delete-gst-rate', async (event, id) => {
  const stmt = db.prepare('UPDATE gst_rates SET status_code = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

ipcMain.handle('save-purchase', async (event, { supplier_id, invoice_number, purchase_date, items, total_amount, cgst_total, sgst_total, rounding_off, discount }) => {
  const purchaseStmt = db.prepare('INSERT INTO purchases (supplier_id, invoice_number, purchase_date, total_amount, cgst_total, sgst_total, rounding_off, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const purchaseResult = purchaseStmt.run(supplier_id, invoice_number, purchase_date, total_amount, cgst_total, sgst_total, rounding_off, discount);
  const purchaseId = purchaseResult.lastInsertRowid;

  const purchaseItemStmt = db.prepare('INSERT INTO purchase_items (purchase_id, item_id, quantity, unit_price, gst_percentage, cgst_amount, sgst_amount, total_price, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const updateItemStmt = db.prepare('UPDATE items SET current_stock = current_stock + ?, last_supplier_id = ?, last_purchase_date = ? WHERE id = ?');

  items.forEach(item => {
    purchaseItemStmt.run(purchaseId, item.id, item.quantity, item.unit_price, item.gst_percentage, item.cgst_amount, item.sgst_amount, item.total_price, item.discount || 0);
    updateItemStmt.run(item.quantity, supplier_id, purchase_date, item.id);
  });

  return { success: true, purchaseId };
});

ipcMain.handle('get-purchase-history', async () => {
  const purchases = db.prepare(`
    SELECT p.*, s.name as supplier_name,
           COALESCE(p.is_paid, 0) as is_paid,
           COALESCE(p.payment_method, '') as payment_method
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE (p.status_code = 0 OR p.status_code IS NULL)
    AND (s.status_code = 0 OR s.status_code IS NULL)
    ORDER BY p.purchase_date DESC
  `).all();

  return purchases;
});

ipcMain.handle('get-purchase-details', async (event, purchaseId) => {
  // Get purchase and supplier details
  const purchase = db.prepare(`
    SELECT 
      p.*, 
      s.name as supplier_name, 
      s.contact as supplier_contact, 
      s.address as supplier_address, 
      s.gstin as supplier_gstin
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `).get(purchaseId);

  // Get purchase items
  const items = db.prepare(`
    SELECT pi.*, i.name as item_name, i.sku, i.hsn_code, i.unit
    FROM purchase_items pi
    LEFT JOIN items i ON pi.item_id = i.id
    WHERE pi.purchase_id = ? 
  `).all(purchaseId);

  // Calculate GST totals
  let cgst_total = 0, sgst_total = 0, gst_total = 0;
  items.forEach(item => {
    cgst_total += item.cgst_amount || 0;
    sgst_total += item.sgst_amount || 0;
    gst_total += (item.cgst_amount || 0) + (item.sgst_amount || 0);
  });

  return { 
    purchase, 
    items, 
    gst: {
      cgst_total,
      sgst_total,
      gst_total
    }
  };
});

ipcMain.handle('generate-bill-number', async () => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const yearSuffix = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;

  // Get the last bill number from sales table 
  const lastBill = db.prepare(`
    SELECT bill_number FROM sales 
    WHERE bill_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`SF/${yearSuffix}/%`);

  let nextNumber = 1;
  if (lastBill && lastBill.bill_number) {
    // Extract the numeric part from the bill number
    const match = lastBill.bill_number.match(/SF\/\d{2}-\d{2}\/(\d+)/);
    if (match && match[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  } 
 
  return `SF/${yearSuffix}/${nextNumber.toString().padStart(0, '0')}`;
});

ipcMain.handle('save-sale', async (event, saleData) => {
  const {
    bill_number, customer_name, customer_contact, customer_address, customer_gstin,
    sale_date, items, discount, total_amount, rounding_off, salesman_id, sale_type
  } = saleData;

  // Save sale_type at sale level
  const saleStmt = db.prepare(
    'INSERT INTO sales (bill_number, customer_name, customer_contact, customer_address, customer_gstin, sale_date, discount, total_amount, rounding_off, salesman_id, sale_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const saleResult = saleStmt.run(
    bill_number, customer_name, customer_contact, customer_address, customer_gstin,
    sale_date, discount, total_amount, rounding_off, salesman_id, sale_type || 'customer'
  );
  const saleId = saleResult.lastInsertRowid;

  // Save sale_type and rates at item level
  const saleItemStmt = db.prepare(
    `INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, total_price, sale_type, customer_rate, salesman_rate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateStockStmt = db.prepare('UPDATE items SET current_stock = current_stock - ? WHERE id = ?');

  items.forEach(item => {
    // Fetch rates from items table if not provided
    const itemRates = db.prepare('SELECT customer_rate, salesman_rate FROM items WHERE id = ?').get(item.id);
    const customerRate = typeof item.customer_rate !== 'undefined' ? item.customer_rate : itemRates?.customer_rate || 0;
    const salesmanRate = typeof item.salesman_rate !== 'undefined' ? item.salesman_rate : itemRates?.salesman_rate || 0;

    saleItemStmt.run(
      saleId,
      item.id,
      item.quantity,
      item.unit_price,
      item.total_price,
      sale_type || 'customer',
      customerRate,
      salesmanRate
    );
    updateStockStmt.run(item.quantity, item.id);

    reduceClosingStock(item.id, item.quantity);
  });

  return { success: true, saleId };
});

ipcMain.handle('get-item-purchase-history', async (event, itemId) => {
  const history = db.prepare(`
    SELECT pi.*, p.purchase_date, s.name as supplier_name, s.gstin as supplier_gstin
    FROM purchase_items pi
    LEFT JOIN purchases p ON pi.purchase_id = p.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE pi.item_id = ?
    ORDER BY p.purchase_date DESC
  `).all(itemId); 
    
  return history;
});


ipcMain.handle('delete-bill', async (event, billId) => {
  // Get sale items
  const saleItems = db.prepare('SELECT item_id, quantity FROM sale_items WHERE sale_id = ? AND (status_code = 0 OR status_code IS NULL)').all(billId);

  // Check if reverting sale will cause any item to go negative
  for (const item of saleItems) {
    const stock = db.prepare('SELECT current_stock FROM items WHERE id = ?').get(item.item_id)?.current_stock || 0;
    // Reverting sale: add back quantity
    // No negative check needed for sale delete (adding stock back can't go negative)
    // But you may want to set a max stock limit if needed
  }

  // Revert inventory: add back sold quantities
  for (const item of saleItems) {
    db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?').run(item.quantity, item.item_id);
  }

  // Soft delete sale and sale_items
  db.prepare('UPDATE sales SET status_code = 1 WHERE id = ?').run(billId);
  db.prepare('UPDATE sale_items SET status_code = 1 WHERE sale_id = ?').run(billId);

  return { success: true };
});

ipcMain.handle('delete-purchase', async (event, purchaseId) => {
  // Get purchase items
  const purchaseItems = db.prepare('SELECT item_id, quantity FROM purchase_items WHERE purchase_id = ? AND (status_code = 0 OR status_code IS NULL)').all(purchaseId);

  // Check if reverting purchase will cause any item to go negative
  for (const item of purchaseItems) {
    const stock = db.prepare('SELECT current_stock FROM items WHERE id = ?').get(item.item_id)?.current_stock || 0;
    // Reverting purchase: subtract quantity
    if (stock - item.quantity < 0) {
      return { success: false, message: `Cannot delete purchase: Stock for item ID ${item.item_id} will go negative.` };
    }
  }

  // Revert inventory: subtract purchased quantities
  for (const item of purchaseItems) {
    db.prepare('UPDATE items SET current_stock = current_stock - ? WHERE id = ?').run(item.quantity, item.item_id);
  }

  // Soft delete purchase and purchase_items
  db.prepare('UPDATE purchases SET status_code = 1 WHERE id = ?').run(purchaseId);
  db.prepare('UPDATE purchase_items SET status_code = 1 WHERE purchase_id = ?').run(purchaseId);

  return { success: true };
});  


ipcMain.handle('get-item-details', async (event, itemId) => {
  const item = db.prepare(`
    SELECT i.*, c.name as category_name, s.name as supplier_name, s.gstin as supplier_gstin
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.last_supplier_id = s.id
    WHERE i.id = ? and (i.status_code = 0 OR i.status_code IS NULL)
  `).get(itemId);

  const purchaseHistory = await ipcMain.handle('get-item-purchase-history', null, itemId);
  
  return { ...item, purchaseHistory };
});

ipcMain.handle('get-purchase-full-details', async (event, purchaseId) => {
  const purchase = db.prepare(`
    SELECT p.*, s.name as supplier_name, s.contact as supplier_contact, s.address as supplier_address, s.gstin as supplier_gstin
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `).get(purchaseId);

  const items = await ipcMain.handle('get-purchase-details', null, purchaseId);
  
  return { ...purchase, items };
});

ipcMain.handle('get-sale-details', async (event, saleId) => {
  try {
    // Get sale details
    const sale = db.prepare(`
      SELECT s.*, sm.name as salesman_name, sm.contact_info as salesman_contact, sm.address as salesman_address
      FROM sales s
      LEFT JOIN salesman sm ON s.salesman_id = sm.id
      WHERE s.id = ?
    `).get(saleId);

    if (!sale) {
      throw new Error('Sale not found');
    }

    // Get sale items
    const items = db.prepare(`
      SELECT si.*, i.name as item_name, i.hsn_code, i.sku , i.current_stock
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      WHERE si.sale_id = ?
      AND (si.status_code = 0 OR si.status_code IS NULL)
    `).all(saleId);

    return {
      ...sale,
      salesman: sale.salesman_name,
      salesman_contact_info: sale.salesman_contact,
      salesman_address: sale.salesman_address,
      items
    };
  } catch (error) {
    console.error('Error getting sale details:', error);
    throw error;
  }
});

ipcMain.handle('generate-purchase-order-pdf', async (event, orderData) => {
  // This would generate a PDF for the purchase order
  // For now, return success - PDF generation would be handled in the frontend
  return { success: true, orderData };
});


ipcMain.handle('get-transactions', async (event, { startDate, endDate, type }) => {
  let transactions = [];

  if (type === 'all' || type === 'sales') {
    // Get all sales with detailed item information
    const sales = db.prepare(`
      SELECT 
        s.id,
        s.bill_number,
        s.sale_date,
        s.total_amount,
        s.customer_name
      FROM sales s
      WHERE s.sale_date BETWEEN ? AND ?
      AND (s.status_code = 0 OR s.status_code IS NULL)
      ORDER BY s.sale_date ASC
    `).all(startDate, endDate);

    for (const sale of sales) {
      // Get sale items with their quantities and prices
      const saleItems = db.prepare(`
        SELECT 
          si.item_id,
          si.quantity as sold_quantity,
          si.unit_price as sale_price,
          si.total_price as sale_total
        FROM sale_items si
        WHERE si.sale_id = ?
        AND (si.status_code = 0 OR si.status_code IS NULL)
      `).all(sale.id);

      // Calculate cost of goods sold (COGS) using FIFO method
      let totalCost = 0;
      let totalRevenue = 0;

      for (const saleItem of saleItems) {
        totalRevenue += saleItem.sale_total || 0;
        let remainingQty = saleItem.sold_quantity;

        // Get all purchases for this item before or on the sale date, ordered by date (FIFO)
        const purchases = db.prepare(`
          SELECT 
            pi.quantity as purchase_qty,
            pi.unit_price as purchase_rate,
            p.purchase_date
          FROM purchase_items pi
          JOIN purchases p ON pi.purchase_id = p.id
          WHERE pi.item_id = ?
          AND p.purchase_date <= ?
          AND (pi.status_code = 0 OR pi.status_code IS NULL)
          AND (p.status_code = 0 OR p.status_code IS NULL)
          ORDER BY p.purchase_date ASC, p.id ASC
        `).all(saleItem.item_id, sale.sale_date);

        // Apply FIFO costing
        for (const purchase of purchases) {
          if (remainingQty <= 0) break;

          const qtyToUse = Math.min(remainingQty, purchase.purchase_qty);
          const costForThisBatch = qtyToUse * purchase.purchase_rate;
          
          totalCost += costForThisBatch;
          remainingQty -= qtyToUse;
        }

        // If still remaining quantity (no purchase found), use current item purchase rate
        if (remainingQty > 0) {
          const currentRate = db.prepare(`
            SELECT purchase_rate FROM items WHERE id = ?
          `).get(saleItem.item_id);
          
          if (currentRate) {
            totalCost += remainingQty * currentRate.purchase_rate;
          }
        }
      }

      const grossProfit = totalRevenue - totalCost;

      transactions.push({
        type: 'sale',
        ref_number: sale.bill_number,
        date: sale.sale_date,
        amount: sale.total_amount,
        cost: totalCost,
        revenue: totalRevenue,
        gross_profit: grossProfit,
        description: `Sale - ${sale.customer_name || 'Walk-in Customer'}`
      });
    }
  }

  if (type === 'all' || type === 'purchases') {
    const purchases = db.prepare(`
      SELECT 
        p.id,
        p.invoice_number,
        p.purchase_date,
        p.total_amount,
        s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.purchase_date BETWEEN ? AND ?
      AND (p.status_code = 0 OR p.status_code IS NULL)
    `).all(startDate, endDate);

    purchases.forEach(purchase => {
      transactions.push({
        type: 'purchase',
        ref_number: purchase.invoice_number,
        date: purchase.purchase_date,
        amount: purchase.total_amount,
        cost: purchase.total_amount,
        revenue: 0,
        gross_profit: 0, // Purchases don't have profit, only cost
        description: `Purchase - ${purchase.supplier_name || 'Unknown Supplier'}`
      });
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return transactions;
});



ipcMain.handle('backup-database', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Backup Database',
      defaultPath: `billing_software_backup_${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'Database Files', extensions: ['db'] }]
    });

    if (!result.canceled) {
      db.backup(result.filePath);
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(new Date().toISOString(), 'last_backup');
      return { success: true, path: result.filePath };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-database', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Restore Database',
      filters: [{ name: 'Database Files', extensions: ['db'] }],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const backupPath = result.filePaths[0];
      const dbPath = isDev 
        ? path.join(__dirname, '..', 'database.db')
        : path.join(process.resourcesPath, 'database.db');

      // Close current DB
      if (db) db.close();

      // Overwrite current DB with backup
      fs.copyFileSync(backupPath, dbPath);

      // Re-open DB
      db = new Database(dbPath);

      return { success: true };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-last-backup-date', async () => {
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_backup');
  return result ? result.value : null;
});
// Analytics handlers
ipcMain.handle('get-analytics-data', async (event, { timeFilter } = {}) => {
  try {
    const safeResult = () => ({
      overview: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, growthRate: 0, topCustomer: 'N/A' },
      topSellingItems: [],
      salesByCategory: [],
      salesChart: [],
      dailyAnalysis: [],
      weeklyAnalysis: [],
      monthlyTrends: [],
      yearlyAnalysis: [],
      customerAnalysis: []
    });

    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    let startDate = '1970-01-01';

    switch ((timeFilter || 'all')) {
      case 'daily':
        startDate = endDate;
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
        break;
      case 'quarterly':
        startDate = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 86400000).toISOString().slice(0, 10);
        break;
      case 'all':
      default:
        startDate = '1970-01-01';
    }

    // Overview
    const totalSales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
    `).get(startDate, endDate);

    const totalOrders = db.prepare(`
      SELECT COUNT(*) AS count
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
    `).get(startDate, endDate);

    const avgOrderValue = totalOrders.count > 0 ? totalSales.total / totalOrders.count : 0;

    const topCustomer = db.prepare(`
      SELECT 
        COALESCE(c.name, s.customer_name, 'N/A') AS customer_name,
        COALESCE(c.contact, s.customer_contact, '') AS customer_contact,
        SUM(s.total_amount) AS revenue
      FROM sales s
      LEFT JOIN customer c ON c.contact = s.customer_contact
      WHERE 
        s.customer_contact IS NOT NULL
        AND LENGTH(TRIM(s.customer_contact)) = 10
        AND s.customer_contact GLOB '[0-9]*'
        AND DATE(s.sale_date) BETWEEN ? AND ?
        AND (s.status_code = 0 OR s.status_code IS NULL)
       
      GROUP BY s.customer_contact
      ORDER BY revenue DESC
      LIMIT 1
    `).get(startDate, endDate);

    // Top selling items
    const topSellingItems = db.prepare(`
      SELECT i.name,
             SUM(si.quantity) AS quantity,
             SUM(si.total_price) AS revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN items i ON si.item_id = i.id 
      WHERE DATE(s.sale_date) BETWEEN ? AND ?
      AND (s.status_code = 0 OR s.status_code IS NULL)
      AND (si.status_code = 0 OR si.status_code IS NULL)
      
      GROUP BY si.item_id, i.name
      ORDER BY revenue DESC
      LIMIT 10
    `).all(startDate, endDate);

    // Sales by category
    const salesByCategory = db.prepare(`
      SELECT COALESCE(c.name, 'Uncategorized') AS category,
             SUM(si.total_price) AS amount,
             COUNT(DISTINCT i.id) AS items
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN items i ON si.item_id = i.id 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE DATE(s.sale_date) BETWEEN ? AND ?
      AND (s.status_code = 0 OR s.status_code IS NULL)
      AND (si.status_code = 0 OR si.status_code IS NULL)
      
      GROUP BY c.id, category
      ORDER BY amount DESC
    `).all(startDate, endDate);

    // Sales chart (by day)
    const salesChart = db.prepare(`
      SELECT DATE(sale_date) AS date,
             SUM(total_amount) AS amount,
             COUNT(*) AS orders
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
      GROUP BY DATE(sale_date)
      ORDER BY DATE(sale_date) ASC
    `).all(startDate, endDate);

    // Daily analysis
    const dailyAnalysis = db.prepare(`
      SELECT 
        CASE strftime('%w', sale_date)
          WHEN '0' THEN 'Sunday'
          WHEN '1' THEN 'Monday'
          WHEN '2' THEN 'Tuesday'
          WHEN '3' THEN 'Wednesday'
          WHEN '4' THEN 'Thursday'
          WHEN '5' THEN 'Friday'
          WHEN '6' THEN 'Saturday'
        END AS day,
        AVG(total_amount) AS avgSales,
        SUM(total_amount) AS totalSales,
        COUNT(*) AS orders
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
      GROUP BY strftime('%w', sale_date)
      ORDER BY strftime('%w', sale_date)
    `).all(startDate, endDate);

    // Weekly analysis (year-week)
    const weeklyAnalysis = db.prepare(`
      SELECT 
        strftime('%Y-%W', sale_date) AS week,
        MIN(DATE(sale_date)) AS week_start,
        MAX(DATE(sale_date)) AS week_end,
        SUM(total_amount) AS sales,
        COUNT(*) AS orders
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
      GROUP BY strftime('%Y-%W', sale_date)
      ORDER BY week_start ASC
    `).all(startDate, endDate);

    // Monthly trends
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', sale_date) AS month,
        SUM(total_amount) AS sales,
        COUNT(*) AS orders
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
      GROUP BY month
      ORDER BY month ASC
    `).all(startDate, endDate);

    // Yearly analysis
    const yearlyAnalysis = db.prepare(`
      SELECT 
        strftime('%Y', sale_date) AS year,
        SUM(total_amount) AS sales,
        COUNT(*) AS orders
      FROM sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
      AND (status_code = 0 OR status_code IS NULL)
      GROUP BY year
      ORDER BY year ASC
    `).all(startDate, endDate);

    // Customer segments (per-customer aggregation)
    const customerAnalysis = db.prepare(`
      WITH per_customer AS (
        SELECT 
          COALESCE(c.name, s.customer_name, 'N/A') AS customer_name,
          COALESCE(c.contact, s.customer_contact, '') AS customer_contact,
          SUM(s.total_amount) AS total
        FROM sales s
        LEFT JOIN customer c ON c.contact = s.customer_contact
        WHERE 
          s.customer_contact IS NOT NULL
          AND LENGTH(TRIM(s.customer_contact)) = 10
          AND s.customer_contact GLOB '[0-9]*'
          AND DATE(s.sale_date) BETWEEN ? AND ?
        GROUP BY s.customer_contact
      )
      SELECT 
        CASE 
          WHEN total >= 200000 THEN 'Wholesale'
          WHEN total >= 100000 THEN 'Premium'
          WHEN total >= 20000 THEN 'Regular'
          ELSE 'New'
        END AS segment,
        COUNT(*) AS count,
        SUM(total) AS revenue,
        AVG(total) AS avgOrder
      FROM per_customer
      GROUP BY segment
      ORDER BY revenue DESC
    `).all(startDate, endDate);
     // Get inventory with category names for category analysis
    const inventoryWithCategories = db.prepare(`
      SELECT i.*, COALESCE(c.name, 'Uncategorized') as category_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE (i.status_code = 0 OR i.status_code IS NULL)
    `).all();

    // Get sale items with category information
    const saleItemsWithCategories = db.prepare(`
      SELECT si.*, i.name as item_name, i.id as item_id,
             COALESCE(c.name, 'Uncategorized') as category_name
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN items i ON si.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE DATE(s.sale_date) BETWEEN ? AND ?
      AND (s.status_code = 0 OR s.status_code IS NULL)
      AND (si.status_code = 0 OR si.status_code IS NULL)
    `).all(startDate, endDate);

    // Get purchase items with category information
    const purchaseItemsWithCategories = db.prepare(`
      SELECT pi.*, i.name as item_name, i.id as item_id,
             COALESCE(c.name, 'Uncategorized') as category_name
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      LEFT JOIN items i ON pi.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE DATE(p.purchase_date) BETWEEN ? AND ?
      AND (p.status_code = 0 OR p.status_code IS NULL)
      AND (pi.status_code = 0 OR pi.status_code IS NULL)
    `).all(startDate, endDate);

    return {
      overview: {
        totalRevenue: totalSales.total,
        totalOrders: totalOrders.count,
        avgOrderValue,
        growthRate: 0,
        topCustomer: topCustomer?.customer_name || 'N/A',
        topCustomerContact: topCustomer?.customer_contact || '',
        topCustomerRevenue: topCustomer?.revenue || 0
      },
      topSellingItems,
      salesByCategory,
      salesChart,
      dailyAnalysis,
      weeklyAnalysis,
      monthlyTrends,
      yearlyAnalysis,
      customerAnalysis,
       inventoryWithCategories,
      saleItemsWithCategories,
      purchaseItemsWithCategories
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return {
      overview: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, growthRate: 0, topCustomer: 'N/A' },
      topSellingItems: [],
      salesByCategory: [],
      salesChart: [],
      dailyAnalysis: [],
      weeklyAnalysis: [],
      monthlyTrends: [],
      yearlyAnalysis: [],
      customerAnalysis: []
    };
  }
});

// Get sales history
// ipcMain.handle('get-sales-history', async () => {
//   const sales = db.prepare(`
//       SELECT s.*, COUNT(si.id) as item_count,
//           COALESCE(s.cgst_total, 0) as cgst_total,
//           COALESCE(s.sgst_total, 0) as sgst_total,
//           COALESCE(s.is_paid, 0) as is_paid,
//           COALESCE(s.is_approved, 0) as is_approved,
//           COALESCE(s.payment_method, '') as payment_method,
//           salesman.name AS salesman
//     FROM sales s
//     LEFT JOIN sale_items si ON s.id = si.sale_id
//     LEFT JOIN salesman ON s.salesman_id = salesman.id
//     WHERE (s.status_code = 0 OR s.status_code IS NULL) 
//     AND (si.status_code = 0 OR si.status_code IS NULL)
//     GROUP BY s.id 
//     ORDER BY s.sale_date DESC
//   `).all();
  
//   return sales;
// });

// Get filtered sales history
ipcMain.handle('get-filtered-sales', async (event, { startDate, endDate, customer, item, salesman }) => {
  let query = `
    SELECT s.*, COUNT(si.id) as item_count,
       COALESCE(s.cgst_total, 0) as cgst_total,
       COALESCE(s.sgst_total, 0) as sgst_total,
       COALESCE(s.is_paid, 0) as is_paid,
       COALESCE(s.is_approved, 0) as is_approved,
       salesman.name AS salesman
FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN salesman ON s.salesman_id = salesman.id
    WHERE (s.status_code = 0 OR s.status_code IS NULL)
    AND (si.status_code = 0 OR si.status_code IS NULL)
  `;
  const params = [];

  if (startDate) {
    query += ' AND s.sale_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND s.sale_date <= ?';
    params.push(endDate);
  }
  if (customer) {
    query += ' AND s.customer_name LIKE ?';
    params.push(`%${customer}%`);
  }
  if (item) {
    query += ` AND EXISTS (
      SELECT 1 FROM sale_items si2 
      LEFT JOIN items i ON si2.item_id = i.id 
      WHERE si2.sale_id = s.id AND i.name LIKE ?
    )`;
    params.push(`%${item}%`);
  }
  if (salesman) {
    query += ' AND s.salesman_id = ?';
    params.push(salesman);
  }

  query += ' GROUP BY s.id ORDER BY s.sale_date DESC';

  return db.prepare(query).all(...params);
});

// Add category
ipcMain.handle('add-category', async (event, category) => {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const result = stmt.run(category.name);
  return { id: result.lastInsertRowid, name: category.name };
});

// Delete category
ipcMain.handle('delete-category', async (event, id) => {
  const stmt = db.prepare('UPDATE categories SET status_code = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});

// const fs = require('fs');
// const path = require('path');
// const dbPath = path.join(__dirname, '..', 'database.db'); // adjust if your db path is different

ipcMain.handle('get-database-size', async () => {
  try {
    const stats = fs.statSync(dbPath); 
    return stats.size;
  } catch (e) {
    return null;
  }
});

function autoBackupDatabase() {
  return new Promise((resolve, reject) => {
    try {
      if (!db || db.open === false) throw new Error('Database connection is not open');

      const dbPath = isDev 
        ? path.join(__dirname, '..', 'database.db')
        : path.join(process.resourcesPath, 'database.db');

      const backupDir = isDev 
        ? path.join(__dirname, '..', 'backups')
        : path.join(process.resourcesPath, 'backups');
 
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(
        backupDir,
        `billing_software_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
      );

      db.backup(backupFile)
        .then(() => {
          // Update settings
          db.prepare('UPDATE settings SET value = ? WHERE key = ?')
            .run(new Date().toISOString(), 'last_backup');
          
          console.log('Auto-backup created:', backupFile);

          // 🔥 Keep only 3 most recent backups
          const backups = fs.readdirSync(backupDir) 
            .filter(file => file.endsWith('.db'))
            .map(file => ({
              name: file,
              time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // newest first

          if (backups.length > 3) {
            const oldBackups = backups.slice(3); // keep only 3 newest
            oldBackups.forEach(backup => {
              const oldPath = path.join(backupDir, backup.name);
              fs.unlinkSync(oldPath);
              console.log('Deleted old backup:', oldPath);
            });
          }

          resolve();
        })
        .catch(reject);
    } catch (error) {
      console.error('Auto-backup failed:', error);
      reject(error);
    }
  });
}



app.on('before-quit', async (event) => {
  event.preventDefault();

  try {
    if (db && db.open !== false) {
      await autoBackupDatabase();  // only backup if still open
      db.close();                  // close after backup
    }
  } catch (error) {
    console.error("Backup error during quit:", error.message);
  }

  // Delay quit so backup finishes
 
    app.exit(0);

});

// Update purchase handler
ipcMain.handle('update-purchase', async (event, purchaseId, updatedPurchase) => {
  // 1. Fetch old purchase items
  const oldItems = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(purchaseId);

  // 2. Build lookup maps
  const oldMap = {};
  oldItems.forEach(item => { oldMap[item.item_id] = item; });
  const newMap = {};
  updatedPurchase.items.forEach(item => { newMap[item.id] = item; });

  // 3. Inventory adjustment logic
  // a) For items removed or reduced
  for (const oldItem of oldItems) {
    const newItem = newMap[oldItem.item_id];
    if (!newItem) {
      db.prepare('UPDATE items SET current_stock = current_stock - ? WHERE id = ?')
        .run(oldItem.quantity, oldItem.item_id);
    } else if (newItem.quantity !== oldItem.quantity) {
      db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
        .run(newItem.quantity - oldItem.quantity, oldItem.item_id);
    }
  }
  // b) For new items added
  for (const newItem of updatedPurchase.items) {
    if (!oldMap[newItem.id]) {
      db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
        .run(newItem.quantity, newItem.id);
    }
  }

  // 4. Update purchase table (now includes cgst_total, sgst_total, rounding_off)
  db.prepare(`
    UPDATE purchases SET 
      supplier_id = ?, 
      invoice_number = ?, 
      purchase_date = ?, 
      total_amount = ?,
      cgst_total = ?,
      sgst_total = ?,
      rounding_off = ?
    WHERE id = ?
  `).run(
    updatedPurchase.supplier_id,
    updatedPurchase.invoice_number,
    updatedPurchase.purchase_date,
    updatedPurchase.total_amount,
    updatedPurchase.cgst_total,
    updatedPurchase.sgst_total,
    updatedPurchase.rounding_off,
    purchaseId
  );

  // 5. Remove old purchase_items and insert new ones
  db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(purchaseId);

  const purchaseItemStmt = db.prepare(`
    INSERT INTO purchase_items 
      (purchase_id, item_id, quantity, unit_price, gst_percentage, cgst_amount, sgst_amount, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  updatedPurchase.items.forEach(item => {
    purchaseItemStmt.run(
      purchaseId,
      item.id,
      item.quantity,
      item.unit_price,
      item.gst_percentage,
      item.cgst_amount,
      item.sgst_amount,
      item.total_price
    );
    db.prepare('UPDATE items SET purchase_rate = ?, last_supplier_id = ?, last_purchase_date = ? WHERE id = ?')
      .run(item.unit_price, updatedPurchase.supplier_id, updatedPurchase.purchase_date, item.id);
  });

  return { success: true };
});
ipcMain.handle('update-sale', async (event, saleId, updatedSale) => {
  // 1. Fetch old sale items
  const oldItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);

  // 2. Build lookup maps
  const oldMap = {};
  oldItems.forEach(item => { oldMap[item.item_id] = item; });
  const newMap = {};
  updatedSale.items.forEach(item => { newMap[item.id] = item; });

  // 3. Inventory adjustment logic
  // a) For items removed or reduced
  for (const oldItem of oldItems) {
    const newItem = newMap[oldItem.item_id];
    if (!newItem) {
      // Item removed: add old quantity back to inventory
      db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
        .run(oldItem.quantity, oldItem.item_id);
    } else if (parseFloat(newItem.quantity) !== parseFloat(oldItem.quantity)) {
      // Quantity changed: adjust by the difference
      db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
        .run(oldItem.quantity - parseFloat(newItem.quantity), oldItem.item_id);
    }
  }
  // b) For new items added
  for (const newItem of updatedSale.items) {
    if (!oldMap[newItem.id]) {
      // New item: subtract its quantity from inventory
      db.prepare('UPDATE items SET current_stock = current_stock - ? WHERE id = ?')
        .run(parseFloat(newItem.quantity), newItem.id);
    }
  }

  // 4. Update sales table
  db.prepare(`
    UPDATE sales SET 
      customer_name = ?, 
      customer_contact = ?, 
      customer_address = ?, 
      customer_gstin = ?, 
      sale_date = ?, 
      discount = ?, 
      total_amount = ?,
      rounding_off = ?,
      salesman_id = ?,
      sale_type = ?
    WHERE id = ?
  `).run(
    updatedSale.customer_name,
    updatedSale.customer_contact,
    updatedSale.customer_address,
    updatedSale.customer_gstin,
    updatedSale.sale_date,
    updatedSale.discount,
    updatedSale.total_amount,
    updatedSale.rounding_off,
    updatedSale.salesman_id || null,
    updatedSale.sale_type || 'customer',
    saleId
  );

  // 5. Remove old sale_items and insert new ones with preserved rates
  db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);

  const saleItemStmt = db.prepare(`
    INSERT INTO sale_items 
      (sale_id, item_id, quantity, unit_price, total_price, sale_type, customer_rate, salesman_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  updatedSale.items.forEach(item => {
    // Preserve rates from the original sale item or fetch from items table
    const oldItem = oldMap[item.id];
    let customerRate = oldItem?.customer_rate;
    let salesmanRate = oldItem?.salesman_rate;
    
    // If rates don't exist in old item, fetch from items table
    if (!customerRate || !salesmanRate) {
      const itemRates = db.prepare('SELECT customer_rate, salesman_rate FROM items WHERE id = ?').get(item.id);
      customerRate = customerRate || itemRates?.customer_rate || 0;
      salesmanRate = salesmanRate || itemRates?.salesman_rate || 0;
    }

    saleItemStmt.run(
      saleId,
      item.id,
      parseFloat(item.quantity),
      parseFloat(item.unit_price),
      parseFloat(item.total_price),
      updatedSale.sale_type || 'customer',
      customerRate,
      salesmanRate 
    );
    reduceClosingStock(item.id, parseFloat(item.quantity));
  });

  return { success: true };
});

// Add this IPC handler to check if any item's stock will go negative after update
ipcMain.handle('check-purchase-edit-stock', async (event, purchaseId, updatedItems) => {
  // Get old purchase items
  const oldItems = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(purchaseId);

  // Build lookup maps
  const oldMap = {};
  oldItems.forEach(item => { oldMap[item.item_id] = item; });
  const newMap = {};
  updatedItems.forEach(item => { newMap[item.id] = item; });

  // For each item in old and new, calculate the net change
  // For items removed or reduced
  for (const oldItem of oldItems) {
    const newItem = newMap[oldItem.item_id];
    const itemInfo = db.prepare('SELECT name, current_stock FROM items WHERE id = ?').get(oldItem.item_id);
    const itemName = itemInfo?.name || `ID ${oldItem.item_id}`;
    const stock = itemInfo?.current_stock || 0;

    if (!newItem) {
      // Item removed: subtract old quantity from inventory
      if (stock - oldItem.quantity < 0) {
        return { ok: false, message: `Stock for "${itemName}" will go negative.` };
      }
    } else if (newItem.quantity !== oldItem.quantity) {
      // Quantity changed: adjust by the difference
      const diff = newItem.quantity - oldItem.quantity;
      if (stock + diff < 0) {
        return { ok: false, message: `Stock for "${itemName}" will go negative.` };
      }
    }
  }
  // For new items added
  for (const newItem of updatedItems) {
    if (!oldMap[newItem.id]) {
      const itemInfo = db.prepare('SELECT name, current_stock FROM items WHERE id = ? ').get(newItem.id);
      const itemName = itemInfo?.name || `ID ${newItem.id}`;
      const stock = itemInfo?.current_stock || 0;
      if (stock + newItem.quantity < 0) {
        return { ok: false, message: `Stock for "${itemName}" will go negative.` };
      }
    }
  }
  return { ok: true };
});

ipcMain.handle('create-customer-if-needed', async (event, customer) => {
  if (!customer?.contact) return null; // Only create if contact is provided

  // Check if customer already exists
  const exists = db.prepare('SELECT id FROM customer WHERE contact = ? AND (status_code = 0 OR status_code IS NULL)').get(customer.contact);
  if (exists) return exists.id;

  // Insert new customer
  const stmt = db.prepare('INSERT INTO customer (name, contact, address, gstin) VALUES (?, ?, ?, ?)');
  const result = stmt.run(
    customer.name || null,
    customer.contact,
    customer.address || null,
    customer.gstin || null
  );
  return result.lastInsertRowid;
});

ipcMain.handle('check-purchase-delete-stock', async (event, purchaseId) => {
  // Get all items and quantities for this purchase
  const items = db.prepare('SELECT item_id, quantity,items.name FROM purchase_items inner join items on items.id = purchase_items.item_id WHERE purchase_id = ? AND (purchase_items.status_code = 0 OR purchase_items.status_code IS NULL) ').all(purchaseId);
  for (const item of items) {
    const stock = db.prepare('SELECT current_stock FROM items WHERE id = ?').get(item.item_id)?.current_stock || 0;
    // Deleting purchase will subtract quantity from stock
    if (stock - item.quantity < 0) {
      return {
        ok: false,
        message: `Cannot delete purchase: Inventory for item ${item.name} will go negative.`
      };
    }
    if (stock - item.quantity === 0) {
      return {
        ok: false,
        message: `Cannot delete purchase: Inventory for item ${item.name} will become zero.`
      };
    }
  }
  return { ok: true };
});



// Add salesman
ipcMain.handle('add-salesman', async (event, salesmanData) => {
  const stmt = db.prepare('INSERT INTO salesman (name, contact_info, address, joining_date) VALUES (?, ?, ?, ?)');
  const result = stmt.run(
    salesmanData.name,
    salesmanData.contact_info,
    salesmanData.address,
    salesmanData.joining_date
  );
  return { id: result.lastInsertRowid, ...salesmanData };
});

// Get all salesmen
ipcMain.handle('get-salesmen', async () => { 
  return db.prepare('SELECT * FROM salesman WHERE status_code = 0 OR status_code IS NULL ORDER BY name').all();
});

// Update salesman
ipcMain.handle('update-salesman', async (event, { id, name, contact_info, address, joining_date }) => {
  const stmt = db.prepare('UPDATE salesman SET name = ?, contact_info = ?, address = ?, joining_date = ? WHERE id = ?');
  const result = stmt.run(name, contact_info, address, joining_date, id);
  return result.changes > 0;
});

// Delete salesman (soft delete)
ipcMain.handle('delete-salesman', async (event, id) => {
  const stmt = db.prepare('UPDATE salesman SET status_code = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});
// License IPC handlers
ipcMain.handle('activate-license', async () => {
  try {
    activateLicense();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}); 
// Add these IPC handlers
ipcMain.handle('update-sale-paid-status', async (event, saleId, isPaid) => {
  const stmt = db.prepare('UPDATE sales SET is_paid = ? WHERE id = ?');
  const result = stmt.run(isPaid ? 1 : 0, saleId);
  return result.changes > 0;
});

ipcMain.handle('update-sale-approved-status', async (event, saleId, isApproved) => {
  const stmt = db.prepare('UPDATE sales SET is_approved = ? WHERE id = ?');
  const result = stmt.run(isApproved ? 1 : 0, saleId);
  return result.changes > 0;
});

ipcMain.handle('verify-approve-pin', async (event, pin) => {
  return pin === '4040'; // Different pin for approve functionality
});

ipcMain.handle('validate-license', async () => {
  return validateLicense();
});

ipcMain.handle('get-machine-id', async () => {
  return machineIdSync();
});

// License management
function getPythonMachineId() {
  
    return null;
 
}

// Activate license: save current machine ID
function activateLicense() {
  const id = machineIdSync();
  const activated_on = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO license (machine_id, activated_on) VALUES (?, ?)').run(id, activated_on);
}

function getNodeMachineId() {
  const pieces = [];

  // 1) MAC Address (exact match with Python logic)
  try {
    const ifaces = os.networkInterfaces();
    let mac = "";

    // Get all interface names and sort for consistency
    const interfaceNames = Object.keys(ifaces).filter(name => 
      !name.startsWith('lo') && 
      !name.startsWith('docker') && 
      !name.startsWith('br-') && 
      !name.startsWith('veth')
    ).sort();

    for (const name of interfaceNames) {
      const addrs = ifaces[name];
      for (const iface of addrs) {
        if (!iface.internal && iface.mac && iface.mac !== "00:00:00:00:00:00") {
          mac = iface.mac.toLowerCase();
          break;
        }
      }
      if (mac) break;
    }

    // Check for multicast/random MACs (match Python logic exactly)
    if (mac) {
      const firstByte = parseInt(mac.split(":")[0], 16);
      if ((firstByte & 2) === 0) {  // Not multicast/random
        pieces.push(`MAC:${mac}`);
      }
    }
  } catch (err) {
    console.error("Failed to get MAC:", err);
  }

  // 2) CPU Info (match Python's arch mapping)
  try {
    const arch = os.arch(); // This should match Python's mapped values
    if (arch) {
      pieces.push(`CPU:${arch}`);
    }
  } catch (err) {
    console.error("Failed to get CPU:", err);
  }

  // 3) Platform Info (exact match with Python)
  try {
    let system = os.type();
    // Keep Node.js naming convention
    const release = os.release();
    const version = os.version();
    
    const platformStr = `${system}|${release}|${version}`;
    pieces.push(`PLAT:${platformStr}`);
  } catch (err) {
    console.error("Failed to get platform:", err);
  }

  // 4) Disk serial (exact same logic as Python)
  try {
    const system = os.type().toLowerCase();
    let serial = "";

    if (system === "windows_nt") {
      try {
        const output = execSync("wmic diskdrive get SerialNumber", {
          encoding: "utf8",
          timeout: 3000,
        });
        const lines = output
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.includes("SerialNumber"));
        if (lines.length > 0) {
          serial = lines[0].trim();
        }
      } catch {}
    } else if (system === "darwin") {
      try {
        const output = execSync("system_profiler SPHardwareDataType", {
          encoding: "utf8",
          timeout: 3000,
        });
        const match = output.match(/Serial Number.*:\s*(\S+)/);
        if (match) {
          serial = match[1].trim();
        }
      } catch {}
    } else if (system === "linux") {
      try {
        const output = execSync("lsblk -o NAME,SERIAL -J", {
          encoding: "utf8",
          timeout: 3000,
        });
        const match = output.match(/"serial":\s*"([^"]+)"/i);
        if (match) {
          serial = match[1].trim();
        } else {
          const output2 = execSync("udevadm info --query=property --name=/dev/sda", {
            encoding: "utf8",
            timeout: 3000,
          });
          const m = output2.match(/ID_SERIAL_SHORT=(.+)/);
          if (m) {
            serial = m[1].trim();
          }
        }
      } catch {}
    }

    if (serial) {
      pieces.push(`DISK:${serial}`);
    }
  } catch (err) {
    console.error("Failed to get disk serial:", err);
  }

  // 5) Hostname (exact match)
  try {
    const hostname = os.hostname();
    if (hostname) {
      pieces.push(`HN:${hostname}`);
    }
  } catch (err) {
    console.error("Failed to get hostname:", err);
  }

  // Join and hash (exact Python logic)
  let concat = pieces.join("|");
  if (!concat) {
    concat = `fallback-${os.hostname()}`;
  }

  // Debug: Print the concatenated string
  console.log("DEBUG Node.js concat:", concat);

  const hash = crypto.createHash("sha256").update(concat, "utf8").digest("hex");
  return hash;
}

// Validate license: check if saved machine ID matches current
function validateLicense() {
  const pythonId = getPythonMachineId();  
  const nodeId = getNodeMachineId();  
  
  console.log('=== DEBUG MACHINE ID ===');
  console.log('Python THE EXE ID:', machineId); 
    console.log('Python ID:', pythonId); 
  console.log('Node ID:  ', nodeId);
  console.log('Match:    ', pythonId === nodeId);
  console.log('========================');
  
  const row = db.prepare('SELECT machine_id FROM license LIMIT 1').get();
  console.log('Stored ID:', row?.machine_id);
  
  return row && (row.machine_id === machineId);
}

// Payment IPC handlers
ipcMain.handle('save-payment', async (event, paymentData) => {
  const { saleId, paymentMethod, amount, paymentDate, paymentDetails } = paymentData;
  
  // Insert into payment_verification
  const paymentVerificationStmt = db.prepare(`
    INSERT INTO payment_verification (sale_id, payment_method, amount, payment_date)
    VALUES (?, ?, ?, ?)
  `);
  const result = paymentVerificationStmt.run(saleId, paymentMethod, amount, paymentDate);
  const paymentVerificationId = result.lastInsertRowid;
  
  // Insert into specific payment method table
  switch (paymentMethod) {
    case 'upi':
      db.prepare(`
        INSERT INTO payment_upi (payment_verification_id, transaction_id, upi_id, app_name, reference_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        paymentDetails.transactionId,
        paymentDetails.upiId,
        paymentDetails.appName,
        paymentDetails.referenceNumber
      );
      break;
      
    case 'cash':
      db.prepare(`
        INSERT INTO payment_cash (payment_verification_id, denomination_notes, received_by, receipt_number)
        VALUES (?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        JSON.stringify(paymentDetails.denominationNotes || {}),
        paymentDetails.receivedBy,
        paymentDetails.receiptNumber
      );
      break;
      
    case 'neft_rtgs':
      db.prepare(`
        INSERT INTO payment_neft_rtgs (payment_verification_id, transaction_reference, sender_bank, sender_account, receiver_bank, receiver_account, transfer_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        paymentDetails.transactionReference,
        paymentDetails.senderBank,
        paymentDetails.senderAccount,
        paymentDetails.receiverBank,
        paymentDetails.receiverAccount,
        paymentDetails.transferType
      );
      break;
      
    case 'cheque':
      db.prepare(`
        INSERT INTO payment_cheque (payment_verification_id, cheque_number, bank_name, branch_name, cheque_date, drawer_name, micr_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        paymentDetails.chequeNumber,
        paymentDetails.bankName,
        paymentDetails.branchName,
        paymentDetails.chequeDate,
        paymentDetails.drawerName,
        paymentDetails.micrCode
      );
      break;
  }
  
  // Update sales table with payment method and paid status
  db.prepare('UPDATE sales SET is_paid = 1, payment_method = ? WHERE id = ?')
    .run(paymentMethod, saleId);
  
  return { success: true, paymentVerificationId };
});

ipcMain.handle('get-payment-details', async (event, saleId) => {
  const paymentVerification = db.prepare(`
    SELECT * FROM payment_verification WHERE sale_id = ? ORDER BY created_at DESC
  `).all(saleId);
  
  const payments = [];
  
  for (const payment of paymentVerification) {
    let paymentDetails = {};
    
    switch (payment.payment_method) {
      case 'upi':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_upi WHERE payment_verification_id = ?
        `).get(payment.id);
        break;
        
      case 'cash':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_cash WHERE payment_verification_id = ?
        `).get(payment.id);
        if (paymentDetails?.denomination_notes) {
          paymentDetails.denomination_notes = JSON.parse(paymentDetails.denomination_notes);
        }
        break;
        
      case 'neft_rtgs':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_neft_rtgs WHERE payment_verification_id = ?
        `).get(payment.id);
        break;
        
      case 'cheque':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_cheque WHERE payment_verification_id = ?
        `).get(payment.id);
        break;
    }
    
    payments.push({
      ...payment,
      details: paymentDetails
    });
  }
  
  return payments;
});

ipcMain.handle('update-payment-status', async (event, paymentVerificationId, status) => {
  const stmt = db.prepare('UPDATE payment_verification SET status = ? WHERE id = ?');
  const result = stmt.run(status, paymentVerificationId);
  return result.changes > 0;
});

// Update the existing sales history query to include payment_method
ipcMain.handle('get-sales-history', async () => {
  const sales = db.prepare(`
    SELECT s.*, COUNT(si.id) as item_count,
        COALESCE(s.cgst_total, 0) as cgst_total,
        COALESCE(s.sgst_total, 0) as sgst_total,
        COALESCE(s.is_paid, 0) as is_paid,
        COALESCE(s.is_approved, 0) as is_approved,
        COALESCE(s.payment_method, '') as payment_method,
        salesman.name AS salesman
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN salesman ON s.salesman_id = salesman.id
    WHERE (s.status_code = 0 OR s.status_code IS NULL) 
    AND (si.status_code = 0 OR si.status_code IS NULL)
    GROUP BY s.id 
    ORDER BY s.sale_date DESC
  `).all();
  
  return sales;
});




// Add this IPC handler after the existing payment handlers
ipcMain.handle('get-sale-payment-for-approval', async (event, saleId) => {
  // Get sale details with payment info
  const sale = db.prepare(`
    SELECT s.*, 
           COALESCE(s.payment_method, '') as payment_method,
           COALESCE(s.is_paid, 0) as is_paid
    FROM sales s
    WHERE s.id = ?
  `).get(saleId);

  if (!sale || !sale.is_paid) {
    return { sale, hasPayment: false, paymentDetails: null };
  }

  // Get payment verification details
  const paymentVerification = db.prepare(`
    SELECT * FROM payment_verification 
    WHERE sale_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(saleId);

  if (!paymentVerification) {
    return { sale, hasPayment: false, paymentDetails: null };
  }

  // Get specific payment method details
  let paymentMethodDetails = {};
  
  switch (paymentVerification.payment_method) {
    case 'upi':
      paymentMethodDetails = db.prepare(`
        SELECT * FROM payment_upi WHERE payment_verification_id = ?
      `).get(paymentVerification.id) || {};
      break;
      
    case 'cash':
      paymentMethodDetails = db.prepare(`
        SELECT * FROM payment_cash WHERE payment_verification_id = ?
      `).get(paymentVerification.id) || {};
      if (paymentMethodDetails.denomination_notes) {
        paymentMethodDetails.denomination_notes = JSON.parse(paymentMethodDetails.denomination_notes);
      }
      break;
      
    case 'neft_rtgs':
      paymentMethodDetails = db.prepare(`
        SELECT * FROM payment_neft_rtgs WHERE payment_verification_id = ?
      `).get(paymentVerification.id) || {};
      break;
      
    case 'cheque':
      paymentMethodDetails = db.prepare(`
        SELECT * FROM payment_cheque WHERE payment_verification_id = ?
      `).get(paymentVerification.id) || {};
      break;
  }

  return {
    sale,
    hasPayment: true,
    paymentDetails: {
      ...paymentVerification,
      methodDetails: paymentMethodDetails
    }
  };
});

// Add handler to get approval history
ipcMain.handle('get-approval-history', async (event, saleId) => {
  // You can create an approval_history table for detailed logs, or just return current status
  const sale = db.prepare(`
    SELECT s.is_approved, s.bill_number, s.total_amount
    FROM sales s
    WHERE s.id = ?
  `).get(saleId);

  // For now, return basic info. You can extend this with a proper audit trail
  return {
    saleId,
    currentStatus: sale?.is_approved === 1 ? 'Approved' : 'Not Approved',
    billNumber: sale?.bill_number,
    totalAmount: sale?.total_amount,
    // You could add approval_date, approved_by, etc. if you extend the schema
  };
});



ipcMain.handle('save-purchase-payment', async (event, paymentData) => {
  const { purchaseId, paymentMethod, amount, paymentDate, paymentDetails } = paymentData;
  
  // Insert into payment_verification
  const paymentVerificationStmt = db.prepare(`
    INSERT INTO payment_verification (purchase_id, payment_method, amount, payment_date)
    VALUES (?, ?, ?, ?)
  `);
  const result = paymentVerificationStmt.run(purchaseId, paymentMethod, amount, paymentDate);
  const paymentVerificationId = result.lastInsertRowid;
  
  // Insert into specific payment method table (same logic as sales)
  switch (paymentMethod) {
    case 'upi':
      db.prepare(`
        INSERT INTO payment_upi (payment_verification_id, transaction_id, upi_id, app_name, reference_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        paymentDetails.transactionId || '',
        paymentDetails.upiId || '',
        paymentDetails.appName || '',
        paymentDetails.referenceNumber || ''
      );
      break;
      
    case 'cash':
      db.prepare(`
        INSERT INTO payment_cash (payment_verification_id, denomination_notes, received_by, receipt_number)
        VALUES (?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        JSON.stringify(paymentDetails.denominationNotes || {}),
        paymentDetails.receivedBy || '',
        paymentDetails.receiptNumber || ''
      );
      break;
      
    case 'neft_rtgs':
      db.prepare(`
        INSERT INTO payment_neft_rtgs (payment_verification_id, transaction_reference, sender_bank, sender_account, receiver_bank, receiver_account, transfer_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        paymentDetails.transactionReference || '',
        paymentDetails.senderBank || '',
        paymentDetails.senderAccount || '',
        paymentDetails.receiverBank || '',
        paymentDetails.receiverAccount || '',
        paymentDetails.transferType || 'neft'
      );
      break;
      
    case 'cheque':
      db.prepare(`
        INSERT INTO payment_cheque (payment_verification_id, cheque_number, bank_name, branch_name, cheque_date, drawer_name, micr_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        paymentDetails.chequeNumber || '',
        paymentDetails.bankName || '',
        paymentDetails.branchName || '',
        paymentDetails.chequeDate || '',
        paymentDetails.drawerName || '',
        paymentDetails.micrCode || ''
      );
      break;
  }
  
  // Update purchases table with payment method and paid status
  db.prepare('UPDATE purchases SET is_paid = 1, payment_method = ? WHERE id = ?')
    .run(paymentMethod, purchaseId);
  
  return { success: true, paymentVerificationId };
});

ipcMain.handle('get-purchase-payment-details', async (event, purchaseId) => {
  const paymentVerification = db.prepare(`
    SELECT * FROM payment_verification WHERE purchase_id = ? ORDER BY created_at DESC
  `).all(purchaseId);
  
  const payments = [];
  
  for (const payment of paymentVerification) {
    let paymentDetails = {};
    
    switch (payment.payment_method) {
      case 'upi':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_upi WHERE payment_verification_id = ?
        `).get(payment.id);
        break;
        
      case 'cash':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_cash WHERE payment_verification_id = ?
        `).get(payment.id);
        if (paymentDetails?.denomination_notes) {
          paymentDetails.denomination_notes = JSON.parse(paymentDetails.denomination_notes);
        }
        break;
        
      case 'neft_rtgs':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_neft_rtgs WHERE payment_verification_id = ?
        `).get(payment.id);
        break;
        
      case 'cheque':
        paymentDetails = db.prepare(`
          SELECT * FROM payment_cheque WHERE payment_verification_id = ?
        `).get(payment.id);
        break;
    }
    
    payments.push({
      ...payment,
      details: paymentDetails
    });
  }
  
  return payments;
});


// Inventory Export API
ipcMain.handle('get-export-inventory-data', async () => {
  return db.prepare(`
    SELECT i.*, c.name as category_name, s.name as supplier_name, s.gstin as supplier_gstin
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.last_supplier_id = s.id
    WHERE (i.status_code = 0 OR i.status_code IS NULL)
    ORDER BY i.name
  `).all();
});

// Sales Export API
ipcMain.handle('get-export-sales-data', async (event, { startDate, endDate }) => {
  return db.prepare(`
    SELECT s.bill_number, s.sale_date, s.customer_name, s.customer_address, s.customer_gstin,
           s.total_amount, s.cgst_total, s.sgst_total, s.discount, s.rounding_off,
           GROUP_CONCAT(i.hsn_code) as hsn_code,
           GROUP_CONCAT(si.gst_percentage) as gst_percent
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN items i ON si.item_id = i.id
    WHERE s.sale_date BETWEEN ? AND ?
    AND (s.status_code = 0 OR s.status_code IS NULL)
    GROUP BY s.id
    ORDER BY s.sale_date DESC
  `).all(startDate, endDate);
});

// Purchase Export API
ipcMain.handle('get-export-purchase-data', async (event, { startDate, endDate }) => {
  return db.prepare(`
    SELECT p.invoice_number, p.purchase_date, s.name as supplier_name, s.address as supplier_address, s.gstin as supplier_gstin,
           p.total_amount, p.cgst_total, p.sgst_total, p.discount, p.rounding_off,
           GROUP_CONCAT(i.hsn_code) as hsn_code,
           GROUP_CONCAT(pi.gst_percentage) as gst_percent
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
    LEFT JOIN items i ON pi.item_id = i.id
    WHERE p.purchase_date BETWEEN ? AND ?
    AND (p.status_code = 0 OR p.status_code IS NULL)
    GROUP BY p.id
    ORDER BY p.purchase_date DESC
  `).all(startDate, endDate);
});


// Get all customers
ipcMain.handle('get-customers', async () => {
  return db.prepare('SELECT * FROM customer WHERE (status_code = 0 OR status_code IS NULL) ORDER BY name').all();
});

// Add customer
ipcMain.handle('add-customer', async (event, customer) => {
  const stmt = db.prepare('INSERT INTO customer (name, contact, address, gstin) VALUES (?, ?, ?, ?)');
  const result = stmt.run(customer.name, customer.contact, customer.address, customer.gstin);
  return { id: result.lastInsertRowid, ...customer };
});

// Update customer
ipcMain.handle('update-customer', async (event, customer) => {
  const stmt = db.prepare('UPDATE customer SET name = ?, contact = ?, address = ?, gstin = ? WHERE id = ?');
  const result = stmt.run(customer.name, customer.contact, customer.address, customer.gstin, customer.id);
  return result.changes > 0;
});

// Delete customer (soft delete)
ipcMain.handle('delete-customer', async (event, id) => {
  const stmt = db.prepare('UPDATE customer SET status_code = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
});



ipcMain.handle('get-app-info', async () => {
  let pkg = {};
  try {
    const data = fs.readFileSync(packageJsonPath, 'utf8');
    pkg = JSON.parse(data);
  } catch (err) {
    console.error('Error reading package.json:', err);
  }

  return {
    name: app.getName(),
    version: app.getVersion(),
    copyright: app.getCopyright ? app.getCopyright() : (pkg.copyright || ''),
    productName: pkg.productName || pkg.name || app.getName(),
    description: pkg.description || '',
    author: pkg.author || '',
    company: pkg.company || '',
    license: 'Swayam Foods', // Hardcoded license info
    homepage: pkg.homepageUrl || pkg.homepage || '',
    repository: pkg.repository?.url || '',
    bugs: pkg.bugs?.url || '',
    supportEmail: pkg.support?.email || '',
    supportPhone: pkg.support?.phone || '',
    releaseDate: pkg.releaseDate || '',
    builtWith: pkg.builtWith || [],
    changelog: pkg.changelog || ''
  };
});

ipcMain.handle('update-closing-stock', async (event, { itemId, qty, purchaseRate }) => {
  const closingDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const closingAmount = qty * purchaseRate;
  // Upsert logic: update if exists for today, else insert
  const existing = db.prepare('SELECT id FROM closing_stock WHERE item_id = ? AND closing_date = ?').get(itemId, closingDate);
  if (existing) {
    db.prepare('UPDATE closing_stock SET closing_qty = ?, purchase_rate = ?, closing_amount = ? WHERE id = ?')
      .run(qty, purchaseRate, closingAmount, existing.id);
  } else {
    db.prepare('INSERT INTO closing_stock (item_id, closing_date, closing_qty, purchase_rate, closing_amount) VALUES (?, ?, ?, ?, ?)')
      .run(itemId, closingDate, qty, purchaseRate, closingAmount);
  }
  return true;
});

ipcMain.handle('get-closing-stock', async (event, itemId) => {
  return db.prepare(
    'SELECT * FROM closing_stock WHERE item_id = ? ORDER BY closing_date DESC LIMIT 1'
  ).get(itemId);
});


function reduceClosingStock(itemId, qtySold) {
  // Get latest closing stock for the item
  const closing = db.prepare('SELECT * FROM closing_stock WHERE item_id = ? ORDER BY closing_date DESC LIMIT 1').get(itemId);
  if (closing) {
    let newQty = closing.closing_qty - qtySold;
    if (newQty < 0) newQty = 0;
    let newAmount = newQty * closing.purchase_rate;
    db.prepare('UPDATE closing_stock SET closing_qty = ?, closing_amount = ? WHERE id = ?')
      .run(newQty, newAmount, closing.id);
  }
}



// ...existing code...
// ...existing code...// ...existing code...

ipcMain.handle('get-Salesman-Commission', async () => {
  // Get all sales where sale_type is 'customer'
  const sales = db.prepare(`
    SELECT s.id as sale_id, s.bill_number,s.customer_name,s.customer_contact, s.sale_date, s.salesman_id, salesman.name as salesman_name
    FROM sales s
    LEFT JOIN salesman ON s.salesman_id = salesman.id
    WHERE s.sale_type = 'customer' AND (s.status_code = 0 OR s.status_code IS NULL)
    ORDER BY s.sale_date DESC
  `).all();

  // For each sale, get items and calculate commission
  const commissionData = [];
  for (const sale of sales) {
    const items = db.prepare(`
      SELECT si.*, i.name as item_name, i.id as item_id
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      WHERE si.sale_id = ? AND si.sale_type = 'customer'
    `).all(sale.sale_id);

    let totalCommission = 0;
    const itemCommissions = items.map(item => {
      // Use rates from sale_items table
      const commission = (item.unit_price - item.salesman_rate) * item.quantity;
      totalCommission += commission;
      return {
        item_id: item.item_id, // Changed from item.id to item.item_id
        item_name: item.item_name,
        quantity: item.quantity,
        customer_rate: item.customer_rate,
        salesman_rate: item.salesman_rate,
        commission: commission
      };
    });

    commissionData.push({
      sale_id: sale.sale_id,
      bill_number: sale.bill_number,
      sale_date: sale.sale_date,
      customer_name: sale.customer_name,
      customer_contact: sale.customer_contact,
      salesman_id: sale.salesman_id,
      salesman_name: sale.salesman_name,
      items: itemCommissions,
      totalCommission
    });
  }

  return commissionData;
});

// ...existing code...

ipcMain.handle('get-bill-message', async () => {
  const row = db.prepare('SELECT * FROM bill_message WHERE status_code = 0 ORDER BY updated_at DESC LIMIT 1').get();
  return row?.message || '';
});

ipcMain.handle('set-bill-message', async (event, message) => {
  db.prepare('INSERT INTO bill_message (message) VALUES (?)').run(message);
  return true;
});

// ipcMain.handle('print-pdf', async (event, pdfData) => {
//   try {
//     // Create temp file
//     const tempDir = os.tmpdir();
//     const tempFilePath = path.join(tempDir, `invoice_${Date.now()}.pdf`);
    
//     // Convert ArrayBuffer to Buffer
//     const buffer = Buffer.from(pdfData);
    
//     // Write PDF data to temp file
//     fs.writeFileSync(tempFilePath, buffer);
    
//     // Print the PDF using system default printer
//     await shell.openPath(tempFilePath);
    
//     // Clean up temp file after a delay
//     setTimeout(() => {
//       try {
//         fs.unlinkSync(tempFilePath);
//       } catch (err) {
//         console.log('Could not delete temp file:', err);
//       }
//     }, 10000);
    
//     return { success: true };
//   } catch (error) {
//     console.error('Print error:', error);
//     return { success: false, error: error.message };
//   }
// });
ipcMain.handle('print-pdf', async (event, pdfData) => {
  try {
    // Create temp file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `invoice_${Date.now()}.pdf`);
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(pdfData);
    
    // Write PDF data to temp file
    fs.writeFileSync(tempFilePath, buffer);
    
    // Print the PDF using system default printer
    await shell.openPath(tempFilePath);
    
    // Clean up temp file after a delay
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.log('Could not delete temp file:', err);
      }
    }, 10000);
    
    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
});


// Add this function after the database initialization
function getNextSku() {
  try {
    // Get all SKUs that are pure numbers (not custom like "food101")
    const numericSkus = db.prepare(`
      SELECT sku FROM items 
      WHERE (status_code = 0 OR status_code IS NULL) 
      AND sku GLOB '[0-9]*' 
      AND sku = CAST(sku AS INTEGER)
      ORDER BY CAST(sku AS INTEGER) DESC
    `).all();

    if (numericSkus.length === 0) {
      return '1'; // Start from 1 if no numeric SKUs exist
    }

    // Find the highest numeric SKU
    const highestSku = Math.max(...numericSkus.map(item => parseInt(item.sku, 10)));
    
    // Find gaps in the sequence
    for (let i = 1; i <= highestSku; i++) {
      const exists = db.prepare(`
        SELECT id FROM items 
        WHERE sku = ? AND (status_code = 0 OR status_code IS NULL)
      `).get(i.toString());
      
      if (!exists) {
        return i.toString(); // Return the first gap found
      }
    }
    
    // No gaps found, return next number
    return (highestSku + 1).toString();
  } catch (error) {
    console.error('Error generating SKU:', error);
    return '1';
  }
}

// Add IPC handler for getting next SKU
ipcMain.handle('get-next-sku', async () => {
  return getNextSku();
});