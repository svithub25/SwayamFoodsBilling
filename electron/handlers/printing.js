import fs from 'fs';
import os from 'os';
import path from 'path';

export function registerPrintingHandler({ ipcMain, shell }) {
  ipcMain.handle('print-pdf', async (event, pdfData) => {
    try {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `invoice_${Date.now()}.pdf`);

      const buffer = Buffer.from(pdfData);
      fs.writeFileSync(tempFilePath, buffer);

      await shell.openPath(tempFilePath);

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
}


