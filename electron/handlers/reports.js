export function registerTransactionHandlers({ ipcMain, getDb }) {
  ipcMain.handle('get-transactions', async (event, { startDate, endDate, type }) => {
    const transactions = [];

    if (type === 'all' || type === 'sales') {
      const db = getDb();
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

        let totalCost = 0;
        let totalRevenue = 0;

        for (const saleItem of saleItems) {
          totalRevenue += saleItem.sale_total || 0;
          let remainingQty = saleItem.sold_quantity;

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

          for (const purchase of purchases) {
            if (remainingQty <= 0) break;
            const qtyToUse = Math.min(remainingQty, purchase.purchase_qty);
            totalCost += qtyToUse * purchase.purchase_rate;
            remainingQty -= qtyToUse;
          }

          if (remainingQty > 0) {
            const currentRate = db.prepare('SELECT purchase_rate FROM items WHERE id = ?').get(saleItem.item_id);
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
      const purchases = getDb().prepare(`
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

      purchases.forEach((purchase) => {
        transactions.push({
          type: 'purchase',
          ref_number: purchase.invoice_number,
          date: purchase.purchase_date,
          amount: purchase.total_amount,
          cost: purchase.total_amount,
          revenue: 0,
          gross_profit: 0,
          description: `Purchase - ${purchase.supplier_name || 'Unknown Supplier'}`
        });
      });
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
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


