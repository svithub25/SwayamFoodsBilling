import fs from 'fs';

export function registerAppInfoHandler({ ipcMain, app, packageJsonPath }) {
  ipcMain.handle('get-app-info', async () => {
    let pkg = {};
    try {
      const data = fs.readFileSync(packageJsonPath, 'utf8');
      pkg = JSON.parse(data);
    } catch (err) {
      console.error('Error reading package.json:', err);
    }

    return {
      name: app.getName(),
      version: app.getVersion(),
      copyright: app.getCopyright ? app.getCopyright() : pkg.copyright || '',
      productName: pkg.productName || pkg.name || app.getName(),
      description: pkg.description || '',
      author: pkg.author || '',
      company: pkg.company || '',
      license: 'Swayam Foods',
      homepage: pkg.homepageUrl || pkg.homepage || '',
      repository: pkg.repository?.url || '',
      bugs: pkg.bugs?.url || '',
      supportEmail: pkg.support?.email || '',
      supportPhone: pkg.support?.phone || '',
      releaseDate: pkg.releaseDate || '',
      builtWith: pkg.builtWith || [],
      changelog: pkg.changelog || ''
    };
  });
}


