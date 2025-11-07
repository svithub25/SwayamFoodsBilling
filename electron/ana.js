// ...existing code...

ipcMain.handle('get-analytics-data', async (event, { timeFilter } = {}) => {
  try {
    // ...existing code for date range calculation...

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

    // Return this data along with regular inventory, saleItems, purchaseItems
    return {
      // ...existing overview, topSellingItems, salesByCategory, etc...
      inventoryWithCategories,
      saleItemsWithCategories,
      purchaseItemsWithCategories
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    throw error;
  }
});