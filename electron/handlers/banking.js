export function registerBankingHandlers({ ipcMain, getDb }) {
  
  // ==================== BANK ACCOUNTS ====================
  
  ipcMain.handle('get-bank-accounts', async () => {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM bank_accounts 
      WHERE status_code = 0 
      ORDER BY account_name
    `).all();
  });

  ipcMain.handle('get-bank-account-details', async (event, accountId) => {
    const db = getDb();
    
    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(accountId);
    
    // Get recent transactions
    const recentTransactions = db.prepare(`
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ?
      AND status_code = 0
      ORDER BY transaction_date DESC, id DESC
      LIMIT 10
    `).all(accountId);
    
    // Get summary
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) as total_credits
      FROM bank_transactions
      WHERE bank_account_id = ?
      AND status_code = 0
    `).get(accountId);
    
    return {
      account,
      recentTransactions,
      summary
    };
  });

  ipcMain.handle('add-bank-account', async (event, accountData) => {
    const db = getDb();
    try {
    
      const result = db.prepare(`
        INSERT INTO bank_accounts 
        (account_name, account_number, bank_name, branch_name, ifsc_code, account_type, 
         opening_balance, current_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        accountData.account_name,
        accountData.account_number,
        accountData.bank_name,
        accountData.branch_name || '',
        accountData.ifsc_code || '',
        accountData.account_type,
        accountData.opening_balance || 0,
        accountData.opening_balance || 0
      );
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw error;
    }
  });

  ipcMain.handle('update-bank-account', async (event, id, accountData) => {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE bank_accounts SET
          account_name = ?,
          account_number = ?,
          bank_name = ?,
          branch_name = ?,
          ifsc_code = ?,
          account_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        accountData.account_name,
        accountData.account_number,
        accountData.bank_name,
        accountData.branch_name || '',
        accountData.ifsc_code || '',
        accountData.account_type,
        id
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-bank-account', async (event, id) => {
    const db = getDb();
    try {
      const txnCount = db.prepare(
        'SELECT COUNT(*) as count FROM bank_transactions WHERE bank_account_id = ? AND status_code = 0'
      ).get(id);
      
      if (txnCount.count > 0) {
        return { success: false, message: 'Cannot delete account with existing transactions' };
      }
      
      db.prepare('UPDATE bank_accounts SET status_code = 1 WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  });

  // ==================== VOUCHER GENERATION ====================
  
  ipcMain.handle('generate-voucher-number', async (event, voucherType) => {
    const db = getDb();
    const prefix = {
      'Payment': 'PAY',
      'Receipt': 'RCP',
      'Contra': 'CNT'
    }[voucherType];
    
    const lastVoucher = db.prepare(
      `SELECT voucher_number FROM bank_transactions 
       WHERE voucher_type = ? 
       AND status_code = 0
       ORDER BY id DESC LIMIT 1`
    ).get(voucherType);
    
    let nextNumber = 1;
    if (lastVoucher) {
      const match = lastVoucher.voucher_number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  });

  // ==================== TRANSACTIONS ====================
  
  ipcMain.handle('save-bank-transaction', async (event, transactionData) => {
    const db = getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      // Get source account details
      const fromAccount = db.prepare('SELECT account_name FROM bank_accounts WHERE id = ?')
        .get(transactionData.bank_account_id);
      
      if (!fromAccount) {
        throw new Error('Source bank account not found');
      }
      
      // For Contra, validate destination account
      if (transactionData.voucher_type === 'Contra') {
        if (!transactionData.to_account_id) {
          throw new Error('Destination account is required for Contra transaction');
        }
        
        if (transactionData.bank_account_id === transactionData.to_account_id) {
          throw new Error('Source and destination accounts cannot be the same');
        }
        
        const toAccount = db.prepare('SELECT account_name FROM bank_accounts WHERE id = ?')
          .get(transactionData.to_account_id);
        
        if (!toAccount) {
          throw new Error('Destination bank account not found');
        }
        
        // For Contra, set party_name to destination account for clarity
        transactionData.party_name = `Transfer to ${toAccount.account_name}`;
      }
      
      // Determine transaction type based on voucher type
      let transactionType;
      if (transactionData.voucher_type === 'Payment') {
        transactionType = 'Debit'; // Money going out
      } else if (transactionData.voucher_type === 'Receipt') {
        transactionType = 'Credit'; // Money coming in
      } else if (transactionData.voucher_type === 'Contra') {
        transactionType = 'Debit'; // Money going out from source account
      }
      
      // Insert main transaction
      const result = db.prepare(`
        INSERT INTO bank_transactions 
        (voucher_number, voucher_type, transaction_date, bank_account_id, party_name, 
         amount, transaction_type, cheque_number, cheque_date, 
         narration, cleared_status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transactionData.voucher_number,
        transactionData.voucher_type,
        transactionData.transaction_date,
        transactionData.bank_account_id,
        transactionData.party_name || '',
        transactionData.amount,
        transactionType,
        transactionData.cheque_number || null,
        transactionData.cheque_date || null,
        transactionData.narration || '',
        transactionData.cheque_number ? 'Pending' : 'Cleared',
        transactionData.created_by || 'admin'
      );
      
      const transactionId = result.lastInsertRowid;
      
      // Insert ledger entries (double entry bookkeeping)
      const ledgerStmt = db.prepare(`
        INSERT INTO bank_ledger_entries 
        (transaction_id, ledger_type, ledger_name, debit_amount, credit_amount)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      if (transactionData.voucher_type === 'Payment') {
        // Payment: Debit Expense, Credit Bank
        ledgerStmt.run(
          transactionId, 
          'Expense',
          transactionData.party_name, 
          transactionData.amount, 
          0
        );
        ledgerStmt.run(
          transactionId, 
          'Bank', 
          fromAccount.account_name, 
          0, 
          transactionData.amount
        );
        
        // Update bank balance (decrease)
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?')
          .run(transactionData.amount, transactionData.bank_account_id);
          
      } else if (transactionData.voucher_type === 'Receipt') {
        // Receipt: Debit Bank, Credit Income
        ledgerStmt.run(
          transactionId, 
          'Bank', 
          fromAccount.account_name, 
          transactionData.amount, 
          0
        );
        ledgerStmt.run(
          transactionId, 
          'Income',
          transactionData.party_name, 
          0, 
          transactionData.amount
        );
        
        // Update bank balance (increase)
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?')
          .run(transactionData.amount, transactionData.bank_account_id);
          
      } else if (transactionData.voucher_type === 'Contra') {
        // Contra: Bank to Bank transfer
        const toAccount = db.prepare('SELECT account_name FROM bank_accounts WHERE id = ?')
          .get(transactionData.to_account_id);
        
        // Create a second transaction record for the receiving account
        const contraReceiptResult = db.prepare(`
          INSERT INTO bank_transactions 
          (voucher_number, voucher_type, transaction_date, bank_account_id, party_name, 
           amount, transaction_type, narration, cleared_status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          transactionData.voucher_number + '-IN', // Suffix for receiving side
          'Contra',
          transactionData.transaction_date,
          transactionData.to_account_id,
          `Transfer from ${fromAccount.account_name}`,
          transactionData.amount,
          'Debit', // Money coming in
          transactionData.narration || `Transfer from ${fromAccount.account_name}`,
          'Cleared',
          transactionData.created_by || 'admin'
        );
        
        const contraReceiptId = contraReceiptResult.lastInsertRowid;
        
        // Ledger entries for source account (payment side)
        ledgerStmt.run(
          transactionId, 
          'Bank', 
          toAccount.account_name, 
          transactionData.amount, 
          0
        );
        ledgerStmt.run(
          transactionId, 
          'Bank', 
          fromAccount.account_name, 
          0, 
          transactionData.amount
        );
        
        // Ledger entries for destination account (receipt side)
        ledgerStmt.run(
          contraReceiptId, 
          'Bank', 
          toAccount.account_name, 
          transactionData.amount, 
          0
        );
        ledgerStmt.run(
          contraReceiptId, 
          'Bank', 
          fromAccount.account_name, 
          0, 
          transactionData.amount
        );
        
        // Update both bank balances
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(transactionData.amount, transactionData.bank_account_id);
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(transactionData.amount, transactionData.to_account_id);
        
        console.log(`Contra Transfer: ${fromAccount.account_name} → ${toAccount.account_name}: ₹${transactionData.amount}`);
      }
      
      // If it's a PDC (Post Dated Cheque) - Only for Payment/Receipt, not Contra
      if (transactionData.is_pdc && transactionData.cheque_number && transactionData.voucher_type !== 'Contra') {
        db.prepare(`
          INSERT INTO post_dated_cheques 
          (transaction_id, cheque_number, cheque_date, amount, party_name, bank_name, status)
          VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        `).run(
          transactionId,
          transactionData.cheque_number,
          transactionData.cheque_date,
          transactionData.amount,
          transactionData.party_name,
          transactionData.bank_name || ''
        );
      }
      
      db.prepare('COMMIT').run();
      return { success: true, transactionId };
      
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error saving transaction:', error);
      throw error;
    }
  });

  ipcMain.handle('get-bank-transactions', async (event, filters) => {
    const db = getDb();
    let query = `
      SELECT 
        bt.*,
        ba.account_name,
        ba.bank_name
      FROM bank_transactions bt
      LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.status_code = 0
    `;
    
    const params = [];
    
    if (filters?.startDate && filters?.endDate) {
      query += ' AND bt.transaction_date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }
    
    if (filters?.bank_account_id) {
      query += ' AND bt.bank_account_id = ?';
      params.push(filters.bank_account_id);
    }
    
    if (filters?.voucher_type) {
      query += ' AND bt.voucher_type = ?';
      params.push(filters.voucher_type);
    }
    
    if (filters?.cleared_status) {
      query += ' AND bt.cleared_status = ?';
      params.push(filters.cleared_status);
    }
    
    query += ' ORDER BY bt.transaction_date DESC, bt.id DESC';
    
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-bank-transaction-details', async (event, transactionId) => {
    const db = getDb();
    
    const transaction = db.prepare(`
      SELECT 
        bt.*,
        ba.account_name,
        ba.bank_name,
        ba.account_number
      FROM bank_transactions bt
      LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.id = ?
    `).get(transactionId);
    
    const ledgerEntries = db.prepare(`
      SELECT * FROM bank_ledger_entries WHERE transaction_id = ?
    `).all(transactionId);
    
    const pdcInfo = db.prepare(`
      SELECT * FROM post_dated_cheques WHERE transaction_id = ?
    `).get(transactionId);
    
    return {
      ...transaction,
      ledgerEntries,
      pdcInfo
    };
  });

  ipcMain.handle('update-cheque-status', async (event, transactionId, status, clearedDate) => {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE bank_transactions 
        SET cleared_status = ?, cleared_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, clearedDate, transactionId);
      
      db.prepare(`
        UPDATE post_dated_cheques 
        SET status = ?, cleared_date = ?
        WHERE transaction_id = ?
      `).run(status, clearedDate, transactionId);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating cheque status:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-bank-transaction', async (event, transactionId) => {
    const db = getDb();
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Reverse bank balance based on transaction type
      if (transaction.transaction_type === 'Credit') {
        // Was a debit to bank (money out), so add it back
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?')
          .run(transaction.amount, transaction.bank_account_id);
      } else if (transaction.transaction_type === 'Debit') {
        // Was a credit to bank (money in), so subtract it
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?')
          .run(transaction.amount, transaction.bank_account_id);
      }
      
      // Soft delete
      db.prepare('UPDATE bank_transactions SET status_code = 1 WHERE id = ?').run(transactionId);
      
      db.prepare('COMMIT').run();
      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error deleting transaction:', error);
      throw error;
    }
  });

  // ==================== RECONCILIATION ====================
  
  // ipcMain.handle('get-unreconciled-transactions', async (event, bankAccountId) => {
  //   const db = getDb();
  //   return db.prepare(`
  //     SELECT * FROM bank_transactions
  //     WHERE bank_account_id = ?
  //     AND reconciled = 0
  //     AND cleared_status = 'Cleared'
  //     AND status_code = 0
  //     ORDER BY transaction_date
  //   `).all(bankAccountId);
  // });

  // ipcMain.handle('reconcile-transactions', async (event, { bankAccountId, transactionIds, statementDate, statementBalance, reconciledBy }) => {
  //   const db = getDb();
  //   try {
  //     db.prepare('BEGIN TRANSACTION').run();
      
  //     const placeholders = transactionIds.map(() => '?').join(',');
  //     db.prepare(`
  //       UPDATE bank_transactions 
  //       SET reconciled = 1, reconciled_date = ?
  //       WHERE id IN (${placeholders})
  //     `).run(statementDate, ...transactionIds);
      
  //     const account = db.prepare('SELECT current_balance FROM bank_accounts WHERE id = ?').get(bankAccountId);
      
  //     db.prepare(`
  //       INSERT INTO bank_reconciliation 
  //       (bank_account_id, statement_date, statement_balance, book_balance, difference, reconciled_by)
  //       VALUES (?, ?, ?, ?, ?, ?)
  //     `).run(
  //       bankAccountId,
  //       statementDate,
  //       statementBalance,
  //       account.current_balance,
  //       statementBalance - account.current_balance,
  //       reconciledBy
  //     );
      
  //     db.prepare('COMMIT').run();
  //     return { success: true };
  //   } catch (error) {
  //     db.prepare('ROLLBACK').run();
  //     console.error('Error reconciling transactions:', error);
  //     throw error;
  //   }
  // });

  // ipcMain.handle('get-reconciliation-history', async (event, bankAccountId) => {
  //   const db = getDb();
  //   return db.prepare(`
  //     SELECT * FROM bank_reconciliation
  //     WHERE bank_account_id = ?
  //     ORDER BY statement_date DESC
  //   `).all(bankAccountId);
  // });

  // ==================== PDC MANAGEMENT ====================
  
  // ipcMain.handle('get-pdc-list', async (event, filters) => {
  //   const db = getDb();
  //   let query = `
  //     SELECT 
  //       pdc.*,
  //       bt.voucher_number,
  //       bt.voucher_type,
  //       bt.bank_account_id,
  //       ba.account_name
  //     FROM post_dated_cheques pdc
  //     JOIN bank_transactions bt ON pdc.transaction_id = bt.id
  //     JOIN bank_accounts ba ON bt.bank_account_id = ba.id
  //     WHERE bt.status_code = 0
  //   `;
    
  //   const params = [];
    
  //   if (filters?.status) {
  //     query += ' AND pdc.status = ?';
  //     params.push(filters.status);
  //   }
    
  //   if (filters?.startDate && filters?.endDate) {
  //     query += ' AND pdc.cheque_date BETWEEN ? AND ?';
  //     params.push(filters.startDate, filters.endDate);
  //   }
    
  //   query += ' ORDER BY pdc.cheque_date';
    
  //   return db.prepare(query).all(...params);
  // });

  // ipcMain.handle('update-pdc-status', async (event, { pdcId, status, notes, depositDate, clearedDate }) => {
  //   const db = getDb();
  //   try {
  //     db.prepare('BEGIN TRANSACTION').run();
      
  //     const pdc = db.prepare('SELECT * FROM post_dated_cheques WHERE id = ?').get(pdcId);
      
  //     if (!pdc) {
  //       throw new Error('PDC not found');
  //     }
      
  //     // Update PDC record
  //     const updateFields = [];
  //     const updateValues = [];
      
  //     updateFields.push('status = ?');
  //     updateValues.push(status);
      
  //     if (notes) {
  //       updateFields.push('notes = ?');
  //       updateValues.push(notes);
  //     }
      
  //     if (depositDate) {
  //       updateFields.push('deposit_date = ?');
  //       updateValues.push(depositDate);
  //     }
      
  //     if (clearedDate) {
  //       updateFields.push('cleared_date = ?');
  //       updateValues.push(clearedDate);
  //     }
      
  //     updateFields.push('updated_at = CURRENT_TIMESTAMP');
  //     updateValues.push(pdcId);
      
  //     const updateQuery = `UPDATE post_dated_cheques SET ${updateFields.join(', ')} WHERE id = ?`;
  //     db.prepare(updateQuery).run(...updateValues);
      
  //     // Update related transaction cleared status
  //     let newClearedStatus = 'Pending';
  //     let transactionClearedDate = null;
      
  //     if (status === 'Cleared') {
  //       newClearedStatus = 'Cleared';
  //       transactionClearedDate = clearedDate || new Date().toISOString().split('T')[0];
  //     } else if (status === 'Bounced') {
  //       newClearedStatus = 'Bounced';
  //       transactionClearedDate = null;
  //     } else if (status === 'Cancelled') {
  //       newClearedStatus = 'Cancelled';
  //       transactionClearedDate = null;
  //     } else if (status === 'Deposited') {
  //       newClearedStatus = 'Pending';
  //       transactionClearedDate = null;
  //     }
      
  //     db.prepare(`
  //       UPDATE bank_transactions 
  //       SET cleared_status = ?, cleared_date = ?, updated_at = CURRENT_TIMESTAMP
  //       WHERE id = ?
  //     `).run(newClearedStatus, transactionClearedDate, pdc.transaction_id);
      
  //     db.prepare('COMMIT').run();
  //     return { success: true };
  //   } catch (error) {
  //     db.prepare('ROLLBACK').run();
  //     console.error('Error updating PDC status:', error);
  //     throw error;
  //   }
  // });

  // ==================== CATEGORIES ====================
  
  ipcMain.handle('get-transaction-categories', async (event, type) => {
    const db = getDb();
    let query = 'SELECT * FROM transaction_categories WHERE is_active = 1';
    
    if (type) {
      query += ' AND category_type = ? ORDER BY category_name';
      return db.prepare(query).all(type);
    }
    
    query += ' ORDER BY category_type, category_name';
    return db.prepare(query).all();
  });

  ipcMain.handle('add-transaction-category', async (event, categoryData) => {
    const db = getDb();
    try {
      const result = db.prepare(`
        INSERT INTO transaction_categories (category_name, category_type, description)
        VALUES (?, ?, ?)
      `).run(
        categoryData.category_name, 
        categoryData.category_type, 
        categoryData.description || ''
      );
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-transaction-category', async (event, categoryId) => {
    const db = getDb();
    try {
      db.prepare('UPDATE transaction_categories SET is_active = 0 WHERE id = ?').run(categoryId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  });

  // ==================== REPORTS ====================
  
  ipcMain.handle('get-bank-statement', async (event, { bankAccountId, startDate, endDate }) => {
    const db = getDb();
    
    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(bankAccountId);
    
    if (!account) {
      throw new Error('Bank account not found');
    }
    
    const transactions = db.prepare(`
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ?
      AND transaction_date BETWEEN ? AND ?
      AND status_code = 0
      ORDER BY transaction_date ASC, id ASC
    `).all(bankAccountId, startDate, endDate);
    
    // Calculate opening balance as of start date
    const priorTransactions = db.prepare(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) as total_credits
      FROM bank_transactions
      WHERE bank_account_id = ?
      AND transaction_date < ?
      AND status_code = 0
    `).get(bankAccountId, startDate);
    
    const openingBalance = account.opening_balance + 
      (priorTransactions.total_debits || 0) - 
      (priorTransactions.total_credits || 0);
    
    let runningBalance = openingBalance;
    const transactionsWithBalance = transactions.map(txn => {
      if (txn.transaction_type === 'Debit') {
        runningBalance += txn.amount;
      } else {
        runningBalance -= txn.amount;
      }
      return {
        ...txn,
        running_balance: runningBalance
      };
    });
    
    return {
      account,
      transactions: transactionsWithBalance,
      openingBalance,
      closingBalance: runningBalance
    };
  });

  ipcMain.handle('get-cashflow-report', async (event, { startDate, endDate }) => {
    const db = getDb();
    
    const receipts = db.prepare(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM bank_transactions
      WHERE voucher_type = 'Receipt'
      AND transaction_date BETWEEN ? AND ?
      AND status_code = 0
    `).get(startDate, endDate);
    
    const payments = db.prepare(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM bank_transactions
      WHERE voucher_type = 'Payment'
      AND transaction_date BETWEEN ? AND ?
      AND status_code = 0
    `).get(startDate, endDate);
    
    // Category-wise breakdown
    const expenseByCategory = db.prepare(`
      SELECT 
        ble.ledger_name as category,
        SUM(ble.debit_amount) as amount,
        COUNT(*) as count
      FROM bank_ledger_entries ble
      JOIN bank_transactions bt ON ble.transaction_id = bt.id
      WHERE ble.ledger_type = 'Expense'
      AND bt.transaction_date BETWEEN ? AND ?
      AND bt.status_code = 0
      GROUP BY ble.ledger_name
      ORDER BY amount DESC
    `).all(startDate, endDate);
    
    const incomeByCategory = db.prepare(`
      SELECT 
        ble.ledger_name as category,
        SUM(ble.credit_amount) as amount,
        COUNT(*) as count
      FROM bank_ledger_entries ble
      JOIN bank_transactions bt ON ble.transaction_id = bt.id
      WHERE ble.ledger_type = 'Income'
      AND bt.transaction_date BETWEEN ? AND ?
      AND bt.status_code = 0
      GROUP BY ble.ledger_name
      ORDER BY amount DESC
    `).all(startDate, endDate);
    
    return {
      totalReceipts: receipts.total || 0,
      totalPayments: payments.total || 0,
      netCashFlow: (receipts.total || 0) - (payments.total || 0),
      receiptCount: receipts.count || 0,
      paymentCount: payments.count || 0,
      expenseByCategory,
      incomeByCategory
    };
  });

  ipcMain.handle('get-daybook', async (event, { date }) => {
    const db = getDb();
    
    const transactions = db.prepare(`
      SELECT 
        bt.*,
        ba.account_name,
        ba.bank_name
      FROM bank_transactions bt
      LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE DATE(bt.transaction_date) = ?
      AND bt.status_code = 0
      ORDER BY bt.id
    `).all(date);
    
    const summary = db.prepare(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) as total_credits
      FROM bank_transactions
      WHERE DATE(transaction_date) = ?
      AND status_code = 0
    `).get(date);
    
    return {
      transactions,
      summary
    };
  });

  // ==================== CHEQUE DEPOSIT & STATUS ====================
  
  ipcMain.handle('deposit-cheque', async (event, { transactionId, depositDate, depositBank }) => {
    const db = getDb();
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (transaction.payment_mode !== 'Cheque') {
        throw new Error('This transaction is not a cheque payment');
      }
      
      // Update transaction status
      db.prepare(`
        UPDATE bank_transactions 
        SET cleared_status = 'Deposited', 
            cleared_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(depositDate, transactionId);
      
      // Update PDC if exists
      db.prepare(`
        UPDATE post_dated_cheques 
        SET status = 'Deposited',
            deposit_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `).run(depositDate, transactionId);
      
      db.prepare('COMMIT').run();
      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error depositing cheque:', error);
      throw error;
    }
  });

  ipcMain.handle('clear-cheque', async (event, { transactionId, clearedDate }) => {
    const db = getDb();
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Update transaction status
      db.prepare(`
        UPDATE bank_transactions 
        SET cleared_status = 'Cleared',
            cleared_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(clearedDate, transactionId);
      
      // Update PDC if exists
      db.prepare(`
        UPDATE post_dated_cheques 
        SET status = 'Cleared',
            cleared_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `).run(clearedDate, transactionId);
      
      db.prepare('COMMIT').run();
      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error clearing cheque:', error);
      throw error;
    }
  });

  ipcMain.handle('bounce-cheque', async (event, { transactionId, bounceDate, bounceReason }) => {
    const db = getDb();
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Update transaction status
      db.prepare(`
        UPDATE bank_transactions 
        SET cleared_status = 'Bounced',
            cleared_date = ?,
            narration = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bounceDate, `Cheque Bounced: ${bounceReason}`, transactionId);
      
      // Reverse bank balance
      if (transaction.transaction_type === 'Debit') {
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?')
          .run(transaction.amount, transaction.bank_account_id);
      } else {
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?')
          .run(transaction.amount, transaction.bank_account_id);
      }
      
      // Update PDC if exists
      db.prepare(`
        UPDATE post_dated_cheques 
        SET status = 'Bounced',
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `).run(bounceReason, transactionId);
      
      db.prepare('COMMIT').run();
      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error bouncing cheque:', error);
      throw error;
    }
  });

  ipcMain.handle('cancel-cheque', async (event, { transactionId, cancelReason }) => {
    const db = getDb();
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Mark as cancelled (soft delete)
      db.prepare(`
        UPDATE bank_transactions 
        SET cleared_status = 'Cancelled',
            narration = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(`Cancelled: ${cancelReason}`, transactionId);
      
      // Reverse bank balance
      if (transaction.transaction_type === 'Debit') {
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?')
          .run(transaction.amount, transaction.bank_account_id);
      } else {
        db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?')
          .run(transaction.amount, transaction.bank_account_id);
      }
      
      // Update PDC if exists
      db.prepare(`
        UPDATE post_dated_cheques 
        SET status = 'Cancelled',
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `).run(cancelReason, transactionId);
      
      db.prepare('COMMIT').run();
      return { success: true };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error cancelling cheque:', error);
      throw error;
    }
  });


// ==================== PARTY MANAGEMENT ====================

ipcMain.handle('get-all-parties', async (event, partyType = null) => {
  const db = getDb();
  const parties = [];
  
  try {
    // Get Categories (Income/Expense)
    if (!partyType || partyType === 'category') {
      const categories = db.prepare(`
        SELECT 
          'category' as source_type,
          category_name as name,
          category_type as type,
          description
        FROM transaction_categories 
        WHERE is_active = 1
        ORDER BY category_name 
      `).all();
      parties.push(...categories);
    }
    
    // Get Suppliers
    if (!partyType || partyType === 'supplier') {
      const suppliers = db.prepare(`
        SELECT 
          'supplier' as source_type,
          name,
          contact,
          gstin,
          'Supplier' as type
        FROM suppliers 
        WHERE status_code = 0
        ORDER BY name
      `).all();
      parties.push(...suppliers);
    }
    
    // Get Customers
    if (!partyType || partyType === 'customer') {
      const customers = db.prepare(`
       SELECT 
          'customer' as source_type,
          name,
          contact,
          gstin,
          'Customer' as type 
        FROM customer 
        WHERE status_code = 0
        ORDER BY name
      `).all();
      parties.push(...customers);
    }
    
    // Get Salesmen
    if (!partyType || partyType === 'salesman') {
      const salesmen = db.prepare(`
        SELECT 
          'salesman' as source_type,
          name,
          contact_info as contact,
          'Salesman' as type
        FROM salesman 
        WHERE status_code = 0
        ORDER BY name
      `).all();
      parties.push(...salesmen);
    }
    
    // Get recent unique party names from transactions (for suggestions)
    if (!partyType || partyType === 'recent') {
      const recentParties = db.prepare(`
        SELECT DISTINCT 
          'recent' as source_type,
          party_name as name,
          'Recent Transaction' as type
        FROM bank_transactions 
        WHERE party_name IS NOT NULL 
        AND party_name != ''
        AND status_code = 0
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      
      // Filter out duplicates that already exist in other sources
      const existingNames = new Set(parties.map(p => p.name?.toLowerCase()));
      const uniqueRecent = recentParties.filter(
        p => p.name && !existingNames.has(p.name.toLowerCase())
      );
      parties.push(...uniqueRecent);
    }
    
    return parties;
  } catch (error) {
    console.error('Error fetching parties:', error);
    throw error;
  }
});

ipcMain.handle('search-parties', async (event, searchTerm) => {
  const db = getDb();
  const parties = [];
  
  if (!searchTerm || searchTerm.length < 2) {
    return parties;
  }
  
  const searchPattern = `%${searchTerm}%`;
  
  try {
    // Search in categories
    const categories = db.prepare(`
      SELECT 
        'category' as source_type,
        id,
        category_name as name,
        category_type as type,
        description
      FROM transaction_categories 
      WHERE is_active = 1
      AND category_name LIKE ?
      ORDER BY category_name
      LIMIT 10
    `).all(searchPattern);
    parties.push(...categories);
    
    // Search in suppliers
    const suppliers = db.prepare(`
      SELECT 
        'supplier' as source_type,
        id,
        name,
        contact,
        'Supplier' as type
      FROM suppliers 
      WHERE status_code = 0
      AND name LIKE ?
      ORDER BY name
      LIMIT 10
    `).all(searchPattern);
    parties.push(...suppliers);
    
    // Search in customers
    const customers = db.prepare(`
      SELECT 
        'customer' as source_type,
        id,
        name,
        contact,
        'Customer' as type
      FROM customer 
      WHERE status_code = 0
      AND name LIKE ?
      ORDER BY name
      LIMIT 10
    `).all(searchPattern);
    parties.push(...customers);
    
    // Search in salesmen
    const salesmen = db.prepare(`
      SELECT 
        'salesman' as source_type,
        id,
        name,
        contact_info as contact,
        'Salesman' as type
      FROM salesman 
      WHERE status_code = 0
      AND name LIKE ?
      ORDER BY name
      LIMIT 10
    `).all(searchPattern);
    parties.push(...salesmen);
    
    return parties;
  } catch (error) {
    console.error('Error searching parties:', error);
    throw error;
  }
});
}