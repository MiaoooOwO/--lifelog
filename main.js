
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window for custom title bar
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simplified for this demo
      webSecurity: false // Allow loading local resources if needed
    },
    backgroundColor: '#f3f4f6'
  });

  // Check if we are running in a packaged environment (Production) or Dev
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }
}

// --- Window Controls IPC ---
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});
// ---------------------------

// --- Data Persistence Logic ---
const DATA_FILE = 'journal_data.json';

// Get the path to the user data directory
function getDataPath() {
  return path.join(app.getPath('userData'), DATA_FILE);
}

// Handle Save Request
ipcMain.handle('save-journal', async (event, data) => {
  try {
    const filePath = getDataPath();
    fs.writeFileSync(filePath, JSON.stringify(data));
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: error.message };
  }
});

// Handle Load Request
ipcMain.handle('load-journal', async () => {
  try {
    const filePath = getDataPath();
    if (!fs.existsSync(filePath)) {
      return []; // Return empty array if file doesn't exist
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load data:', error);
    return [];
  }
});
// ------------------------------

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
