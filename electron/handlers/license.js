import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';
import pkg from 'node-machine-id';

const { machineIdSync } = pkg;

export function createLicenseManager({ ipcMain, getDb, machineId }) {
  function getPythonMachineId() {
    return null;
  }

  function getNodeMachineId() {
    const pieces = [];

    try {
      const ifaces = os.networkInterfaces();
      let mac = '';
      const interfaceNames = Object.keys(ifaces)
        .filter(
          (name) =>
            !name.startsWith('lo') &&
            !name.startsWith('docker') &&
            !name.startsWith('br-') &&
            !name.startsWith('veth')
        )
        .sort();

      for (const name of interfaceNames) {
        const addrs = ifaces[name];
        for (const iface of addrs) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            mac = iface.mac.toLowerCase();
            break;
          }
        }
        if (mac) break;
      }

      if (mac) {
        const firstByte = parseInt(mac.split(':')[0], 16);
        if ((firstByte & 2) === 0) {
          pieces.push(`MAC:${mac}`);
        }
      }
    } catch (err) {
      console.error('Failed to get MAC:', err);
    }

    try {
      const arch = os.arch();
      if (arch) {
        pieces.push(`CPU:${arch}`);
      }
    } catch (err) {
      console.error('Failed to get CPU:', err);
    }

    try {
      let system = os.type();
      const release = os.release();
      const version = os.version();
      const platformStr = `${system}|${release}|${version}`;
      pieces.push(`PLAT:${platformStr}`);
    } catch (err) {
      console.error('Failed to get platform:', err);
    }

    try {
      const system = os.type().toLowerCase();
      let serial = '';

      if (system === 'windows_nt') {
        try {
          const output = execSync('wmic diskdrive get SerialNumber', {
            encoding: 'utf8',
            timeout: 3000
          });
          const lines = output
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l && !l.includes('SerialNumber'));
          if (lines.length > 0) {
            serial = lines[0].trim();
          }
        } catch {}
      } else if (system === 'darwin') {
        try {
          const output = execSync('system_profiler SPHardwareDataType', {
            encoding: 'utf8',
            timeout: 3000
          });
          const match = output.match(/Serial Number.*:\s*(\S+)/);
          if (match) {
            serial = match[1].trim();
          }
        } catch {}
      } else if (system === 'linux') {
        try {
          const output = execSync('lsblk -o NAME,SERIAL -J', {
            encoding: 'utf8',
            timeout: 3000
          });
          const match = output.match(/"serial":\s*"([^\"]+)"/i);
          if (match) {
            serial = match[1].trim();
          } else {
            const output2 = execSync('udevadm info --query=property --name=/dev/sda', {
              encoding: 'utf8',
              timeout: 3000
            });
            const m = output2.match(/ID_SERIAL_SHORT=(.+)/);
            if (m) {
              serial = m[1].trim();
            }
          }
        } catch {}
      }

      if (serial) {
        pieces.push(`DISK:${serial}`);
      }
    } catch (err) {
      console.error('Failed to get disk serial:', err);
    }

    try {
      const hostname = os.hostname();
      if (hostname) {
        pieces.push(`HN:${hostname}`);
      }
    } catch (err) {
      console.error('Failed to get hostname:', err);
    }

    let concat = pieces.join('|');
    if (!concat) {
      concat = `fallback-${os.hostname()}`;
    }

    console.log('DEBUG Node.js concat:', concat);

    return crypto.createHash('sha256').update(concat, 'utf8').digest('hex');
  }

  function activateLicense() {
    const id = machineIdSync();
    const activated_on = new Date().toISOString();
    getDb()
      .prepare('INSERT OR REPLACE INTO license (machine_id, activated_on) VALUES (?, ?)')
      .run(id, activated_on);
  }

  function validateLicense() {
    const pythonId = getPythonMachineId();
    const nodeId = getNodeMachineId();

    console.log('=== DEBUG MACHINE ID ===');
    console.log('Python THE EXE ID:', machineId);
    console.log('Python ID:', pythonId);
    console.log('Node ID:  ', nodeId);
    console.log('Match:    ', pythonId === nodeId);
    console.log('========================');

    const row = getDb().prepare('SELECT machine_id FROM license LIMIT 1').get();
    console.log('Stored ID:', row?.machine_id);

    return row && row.machine_id === machineId;
  }

  ipcMain.handle('activate-license', async () => {
    try {
      activateLicense();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('validate-license', async () => validateLicense());
  ipcMain.handle('get-machine-id', async () => machineIdSync());

  return {
    activateLicense,
    validateLicense,
    getNodeMachineId
  };
}


