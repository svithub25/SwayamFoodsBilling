export function registerTransactionHandlers({ ipcMain, getDb }) {
  ipcMain.handle('get-transactions', async (event, { startDate, endDate, type }) => {
    const db = getDb();
    const transactions = [];

    if (type === 'all' || type === 'sales') {
      const sales = db.prepare(`
        SELECT
          s.id,
          s.bill_number,
          s.sale_date,
          s.total_amount,
          s.customer_name,
          s.cgst_total,
          s.sgst_total,
          s.discount,
          s.rounding_off
        FROM sales s
        WHERE s.sale_date BETWEEN ? AND ?
        AND (s.status_code = 0 OR s.status_code IS NULL)
        ORDER BY s.sale_date ASC
      `).all(startDate, endDate);

      for (const sale of sales) {
        const saleItems = db.prepare(`
          SELECT
            si.id,
            si.item_id,
            si.quantity,
            si.unit_price,
            si.gst_percentage,
            si.cgst_amount,
            si.sgst_amount,
            si.total_price,
            i.name as item_name
          FROM sale_items si
          LEFT JOIN items i ON si.item_id = i.id
          WHERE si.sale_id = ?
          AND (si.status_code = 0 OR si.status_code IS NULL)
        `).all(sale.id);

        let totalCost = 0;
        let totalRevenue = 0;
        const itemBreakdown = [];

        for (const saleItem of saleItems) {
          // Revenue is the total_price from sale_items
          const itemRevenue = saleItem.total_price || 0;
          totalRevenue += itemRevenue;
          
          // First, check if cost allocation already exists for this sale item
          const existingAllocations = db.prepare(`
            SELECT 
              sica.cost_amount,
              sica.quantity_allocated,
              sica.purchase_item_id
            FROM sale_item_cost_allocation sica
            WHERE sica.sale_item_id = ?
          `).all(saleItem.id);

          let itemCost = 0;

          if (existingAllocations && existingAllocations.length > 0) {
            // Use existing allocations (includes -1 for opening, -2 for current rate, -3 for estimated)
            itemCost = existingAllocations.reduce((sum, alloc) => sum + (alloc.cost_amount || 0), 0);
            // console.log(`Using existing cost allocation for sale_item ${saleItem.id}: ₹${itemCost}`);
          } else {
            // Need to allocate cost using FIFO
            let remainingQty = saleItem.quantity;

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
            `).all(saleItem.item_id, sale.sale_date, saleItem.item_id, sale.sale_date);

            // Calculate usage (skip opening stock in usage calculation since it's always first)
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
                `).get(saleItem.item_id, sale.sale_date);
                
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
                `).get(purchase.purchase_item_id, sale.sale_date, saleItem.id);
                
                purchaseUsage.set(purchase.purchase_item_id, {
                  ...purchase,
                  remaining: purchase.available_qty - (usedQty?.used || 0)
                });
              }
            }

            // Allocate using FIFO (opening stock will be used first)
            const allocationsToInsert = [];
            for (const purchase of purchases) {
              if (remainingQty <= 0) break;
              
              const usage = purchaseUsage.get(purchase.purchase_item_id);
              if (!usage || usage.remaining <= 0) continue;

              const qtyToUse = Math.min(remainingQty, usage.remaining);
              const costForThisQty = qtyToUse * purchase.purchase_rate;
              
              itemCost += costForThisQty;
              remainingQty -= qtyToUse;

              allocationsToInsert.push({
                sale_item_id: saleItem.id,
                purchase_item_id: purchase.purchase_item_id, // -1 for opening stock
                quantity_allocated: qtyToUse,
                purchase_rate: purchase.purchase_rate,
                cost_amount: costForThisQty
              });
            }

            // Insert all allocations for this sale item
            for (const allocation of allocationsToInsert) {
              try {
                db.prepare(`
                  INSERT INTO sale_item_cost_allocation 
                  (sale_item_id, purchase_item_id, quantity_allocated, purchase_rate, cost_amount)
                  VALUES (?, ?, ?, ?, ?)
                `).run(
                  allocation.sale_item_id,
                  allocation.purchase_item_id,
                  allocation.quantity_allocated,
                  allocation.purchase_rate,
                  allocation.cost_amount
                );
              } catch (err) {
                console.log('Cost allocation insert error:', err.message);
              }
            }

            // If we still have remaining quantity (no purchase history found)
            if (remainingQty > 0) {
              const currentItem = db.prepare('SELECT purchase_rate FROM items WHERE id = ?').get(saleItem.item_id);
              if (currentItem && currentItem.purchase_rate > 0) {
                itemCost += remainingQty * currentItem.purchase_rate;
              
              } else {
                // Use 70% of base sale price as estimated cost
                const basePrice = saleItem.unit_price;
                itemCost += remainingQty * (basePrice * 0.7);
               
              }
            }
          }

          totalCost += itemCost;

          // Calculate item profit (revenue includes GST, so we subtract it)
          const itemGST = (saleItem.cgst_amount || 0) + (saleItem.sgst_amount || 0);
          const itemBaseRevenue = itemRevenue - itemGST;
          const itemProfit = itemBaseRevenue - itemCost;
          const itemProfitMargin = itemBaseRevenue > 0 ? ((itemProfit / itemBaseRevenue) * 100) : 0;

          itemBreakdown.push({
            item_name: saleItem.item_name,
            quantity: saleItem.quantity,
            sale_price: saleItem.unit_price,
            sale_total: itemRevenue,
            cost: itemCost,
            gst: itemGST,
            profit: itemProfit,
            profit_margin: itemProfitMargin.toFixed(2)
          });
        }

        // Calculate totals
        const totalGST = (sale.cgst_total || 0) + (sale.sgst_total || 0);
        const baseRevenue = totalRevenue - totalGST;
        const grossProfit = baseRevenue - totalCost;
        const profitMargin = baseRevenue > 0 ? ((grossProfit / baseRevenue) * 100).toFixed(2) : 0;

        transactions.push({
          type: 'sale',
          ref_number: sale.bill_number,
          date: sale.sale_date,
          amount: sale.total_amount, // Final bill amount (with GST)
          revenue: totalRevenue, // Sum of all item totals (with GST)
          base_revenue: baseRevenue, // Revenue without GST
          cost: totalCost, // FIFO calculated cost
          gross_profit: grossProfit, // Base Revenue - Cost
          profit_margin: profitMargin,
          cgst: sale.cgst_total || 0,
          sgst: sale.sgst_total || 0,
          total_gst: totalGST,
          description: `Sale - ${sale.customer_name || 'Walk-in Customer'}`,
          itemBreakdown: itemBreakdown
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
          p.cgst_total,
          p.sgst_total,
          s.name as supplier_name
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.purchase_date BETWEEN ? AND ?
        AND (p.status_code = 0 OR p.status_code IS NULL)
      `).all(startDate, endDate);

      for (const purchase of purchases) {
        const purchaseItems = db.prepare(`
          SELECT
            pi.quantity,
            pi.unit_price,
            pi.total_price,
            i.name as item_name
          FROM purchase_items pi
          LEFT JOIN items i ON pi.item_id = i.id
          WHERE pi.purchase_id = ?
          AND (pi.status_code = 0 OR pi.status_code IS NULL)
        `).all(purchase.id);

        const itemBreakdown = purchaseItems.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          purchase_rate: item.unit_price,
          total: item.total_price || (item.quantity * item.unit_price)
        }));

        transactions.push({
          type: 'purchase',
          ref_number: purchase.invoice_number || `PUR-${purchase.id}`,
          date: purchase.purchase_date,
          amount: purchase.total_amount,
          cost: purchase.total_amount,
          revenue: 0,
          base_revenue: 0,
          gross_profit: 0,
          profit_margin: 0,
          cgst: purchase.cgst_total || 0,
          sgst: purchase.sgst_total || 0,
          total_gst: (purchase.cgst_total || 0) + (purchase.sgst_total || 0),
          description: `Purchase - ${purchase.supplier_name || 'Unknown Supplier'}`,
          itemBreakdown: itemBreakdown
        });
      }
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  });

  // Get detailed breakdown for a transaction
  ipcMain.handle('get-transaction-details', async (event, { type, refNumber }) => {
    const db = getDb();
    
    if (type === 'sale') {
      const sale = db.prepare(`
        SELECT s.*, sm.name as salesman_name
        FROM sales s
        LEFT JOIN salesman sm ON s.salesman_id = sm.id
        WHERE s.bill_number = ?
      `).get(refNumber);

      if (!sale) return null;

      const items = db.prepare(`
        SELECT 
          si.*,
          i.name,
          i.unit
        FROM sale_items si
        LEFT JOIN items i ON si.item_id = i.id
        WHERE si.sale_id = ?
        AND (si.status_code = 0 OR si.status_code IS NULL)
      `).all(sale.id);

      // Get cost allocation details for each item
      const itemsWithCost = items.map(item => {
        const allocations = db.prepare(`
          SELECT 
            sica.*,
            CASE 
              WHEN sica.purchase_item_id = -1 THEN 'Opening Stock'
              WHEN sica.purchase_item_id = -2 THEN 'Current Purchase Rate'
              WHEN sica.purchase_item_id = -3 THEN 'Estimated (70% of Sale)'
              ELSE p.invoice_number
            END as invoice_number,
            CASE 
              WHEN sica.purchase_item_id > 0 THEN p.purchase_date
              ELSE NULL
            END as purchase_date
          FROM sale_item_cost_allocation sica
          LEFT JOIN purchase_items pi ON sica.purchase_item_id = pi.id AND sica.purchase_item_id > 0
          LEFT JOIN purchases p ON pi.purchase_id = p.id
          WHERE sica.sale_item_id = ?
          ORDER BY sica.id
        `).all(item.id);

        const totalCost = allocations.reduce((sum, a) => sum + (a.cost_amount || 0), 0);
        const itemGST = (item.cgst_amount || 0) + (item.sgst_amount || 0);
        const baseRevenue = (item.total_price || 0) - itemGST;
        const itemProfit = baseRevenue - totalCost;

        return {
          ...item,
          cost: totalCost,
          profit: itemProfit,
          total_amount: item.total_price,
          allocations
        };
      });

      return {
        ...sale,
        items: itemsWithCost
      };
    }

    return null;
  });
}

export function registerAnalyticsHandlers({ ipcMain, getDb }) {
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

      switch (timeFilter || 'all') {
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

      const db = getDb();
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

      const inventoryWithCategories = db.prepare(`
        SELECT i.*, COALESCE(c.name, 'Uncategorized') as category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE (i.status_code = 0 OR i.status_code IS NULL)
      `).all();

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
}


