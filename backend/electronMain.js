const { app, BrowserWindow, ipcMain } = require('electron');
const { Worker } = require('worker_threads');
const path = require('path');

let captureWorker;
let shuttingDown = false;
let overlayWindow = null;
let serverURL = '';

/**
 * Create overlay window directly in main process
 */
function createOverlayWindow(text, position) {
  // Close existing overlay if it exists
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
  
  overlayWindow = new BrowserWindow({
    width: 140,
    height: 35,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    resizable: false,
    backgroundColor: 'rgba(0,0,0,0)', // Completely transparent background
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  const html = `<!DOCTYPE html>
  <html><head><meta charset="UTF-8"></head><body>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        height: 100%;
        background: transparent;
        overflow: hidden;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      button {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 123, 255, 0.8);
        color: #007bff;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
      }
      button:hover {
        background: rgba(255, 255, 255, 1);
        border-color: #0056b3;
        color: #0056b3;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
    </style>
    <button id="btn">📊 Create Poll</button>
    <script>
      const { ipcRenderer } = require('electron');
      document.getElementById('btn').onclick = () => {
        ipcRenderer.send('create-poll', decodeURIComponent('${encodeURIComponent(text)}'));
      };
    </script>
  </body></html>`;
  
  overlayWindow.loadURL('data:text/html,' + encodeURIComponent(html));
  overlayWindow.setPosition(position.x, position.y);
  
  // Handle overlay window close event
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
  
  // Auto-close after 6 seconds
  setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close();
    }
  }, 6000);
  
  console.log('Overlay window created at position:', position.x, position.y);
}

/**
 * Open poll creation window
 */
function openPollWindow(text) {
  const url = `${serverURL}?prefill=${encodeURIComponent(text)}`;
  console.log('Opening poll window with URL:', url);
  
  const pollWin = new BrowserWindow({ 
    width: 800, 
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow loading local resources
    }
  });
  
  // 完全隐藏菜单栏
  pollWin.setMenuBarVisibility(false);
  
  // 可选：设置右键菜单只包含保存图片功能
  pollWin.webContents.on('context-menu', (e, params) => {
    const { Menu, MenuItem } = require('electron');
    const contextMenu = new Menu();
    
    contextMenu.append(new MenuItem({
      label: 'Save Chart as Image',
      click: () => {
        pollWin.webContents.executeJavaScript(`
          // 尝试获取图表并保存为图片
          const canvas = document.querySelector('#resultsChart');
          if (canvas) {
            const link = document.createElement('a');
            link.download = 'poll-results.png';
            link.href = canvas.toDataURL();
            link.click();
          } else {
            alert('No chart found to save.');
          }
        `);
      }
    }));
    
    contextMenu.popup({ window: pollWin });
  });
  
  // Clear cache before loading URL
  pollWin.webContents.session.clearCache();
  pollWin.webContents.session.clearStorageData();
  
  pollWin.loadURL(url);
  
  // Close overlay window
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
}

/**
 * Start the capture worker
 */
function startCaptureWorker() {
  const captureWorkerPath = path.join(__dirname, 'workers', 'captureWorker.js');
  
  try {
    captureWorker = new Worker(captureWorkerPath);
    
    captureWorker.on('message', (message) => {
      if (message.type === 'ready') {
        console.log('Capture worker ready:', message.message);
      } else if (message.type === 'text-selected') {
        console.log(`Text selected via ${message.method}:`, message.text.substring(0, 50) + '...');
        // Create overlay window in main thread
        createOverlayWindow(message.text, message.position);
      } else if (message.type === 'error') {
        console.error('Capture worker error:', message.message);
      }
    });

    captureWorker.on('error', (error) => {
      console.error('Capture worker error:', error);
      if (!shuttingDown) {
        setTimeout(() => startCaptureWorker(), 5000);
      }
    });

    captureWorker.on('exit', (code) => {
      console.log(`Capture worker exited with code ${code}`);
      if (!shuttingDown) {
        setTimeout(() => startCaptureWorker(), 5000);
      }
    });

    console.log('Started text capture module using worker threads');
  } catch (error) {
    console.error('Failed to start capture worker:', error);
  }
}

// Start Node.js server in background
const { spawn } = require('child_process');
const getLocalIPAddress = require("./utils/utilities").getLocalIPAddress;

let serverProcess;

// Only start server if we're in electron environment
if (process.versions.electron) {
  serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'inherit'
  });

  console.log('Server process started');

  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    app.quit();
  });
}

app.whenReady().then(() => {
  console.log('Electron app ready');
  
  // Wait for server to start, then get URL dynamically
  setTimeout(() => {
    const localIP = getLocalIPAddress();
    const port = process.env.PORT || 3000;
    serverURL = `http://${localIP}:${port}`;
    console.log('Server URL set to:', serverURL);
    
    // Handle IPC from overlay windows
    ipcMain.on('create-poll', (event, text) => {
      console.log('create-poll event received with text:', text);
      openPollWindow(text);
    });
    
    // Start capture worker
    if (process.platform === 'win32') {
      startCaptureWorker();
    }
  }, 2000);
  
  // Create a hidden main window to keep the app alive
  const mainWin = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit the app, keep it running for overlay windows
});

app.on('before-quit', () => {
  shuttingDown = true;
  if (captureWorker) {
    captureWorker.postMessage({ type: 'stop' });
    captureWorker.terminate();
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});
