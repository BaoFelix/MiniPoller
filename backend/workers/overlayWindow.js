
const { app, BrowserWindow, ipcMain } = require('electron');

let overlayWin = null;
let lastText = process.argv[2] || '';
let serverURL = process.argv[3] || 'http://localhost:3000';
let positionX = parseInt(process.argv[4]) || 100;
let positionY = parseInt(process.argv[5]) || 100;

function createOverlay() {
  if (overlayWin) {
    overlayWin.close();
  }
  
  overlayWin = new BrowserWindow({
    width: 150,
    height: 50,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  const html = `<!DOCTYPE html>
  <html><body>
    <style>
      body{margin:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;font-family:sans-serif;border-radius:6px;}
      button{background:#2196f3;border:none;color:#fff;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;}
      button:hover{background:#1976d2;}
    </style>
    <button id="btn">Create Poll</button>
    <script>
      const { ipcRenderer } = require('electron');
      document.getElementById('btn').onclick = () => {
        ipcRenderer.send('create-poll');
      };
    </script>
  </body></html>`;
  
  overlayWin.loadURL('data:text/html,' + encodeURIComponent(html));
  overlayWin.setPosition(positionX, positionY);
  
  // Auto-close after 6 seconds
  setTimeout(() => {
    if (overlayWin) {
      overlayWin.close();
      app.quit();
    }
  }, 6000);
  
  console.log('Overlay window created at position:', positionX, positionY);
}

function openPollWindow() {
  const url = `${serverURL}?prefill=${encodeURIComponent(lastText)}`;
  console.log('Opening poll window with URL:', url);
  
  const pollWin = new BrowserWindow({ 
    width: 800, 
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  pollWin.loadURL(url);
  
  // Close overlay and quit after opening poll window
  if (overlayWin) {
    overlayWin.close();
  }
  
  // Keep poll window open, but quit the overlay app
  setTimeout(() => {
    app.quit();
  }, 1000);
}

ipcMain.on('create-poll', () => {
  console.log('create-poll event received');
  openPollWindow();
});

app.whenReady().then(() => {
  createOverlay();
});

app.on('window-all-closed', () => {
  app.quit();
});
