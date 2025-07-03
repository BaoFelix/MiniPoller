const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const { uIOhook, UiohookKey } = require('uiohook-napi');
// const robot = require('robotjs'); // Still commented as it's optional for text selection

let overlayWin = null;
let lastText = '';
let startPoint = null;
let isDragging = false;
let isCtrlPressed = false;

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
}

function openPollWindow(text) {
  const url = `http://localhost:3000/?prefill=${encodeURIComponent(text)}`;
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

app.whenReady().then(() => {
  console.log('Capture helper started with uiohook-napi support');
  
  // Create a hidden main window to keep the app alive
  const mainWin = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Set up uiohook-napi event listeners
  uIOhook.on('keydown', (e) => {
    if (e.keycode === UiohookKey.Ctrl) {
      isCtrlPressed = true;
    }
  });

  uIOhook.on('keyup', (e) => {
    if (e.keycode === UiohookKey.Ctrl) {
      isCtrlPressed = false;
    }
    
    // Detect Ctrl+C (copy action which indicates text selection)
    if (e.keycode === UiohookKey.C && isCtrlPressed) {
      setTimeout(() => {
        try {
          const clipboardText = clipboard.readText();
          if (clipboardText && clipboardText.trim() !== lastText) {
            lastText = clipboardText.trim();
            // Show overlay near current mouse position
            const { screen } = require('electron');
            const point = screen.getCursorScreenPoint();
            console.log('Text selected via Ctrl+C:', lastText.substring(0, 50) + '...');
            createOverlay(lastText, point.x + 10, point.y + 10);
          }
        } catch (error) {
          console.warn('Error reading clipboard:', error.message);
        }
      }, 100); // Small delay to ensure clipboard is updated
    }
  });

  uIOhook.on('mousedown', (e) => {
    if (e.button === 1) { // Left mouse button
      startPoint = { x: e.x, y: e.y };
      isDragging = false;
    }
  });

  uIOhook.on('mousedrag', (e) => {
    if (startPoint) {
      isDragging = true;
    }
  });

  uIOhook.on('mouseup', (e) => {
    if (e.button === 1 && startPoint && isDragging) { // Left mouse button release after drag
      // User has finished dragging (potential text selection)
      setTimeout(() => {
        try {
          const clipboardText = clipboard.readText();
          if (clipboardText && clipboardText.trim() !== lastText) {
            lastText = clipboardText.trim();
            console.log('Text selected via mouse drag:', lastText.substring(0, 50) + '...');
            createOverlay(lastText, e.x + 10, e.y + 10);
          }
        } catch (error) {
          console.warn('Error reading clipboard after mouse selection:', error.message);
        }
      }, 200); // Delay to allow text selection to complete
    }
    startPoint = null;
    isDragging = false;
  });

  // Start the hook
  try {
    uIOhook.start();
    console.log('Mouse and keyboard hooks started successfully');
  } catch (error) {
    console.error('Failed to start uiohook:', error);
    // Fallback: just show a test overlay
    setTimeout(() => {
      createOverlay('Test Mode - uiohook failed', 100, 100);
    }, 2000);
  }
});

app.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed on Windows
  if (process.platform !== 'darwin') {
    // Keep running
  }
});

app.on('before-quit', () => {
  try {
    uIOhook.stop();
    console.log('uiohook stopped');
  } catch (error) {
    console.warn('Error stopping uiohook:', error.message);
  }
});
