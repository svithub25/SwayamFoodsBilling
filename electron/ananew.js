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