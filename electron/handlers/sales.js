export function registerSalesHandlers({ ipcMain, getDb }) {
  ipcMain.handle('generate-bill-number', async () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const yearSuffix = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;

    const lastBill = getDb().prepare(`
      SELECT bill_number FROM sales
      WHERE bill_number LIKE ?
      ORDER BY id DESC LIMIT 1
    `).get(`SF/${yearSuffix}/%`);

    let nextNumber = 1;
    if (lastBill?.bill_number) {
      const match = lastBill.bill_number.match(/SF\/\d{2}-\d{2}\/(\d+)/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `SF/${yearSuffix}/${nextNumber.toString().padStart(0, '0')}`;
  });

  ipcMain.handle('save-sale', async (event, saleData) => {
    const db = getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const {
        bill_number,
        customer_name,
        customer_contact,
        customer_address,
        customer_gstin,
        sale_date,
        items,
        discount,
        total_amount,
        rounding_off,
        salesman_id,
        sale_type
      } = saleData;

      const saleStmt = db.prepare(
        'INSERT INTO sales (bill_number, customer_name, customer_contact, customer_address, customer_gstin, sale_date, discount, total_amount, rounding_off, salesman_id, sale_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      const saleResult = saleStmt.run(
        bill_number,
        customer_name,
        customer_contact,
        customer_address,
        customer_gstin,
        sale_date,
        discount,
        total_amount,
        rounding_off,
        salesman_id,
        sale_type || 'customer'
      );
      const saleId = saleResult.lastInsertRowid;

      // Save sale items
      const saleItemStmt = db.prepare(`
        INSERT INTO sale_items 
        (sale_id, item_id, quantity, unit_price, cgst, sgst, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of saleData.items) {
        saleItemStmt.run(
          saleResult.lastInsertRowid,
          item.item_id,
          item.quantity,
          item.unit_price,
          item.cgst || 0,
          item.sgst || 0,
          item.total_price
        );

        // CHANGED: Reduce stock directly here instead of using reduceClosingStock
        db.prepare(`
          UPDATE items 
          SET current_stock = current_stock - ?
          WHERE id = ?
        `).run(item.quantity, item.item_id);
      }

      db.prepare('COMMIT').run();
      return { success: true, saleId: saleResult.lastInsertRowid };
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('Error saving sale:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-bill', async (event, billId) => {
    const db = getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      // Delete cost allocations first
      const saleItemIds = db.prepare('SELECT id FROM sale_items WHERE sale_id = ?')
        .all(billId)
        .map(item => item.id);
      
      if (saleItemIds.length > 0) {
        const placeholders = saleItemIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM sale_item_cost_allocation WHERE sale_item_id IN (${placeholders})`)
          .run(...saleItemIds);
      }
      
      const saleItems = db.prepare(
        'SELECT item_id, quantity FROM sale_items WHERE sale_id = ? AND (status_code = 0 OR status_code IS NULL)'
      ).all(billId);

      saleItems.forEach((item) => {
        db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
          .run(item.quantity, item.item_id);
      });

      db.prepare('UPDATE sales SET status_code = 1 WHERE id = ?').run(billId);
      db.prepare('UPDATE sale_items SET status_code = 1 WHERE sale_id = ?').run(billId);

      db.prepare('COMMIT').run();
      
      return { success: true };
      
    } catch (error) {
      try {
        db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      throw error;
    }
  });

  ipcMain.handle('get-sale-details', async (event, saleId) => {
    try {
      const db = getDb();
      const sale = db.prepare(`
        SELECT s.*, sm.name as salesman_name, sm.contact_info as salesman_contact, sm.address as salesman_address
        FROM sales s
        LEFT JOIN salesman sm ON s.salesman_id = sm.id
        WHERE s.id = ?
      `).get(saleId);

      if (!sale) {
        throw new Error('Sale not found');
      }

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

  ipcMain.handle('update-sale', async (event, saleId, updatedSale) => {
    const db = getDb();
    
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      // STEP 1: Delete existing cost allocations for this sale
      const oldSaleItemIds = db.prepare('SELECT id FROM sale_items WHERE sale_id = ?')
        .all(saleId)
        .map(item => item.id);
      
      if (oldSaleItemIds.length > 0) {
        const placeholders = oldSaleItemIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM sale_item_cost_allocation WHERE sale_item_id IN (${placeholders})`)
          .run(...oldSaleItemIds);
      }

      const oldItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
      const oldMap = {};
      oldItems.forEach((item) => {
        oldMap[item.item_id] = item;
      });
      const newMap = {};
      updatedSale.items.forEach((item) => {
        newMap[item.id] = item;
      });

      // STEP 2: Adjust stock
      for (const oldItem of oldItems) {
        const newItem = newMap[oldItem.item_id];
        if (!newItem) {
          db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
            .run(oldItem.quantity, oldItem.item_id);
        } else if (parseFloat(newItem.quantity) !== parseFloat(oldItem.quantity)) {
          db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?')
            .run(oldItem.quantity - parseFloat(newItem.quantity), oldItem.item_id);
        }
      }

      for (const newItem of updatedSale.items) {
        if (!oldMap[newItem.id]) {
          db.prepare('UPDATE items SET current_stock = current_stock - ? WHERE id = ?')
            .run(parseFloat(newItem.quantity), newItem.id);
        }
      }

      // STEP 3: Update sale header
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

      // STEP 4: Delete old sale items
      db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);

      // STEP 5: Insert new sale items and recalculate cost allocations immediately
      const saleItemStmt = db.prepare(`
        INSERT INTO sale_items
          (sale_id, item_id, quantity, unit_price, total_price, sale_type, customer_rate, salesman_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const costAllocationStmt = db.prepare(`
        INSERT INTO sale_item_cost_allocation 
        (sale_item_id, purchase_item_id, quantity_allocated, purchase_rate, cost_amount)
        VALUES (?, ?, ?, ?, ?)
      `);

      updatedSale.items.forEach((item) => {
        const oldItem = oldMap[item.id];
        let customerRate = oldItem?.customer_rate;
        let salesmanRate = oldItem?.salesman_rate;

        if (!customerRate || !salesmanRate) {
          const itemRates = db.prepare('SELECT customer_rate, salesman_rate FROM items WHERE id = ?').get(item.id);
          customerRate = customerRate || itemRates?.customer_rate || 0;
          salesmanRate = salesmanRate || itemRates?.salesman_rate || 0;
        }

        const result = saleItemStmt.run(
          saleId,
          item.id,
          parseFloat(item.quantity),
          parseFloat(item.unit_price),
          parseFloat(item.total_price),
          updatedSale.sale_type || 'customer',
          customerRate,
          salesmanRate
        );

        const newSaleItemId = result.lastInsertRowid;

        // STEP 6: Allocate cost using FIFO immediately for this item
        let remainingQty = parseFloat(item.quantity);

        // Get OPENING STOCK + PURCHASES for FIFO
        const purchases = db.prepare(`
          SELECT
            'opening' as source,
            -1 as purchase_item_id,
            os.opening_qty as available_qty,
            os.opening_rate as purchase_rate,
            os.opening_date as purchase_date,
            'Opening Stock' as invoice_number
          FROM opening_stock os
          WHERE os.item_id = ?
          AND os.opening_date <= ?
          
          UNION ALL
          
          SELECT
            'purchase' as source,
            pi.id as purchase_item_id,
            pi.quantity as available_qty,
            pi.unit_price as purchase_rate,
            p.purchase_date,
            p.invoice_number
          FROM purchase_items pi
          JOIN purchases p ON pi.purchase_id = p.id
          WHERE pi.item_id = ?
          AND p.purchase_date <= ?
          AND (pi.status_code = 0 OR pi.status_code IS NULL)
          AND (p.status_code = 0 OR p.status_code IS NULL)
          
          ORDER BY purchase_date ASC, purchase_item_id ASC
        `).all(item.id, updatedSale.sale_date, item.id, updatedSale.sale_date);

        // Calculate usage for each purchase
        const purchaseUsage = new Map();
        for (const purchase of purchases) {
          if (purchase.source === 'opening') {
            // For opening stock, check how much has been used
            const usedQty = db.prepare(`
              SELECT COALESCE(SUM(quantity_allocated), 0) as used
              FROM sale_item_cost_allocation sica
              JOIN sale_items si ON sica.sale_item_id = si.id
              JOIN sales s ON si.sale_id = s.id
              WHERE sica.purchase_item_id = -1
              AND si.item_id = ?
              AND s.sale_date < ?
            `).get(item.id, updatedSale.sale_date);
            
            purchaseUsage.set(-1, {
              ...purchase,
              remaining: purchase.available_qty - (usedQty?.used || 0)
            });
          } else {
            const usedQty = db.prepare(`
              SELECT COALESCE(SUM(quantity_allocated), 0) as used
              FROM sale_item_cost_allocation sica
              JOIN sale_items si ON sica.sale_item_id = si.id
              JOIN sales s ON si.sale_id = s.id
              WHERE sica.purchase_item_id = ?
              AND s.sale_date <= ?
              AND si.id != ?
            `).get(purchase.purchase_item_id, updatedSale.sale_date, newSaleItemId);
            
            purchaseUsage.set(purchase.purchase_item_id, {
              ...purchase,
              remaining: purchase.available_qty - (usedQty?.used || 0)
            });
          }
        }

        // Allocate using FIFO
        for (const purchase of purchases) {
          if (remainingQty <= 0) break;
          
          const usage = purchaseUsage.get(purchase.purchase_item_id);
          if (!usage || usage.remaining <= 0) continue;

          const qtyToUse = Math.min(remainingQty, usage.remaining);
          const costForThisQty = qtyToUse * purchase.purchase_rate;
          
          remainingQty -= qtyToUse;

          try {
            costAllocationStmt.run(
              newSaleItemId,
              purchase.purchase_item_id,
              qtyToUse,
              purchase.purchase_rate,
              costForThisQty
            );
          } catch (err) {
            console.log('Cost allocation insert error:', err.message);
          }
        }

        // If we still have remaining quantity (no purchase history found)
        if (remainingQty > 0) {
          const currentItem = db.prepare('SELECT purchase_rate FROM items WHERE id = ?').get(item.id);
          if (currentItem && currentItem.purchase_rate > 0) {
            // Allocate with current purchase rate and purchase_item_id = -2 (indicating estimated cost)
            costAllocationStmt.run(
              newSaleItemId,
              -2, // Special ID for estimated cost
              remainingQty,
              currentItem.purchase_rate,
              remainingQty * currentItem.purchase_rate
            );
            // console.log(`Using current purchase_rate for remaining ${remainingQty} units: ₹${currentItem.purchase_rate}`);
          } else {
            // Use 70% of sale price as estimated cost
            const basePrice = parseFloat(item.unit_price);
            const estimatedCost = basePrice * 0.7;
            costAllocationStmt.run(
              newSaleItemId,
              -3, // Special ID for estimated from sale price
              remainingQty,
              estimatedCost,
              remainingQty * estimatedCost
            );
            // console.log(`Using estimated cost (70% of sale price) for remaining ${remainingQty} units`);
          }
        }
      });

      db.prepare('COMMIT').run();
      
      return { success: true, needsRecalculation: false }; // Changed to false since we already calculated
    
    } catch (error) {
      try {
        db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      console.error('Update sale error:', error);
      throw error;
    }
  });

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

    return getDb().prepare(query).all(...params);
  });

  ipcMain.handle('get-sales-history', async () => {
    return getDb().prepare(`
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
  });

  ipcMain.handle('update-sale-paid-status', async (event, saleId, isPaid) => {
    const stmt = getDb().prepare('UPDATE sales SET is_paid = ? WHERE id = ?');
    const result = stmt.run(isPaid ? 1 : 0, saleId);
    return result.changes > 0;
  });

  ipcMain.handle('update-sale-approved-status', async (event, saleId, isApproved) => {
    const stmt = getDb().prepare('UPDATE sales SET is_approved = ? WHERE id = ?');
    const result = stmt.run(isApproved ? 1 : 0, saleId);
    return result.changes > 0;
  });

  ipcMain.handle('get-sale-payment-for-approval', async (event, saleId) => {
    const db = getDb();
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

    const paymentVerification = db.prepare(`
      SELECT * FROM payment_verification
      WHERE sale_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(saleId);

    if (!paymentVerification) {
      return { sale, hasPayment: false, paymentDetails: null };
    }

    let paymentMethodDetails = {};
    switch (paymentVerification.payment_method) {
      case 'upi':
        paymentMethodDetails = db.prepare(
          'SELECT * FROM payment_upi WHERE payment_verification_id = ?'
        ).get(paymentVerification.id) || {};
        break;
      case 'cash':
        paymentMethodDetails = db.prepare(
          'SELECT * FROM payment_cash WHERE payment_verification_id = ?'
        ).get(paymentVerification.id) || {};
        if (paymentMethodDetails.denomination_notes) {
          paymentMethodDetails.denomination_notes = JSON.parse(paymentMethodDetails.denomination_notes);
        }
        break;
      case 'neft_rtgs':
        paymentMethodDetails = db.prepare(
          'SELECT * FROM payment_neft_rtgs WHERE payment_verification_id = ?'
        ).get(paymentVerification.id) || {};
        break;
      case 'cheque':
        paymentMethodDetails = db.prepare(
          'SELECT * FROM payment_cheque WHERE payment_verification_id = ?'
        ).get(paymentVerification.id) || {};
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

  ipcMain.handle('get-approval-history', async (event, saleId) => {
    const sale = getDb().prepare(`
      SELECT s.is_approved, s.bill_number, s.total_amount
      FROM sales s
      WHERE s.id = ?
    `).get(saleId);

    return {
      saleId,
      currentStatus: sale?.is_approved === 1 ? 'Approved' : 'Not Approved',
      billNumber: sale?.bill_number,
      totalAmount: sale?.total_amount
    };
  });

  ipcMain.handle('get-Salesman-Commission', async () => {
    const db = getDb();
    const sales = db.prepare(`
      SELECT s.id as sale_id, s.bill_number, s.customer_name, s.customer_contact, s.sale_date, s.salesman_id, salesman.name as salesman_name
      FROM sales s
      LEFT JOIN salesman ON s.salesman_id = salesman.id
      WHERE s.sale_type = 'customer' AND (s.status_code = 0 OR s.status_code IS NULL)
      ORDER BY s.sale_date DESC
    `).all();

    const commissionData = [];
    for (const sale of sales) {
      const items = db.prepare(`
        SELECT si.*, i.name as item_name, i.id as item_id
        FROM sale_items si
        LEFT JOIN items i ON si.item_id = i.id
        WHERE si.sale_id = ? AND si.sale_type = 'customer'
      `).all(sale.sale_id);

      let totalCommission = 0;
      const itemCommissions = items.map((item) => {
        const commission = (item.unit_price - item.salesman_rate) * item.quantity;
        totalCommission += commission;
        return {
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          customer_rate: item.customer_rate,
          salesman_rate: item.salesman_rate,
          commission
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
}


