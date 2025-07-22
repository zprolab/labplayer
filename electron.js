const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '/images/favicon.png'),
    title: 'Music Player'
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file operations for listening time tracking
ipcMain.handle('save-listening-record', async (event, record, folderPath) => {
  try {
    const listenFilePath = path.join(folderPath, '.listen.jsonl');
    const recordLine = JSON.stringify(record) + '\n';
    
    await fs.appendFile(listenFilePath, recordLine, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving listening record:', error);
    return { success: false, error: error.message };
  }
});

// Handle folder selection
ipcMain.handle('select-music-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Music Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      const files = await fs.readdir(folderPath);
      
      const musicFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(ext);
      });
      
      const musicFilePaths = musicFiles.map(file => ({
        name: file,
        path: path.join(folderPath, file),
        folder: folderPath
      }));
      
      return { success: true, files: musicFilePaths, folderPath };
    }
    
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { success: false, error: error.message };
  }
});