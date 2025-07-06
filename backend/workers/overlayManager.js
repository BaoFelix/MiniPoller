const { app, BrowserWindow, ipcMain } = require('electron');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // This shouldn't happen as this file should only be run as a worker
  console.error('overlayManager.js should only be run as a worker thread');
  process.exit(1);
}

let overlayWin = null;
let lastText = '';
let serverURL = workerData.serverURL || 'http://localhost:3000';

function createOverlay(text, x, y) {
  if (overlayWin) {
    overlayWin.close();
  }
  overlayWin = new BrowserWindow({
    width: 140,
    height: 40,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  const html = `<!DOCTYPE html>
  <html><body>
    <style>body{margin:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;font-family:sans-serif;}button{background:#2196f3;border:none;color:#fff;padding:5px 10px;border-radius:4px;cursor:pointer;}</style>
    <button id="btn">Create Poll</button>
    <script>const { ipcRenderer } = require('electron');document.getElementById('btn').onclick=()=>ipcRenderer.send('create-poll');</script>
  </body></html>`;
  
  overlayWin.loadURL('data:text/html,' + encodeURIComponent(html));
  overlayWin.setPosition(x, y);
  
  console.log('Overlay created at position:', x, y);
}

function openPollWindow(text) {
  const url = `${serverURL}?prefill=${encodeURIComponent(text)}`;
  console.log('Opening poll window with URL:', url);
  
  const pollWin = new BrowserWindow({ 
    width: 600, 
    height: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  pollWin.loadURL(url);
  
  // Add error handling
  pollWin.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load URL:', validatedURL, errorCode, errorDescription);
  });
}

ipcMain.on('create-poll', () => {
  console.log('create-poll event received');
  if (overlayWin) {
    overlayWin.close();
    overlayWin = null;
  }
  if (lastText) {
    console.log('Creating poll with text:', lastText.substring(0, 50) + '...');
    openPollWindow(lastText);
  } else {
    console.log('No text available for poll creation');
  }
});

// Handle messages from main thread
parentPort.on('message', (message) => {
  if (message.type === 'create-overlay') {
    lastText = message.text;
    createOverlay(message.text, message.position.x + 10, message.position.y + 10);
  } else if (message.type === 'stop') {
    if (overlayWin) {
      overlayWin.close();
    }
    app.quit();
  }
});

app.whenReady().then(() => {
  console.log('Overlay manager started in worker thread');
  
  // Create a hidden main window to keep the app alive
  const mainWin = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  // Send ready message to main thread
  parentPort.postMessage({
    type: 'ready',
    message: 'Overlay manager started successfully'
  });
});

app.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed on Windows
  if (process.platform !== 'darwin') {
    // Keep running
  }
});

app.on('before-quit', () => {
  console.log('Overlay manager shutting down');
});
