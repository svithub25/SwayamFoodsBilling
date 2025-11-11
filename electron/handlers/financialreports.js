export function registerFinancialReportsHandlers({ ipcMain, getDb }) {
  
  // Get Profit & Loss Statement
  ipcMain.handle('get-profit-and-loss', async (event, { startDate, endDate }) => {
    const db = getDb();
    
    try {
      // 1. REVENUE (Total Sales)
      const salesData = db.prepare(`
        SELECT 
          COALESCE(SUM(s.total_amount), 0) as total_revenue,
          COALESCE(SUM(s.cgst_total + s.sgst_total), 0) as total_gst
        FROM sales s
        WHERE s.sale_date BETWEEN ? AND ?
        AND (s.status_code = 0 OR s.status_code IS NULL)
      `).get(startDate, endDate);

      const revenue = salesData.total_revenue || 0;

      // 2. COST OF GOODS SOLD (COGS)
      // Get all sale items and calculate their FIFO cost
      const sales = db.prepare(`
        SELECT s.id, s.sale_date
        FROM sales s
        WHERE s.sale_date BETWEEN ? AND ?
        AND (s.status_code = 0 OR s.status_code IS NULL)
        ORDER BY s.sale_date ASC
      `).all(startDate, endDate);

      let totalCOGS = 0;

      for (const sale of sales) {
        const saleItems = db.prepare(`
          SELECT si.id, si.item_id, si.quantity
          FROM sale_items si
          WHERE si.sale_id = ?
          AND (si.status_code = 0 OR si.status_code IS NULL)
        `).all(sale.id);

        for (const saleItem of saleItems) {
          // Check existing cost allocation
          const existingAllocations = db.prepare(`
            SELECT COALESCE(SUM(cost_amount), 0) as total_cost
            FROM sale_item_cost_allocation
            WHERE sale_item_id = ?
          `).get(saleItem.id);

          if (existingAllocations && existingAllocations.total_cost > 0) {
            totalCOGS += existingAllocations.total_cost;
          } else {
            // Calculate FIFO cost (same logic as in reports.js)
            let remainingQty = saleItem.quantity;
            let itemCost = 0;

            const purchases = db.prepare(`
              SELECT
                'opening' as source,
                -1 as purchase_item_id,
                os.opening_qty as available_qty,
                os.opening_rate as purchase_rate,
                os.opening_date as purchase_date
              FROM opening_stock os
              WHERE os.item_id = ?
              AND os.opening_date <= ?
              
              UNION ALL
              
              SELECT
                'purchase' as source,
                pi.id as purchase_item_id,
                pi.quantity as available_qty,
                pi.unit_price as purchase_rate,
                p.purchase_date
              FROM purchase_items pi
              JOIN purchases p ON pi.purchase_id = p.id
              WHERE pi.item_id = ?
              AND p.purchase_date <= ?
              AND (pi.status_code = 0 OR pi.status_code IS NULL)
              AND (p.status_code = 0 OR p.status_code IS NULL)
              
              ORDER BY purchase_date ASC, purchase_item_id ASC
            `).all(saleItem.item_id, sale.sale_date, saleItem.item_id, sale.sale_date);

            for (const purchase of purchases) {
              if (remainingQty <= 0) break;

              const usedQty = db.prepare(`
                SELECT COALESCE(SUM(quantity_allocated), 0) as used
                FROM sale_item_cost_allocation sica
                JOIN sale_items si ON sica.sale_item_id = si.id
                JOIN sales s ON si.sale_id = s.id
                WHERE sica.purchase_item_id = ?
                AND s.sale_date <= ?
                AND si.id != ?
              `).get(purchase.purchase_item_id, sale.sale_date, saleItem.id);

              const availableQty = purchase.available_qty - (usedQty?.used || 0);
              if (availableQty > 0) {
                const qtyToUse = Math.min(remainingQty, availableQty);
                const costForThisQty = qtyToUse * purchase.purchase_rate;
                
                itemCost += costForThisQty;
                remainingQty -= qtyToUse;

                // Insert allocation
                db.prepare(`
                  INSERT INTO sale_item_cost_allocation 
                  (sale_item_id, purchase_item_id, quantity_allocated, purchase_rate, cost_amount)
                  VALUES (?, ?, ?, ?, ?)
                `).run(saleItem.id, purchase.purchase_item_id, qtyToUse, purchase.purchase_rate, costForThisQty);
              }
            }

            // Handle remaining quantity
            if (remainingQty > 0) {
              const currentItem = db.prepare('SELECT purchase_rate FROM items WHERE id = ?').get(saleItem.item_id);
              if (currentItem && currentItem.purchase_rate > 0) {
                itemCost += remainingQty * currentItem.purchase_rate;
              }
            }

            totalCOGS += itemCost;
          }
        }
      }

      // 3. OPENING STOCK VALUE
      const openingStockValue = db.prepare(`
        SELECT COALESCE(SUM(opening_amount), 0) as total
        FROM opening_stock
        WHERE opening_date > ?
      `).get(startDate); 

      // 4. PURCHASES during period
      const purchasesValue = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM purchases
        WHERE purchase_date BETWEEN ? AND ?
        AND (status_code = 0 OR status_code IS NULL)
      `).get(startDate, endDate);

      // 5. CLOSING STOCK VALUE
      const closingStockValue = db.prepare(`
        SELECT COALESCE(SUM(current_stock * purchase_rate), 0) as total
        FROM items
        WHERE (status_code = 0 OR status_code IS NULL)
      `).get();

      // Alternative COGS calculation: Opening Stock + Purchases - Closing Stock
      const alternativeCOGS = (openingStockValue.total || 0) + (purchasesValue.total || 0) - (closingStockValue.total || 0);
      
      // Use the FIFO calculated COGS or alternative method (whichever is more accurate)
      const finalCOGS = totalCOGS > 0 ? totalCOGS : alternativeCOGS;

      // 6. GROSS PROFIT
      const grossProfit = revenue - finalCOGS;

      // 7. OPERATING EXPENSES
      // Get all expense categories from bank transactions
      const expenseCategories = db.prepare(`
        SELECT 
          COALESCE(tc.category_name, 'Miscellaneous') as name,
          COALESCE(SUM(bt.amount), 0) as amount
        FROM bank_transactions bt
        LEFT JOIN transaction_categories tc ON bt.party_name = tc.category_name
        WHERE bt.voucher_type = 'Payment'
        AND bt.transaction_date BETWEEN ? AND ?
        AND (bt.status_code = 0 OR bt.status_code IS NULL)
        GROUP BY tc.category_name
        ORDER BY amount DESC
      `).all(startDate, endDate);

      const totalExpenses = expenseCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0);

      // 8. OTHER INCOME
      const otherIncome = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM bank_transactions
        WHERE voucher_type = 'Receipt'
        AND transaction_date BETWEEN ? AND ?
        AND (status_code = 0 OR status_code IS NULL)
      `).get(startDate, endDate);

      // 9. NET PROFIT
      const netProfit = grossProfit - totalExpenses + (otherIncome.total || 0);

      return {
        revenue: revenue,
        cogs: finalCOGS,
        grossProfit: grossProfit,
        expenses: totalExpenses,
        netProfit: netProfit,
        expenseCategories: expenseCategories,
        otherIncome: otherIncome.total || 0,
        openingStock: openingStockValue.total || 0,
        purchases: purchasesValue.total || 0,
        closingStock: closingStockValue.total || 0
      };

    } catch (error) {
      console.error('Error generating P&L:', error);
      throw error;
    }
  });

  // Get Balance Sheet
  ipcMain.handle('get-balance-sheet', async (event, { asOfDate }) => {
    const db = getDb();
    
    try {
      // ASSETS
      
      // 1. Current Assets
      // Cash in hand and bank
      const cashAndBank = db.prepare(`
        SELECT COALESCE(SUM(current_balance), 0) as total
        FROM bank_accounts
        WHERE is_active = 1
        AND (status_code = 0 OR status_code IS NULL)
      `).get();

      // Accounts Receivable (Unpaid sales)
      const accountsReceivable = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE is_paid = 0
        AND sale_date <= ?
        AND (status_code = 0 OR status_code IS NULL)
      `).get(asOfDate);

      // Inventory (Current stock value)
      const inventory = db.prepare(`
        SELECT COALESCE(SUM(current_stock * purchase_rate), 0) as total
        FROM items
        WHERE (status_code = 0 OR status_code IS NULL)
      `).get();

      const currentAssets = (cashAndBank.total || 0) + (accountsReceivable.total || 0) + (inventory.total || 0);

      // 2. Fixed Assets (simplified - you can expand this)
      const fixedAssets = 0; // Add fixed assets tracking if needed

      const totalAssets = currentAssets + fixedAssets;

      // LIABILITIES
      
      // 1. Current Liabilities
      // Accounts Payable (Unpaid purchases)
      const accountsPayable = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM purchases
        WHERE is_paid = 0
        AND purchase_date <= ?
        AND (status_code = 0 OR status_code IS NULL)
      `).get(asOfDate);

      // Short-term debt (if any)
      const shortTermDebt = 0; // Add if you track loans

      const currentLiabilities = (accountsPayable.total || 0) + shortTermDebt;

      // 2. Long-term Liabilities
      const longTermLiabilities = 0; // Add if you track long-term loans

      const totalLiabilities = currentLiabilities + longTermLiabilities;

      // EQUITY
      
      // Calculate retained earnings (cumulative profit)
      const retainedEarnings = db.prepare(`
        SELECT 
          COALESCE(SUM(s.total_amount), 0) as total_sales,
          COALESCE(SUM(p.total_amount), 0) as total_purchases
        FROM 
          (SELECT total_amount FROM sales WHERE sale_date <= ? AND (status_code = 0 OR status_code IS NULL)) s,
          (SELECT total_amount FROM purchases WHERE purchase_date <= ? AND (status_code = 0 OR status_code IS NULL)) p
      `).get(asOfDate, asOfDate);

      // Get total expenses
      const totalExpenses = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM bank_transactions
        WHERE voucher_type = 'Payment'
        AND transaction_date <= ?
        AND (status_code = 0 OR status_code IS NULL)
      `).get(asOfDate);

      const calculatedProfit = (retainedEarnings.total_sales || 0) - 
                               (retainedEarnings.total_purchases || 0) - 
                               (totalExpenses.total || 0);

      // Capital = Total Assets - Total Liabilities - Retained Earnings
      const capital = totalAssets - totalLiabilities - calculatedProfit;

      const equity = capital + calculatedProfit;

      return {
        // Assets
        cash: cashAndBank.total || 0,
        accountsReceivable: accountsReceivable.total || 0,
        inventory: inventory.total || 0,
        currentAssets: currentAssets,
        propertyEquipment: fixedAssets,
        depreciation: 0,
        fixedAssets: fixedAssets,
        totalAssets: totalAssets,
        
        // Liabilities
        accountsPayable: accountsPayable.total || 0,
        shortTermDebt: shortTermDebt,
        currentLiabilities: currentLiabilities,
        longTermDebt: longTermLiabilities,
        longTermLiabilities: longTermLiabilities,
        totalLiabilities: totalLiabilities,
        
        // Equity
        capital: capital,
        retainedEarnings: calculatedProfit,
        equity: equity,
        
        // Balance check
        totalLiabilitiesAndEquity: totalLiabilities + equity
      };

    } catch (error) {
      console.error('Error generating Balance Sheet:', error);
      throw error;
    }
  });
}