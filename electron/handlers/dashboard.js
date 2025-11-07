export function registerDashboardHandlers({ ipcMain, getDb }) {
  ipcMain.handle('get-dashboard-data', async () => {
    try {
      const totalSales = getDb().prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE sale_date >= date('now', '-30 days')
        and (status_code = 0 OR status_code IS NULL)
      `).get();

      const totalItems = getDb().prepare(
        'SELECT COUNT(*) as count FROM items where (status_code = 0 OR status_code IS NULL)'
      ).get();

      const lowStockItems = getDb().prepare(
        'SELECT COUNT(*) as count FROM items WHERE current_stock < minimum_stock and (status_code = 0 OR status_code IS NULL)'
      ).get();

      const totalInventoryValue = getDb().prepare(
        'SELECT COALESCE(SUM(current_stock * customer_rate), 0) as total FROM items where (status_code = 0 OR status_code IS NULL)'
      ).get();

      const recentSales = getDb().prepare(`
        SELECT DATE(sale_date) as date, SUM(total_amount) as amount
        FROM sales
        WHERE sale_date >= date('now', '-30 days')
        GROUP BY DATE(sale_date)
        ORDER BY sale_date DESC
        LIMIT 30
      `).all();

      const lowStockItemsList = getDb().prepare(`
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
}


