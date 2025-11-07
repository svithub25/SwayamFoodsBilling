function parseCashDetails(details) {
  if (details?.denomination_notes) {
    return {
      ...details,
      denomination_notes: JSON.parse(details.denomination_notes)
    };
  }
  return details;
}

function persistPaymentDetails(getDb, paymentMethod, paymentVerificationId, paymentDetails) {
  const db = getDb();
  const details = paymentDetails || {};
  switch (paymentMethod) {
    case 'upi':
      db.prepare(`
        INSERT INTO payment_upi (payment_verification_id, transaction_id, upi_id, app_name, reference_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        details.transactionId || '',
        details.upiId || '',
        details.appName || '',
        details.referenceNumber || ''
      );
      break;

    case 'cash':
      db.prepare(`
        INSERT INTO payment_cash (payment_verification_id, denomination_notes, received_by, receipt_number)
        VALUES (?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        JSON.stringify(details.denominationNotes || {}),
        details.receivedBy || '',
        details.receiptNumber || ''
      );
      break;

    case 'neft_rtgs':
      db.prepare(`
        INSERT INTO payment_neft_rtgs (payment_verification_id, transaction_reference, sender_bank, sender_account, receiver_bank, receiver_account, transfer_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        details.transactionReference || '',
        details.senderBank || '',
        details.senderAccount || '',
        details.receiverBank || '',
        details.receiverAccount || '',
        details.transferType || 'neft'
      );
      break;

    case 'cheque':
      db.prepare(`
        INSERT INTO payment_cheque (payment_verification_id, cheque_number, bank_name, branch_name, cheque_date, drawer_name, micr_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentVerificationId,
        details.chequeNumber || '',
        details.bankName || '',
        details.branchName || '',
        details.chequeDate || '',
        details.drawerName || '',
        details.micrCode || ''
      );
      break;
  }
}

function fetchPaymentDetails(getDb, payment) {
  const db = getDb();
  let paymentDetails = {};
  switch (payment.payment_method) {
    case 'upi':
      paymentDetails = db.prepare('SELECT * FROM payment_upi WHERE payment_verification_id = ?').get(payment.id) || {};
      break;
    case 'cash':
      paymentDetails = parseCashDetails(
        db.prepare('SELECT * FROM payment_cash WHERE payment_verification_id = ?').get(payment.id) || {}
      );
      break;
    case 'neft_rtgs':
      paymentDetails = db.prepare('SELECT * FROM payment_neft_rtgs WHERE payment_verification_id = ?').get(payment.id) || {};
      break;
    case 'cheque':
      paymentDetails = db.prepare('SELECT * FROM payment_cheque WHERE payment_verification_id = ?').get(payment.id) || {};
      break;
  }
  return paymentDetails;
}

export function registerPaymentHandlers({ ipcMain, getDb }) {
  ipcMain.handle('save-payment', async (event, paymentData) => {
    const { saleId, paymentMethod, amount, paymentDate, paymentDetails } = paymentData;

    const db = getDb();
    const paymentVerificationStmt = db.prepare(`
      INSERT INTO payment_verification (sale_id, payment_method, amount, payment_date)
      VALUES (?, ?, ?, ?)
    `);
    const result = paymentVerificationStmt.run(saleId, paymentMethod, amount, paymentDate);
    const paymentVerificationId = result.lastInsertRowid;

    persistPaymentDetails(getDb, paymentMethod, paymentVerificationId, paymentDetails);

    db.prepare('UPDATE sales SET is_paid = 1, payment_method = ? WHERE id = ?')
      .run(paymentMethod, saleId);

    return { success: true, paymentVerificationId };
  });

  ipcMain.handle('get-payment-details', async (event, saleId) => {
    const db = getDb();
    const paymentVerification = db.prepare(`
      SELECT * FROM payment_verification WHERE sale_id = ? ORDER BY created_at DESC
    `).all(saleId);

    return paymentVerification.map((payment) => ({
      ...payment,
      details: fetchPaymentDetails(getDb, payment)
    }));
  });

  ipcMain.handle('update-payment-status', async (event, paymentVerificationId, status) => {
    const stmt = getDb().prepare('UPDATE payment_verification SET status = ? WHERE id = ?');
    const result = stmt.run(status, paymentVerificationId);
    return result.changes > 0;
  });

  ipcMain.handle('save-purchase-payment', async (event, paymentData) => {
    const { purchaseId, paymentMethod, amount, paymentDate, paymentDetails } = paymentData;

    const db = getDb();
    const paymentVerificationStmt = db.prepare(`
      INSERT INTO payment_verification (purchase_id, payment_method, amount, payment_date)
      VALUES (?, ?, ?, ?)
    `);
    const result = paymentVerificationStmt.run(purchaseId, paymentMethod, amount, paymentDate);
    const paymentVerificationId = result.lastInsertRowid;

    persistPaymentDetails(getDb, paymentMethod, paymentVerificationId, paymentDetails);

    db.prepare('UPDATE purchases SET is_paid = 1, payment_method = ? WHERE id = ?')
      .run(paymentMethod, purchaseId);

    return { success: true, paymentVerificationId };
  });

  ipcMain.handle('get-purchase-payment-details', async (event, purchaseId) => {
    const db = getDb();
    const paymentVerification = db.prepare(`
      SELECT * FROM payment_verification WHERE purchase_id = ? ORDER BY created_at DESC
    `).all(purchaseId);

    return paymentVerification.map((payment) => ({
      ...payment,
      details: fetchPaymentDetails(getDb, payment)
    }));
  });
}


