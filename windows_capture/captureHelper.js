const { app, BrowserWindow, ipcMain } = require('electron');
const ioHook = require('iohook');
const robot = require('robotjs');
const clipboard = require('clipboardy');

let overlayWin = null;
let lastText = '';
let startPoint = null;

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
  const pollWin = new BrowserWindow({ width: 600, height: 400 });
  pollWin.loadURL(url);
}

ipcMain.on('create-poll', () => {
  if (overlayWin) {
    overlayWin.close();
    overlayWin = null;
  }
  if (lastText) {
    openPollWindow(lastText);
  }
});

app.whenReady().then(() => {
  ioHook.on('mousedown', event => {
    if (event.button === 1) {
      startPoint = { x: event.x, y: event.y };
    }
  });

  ioHook.on('mouseup', event => {
    if (event.button === 1 && startPoint) {
      const endPoint = { x: event.x, y: event.y };
      const w = Math.abs(endPoint.x - startPoint.x);
      const h = Math.abs(endPoint.y - startPoint.y);
      startPoint = null;
      if (w > 0 && h > 0) {
        robot.keyTap('c', ['control']);
        setTimeout(() => {
          const text = clipboard.readSync();
          if (text && text !== lastText) {
            lastText = text;
            createOverlay(text, endPoint.x + 10, endPoint.y - 10);
          }
        }, 100);
      }
    }
  });

  ioHook.start();
});

app.on('window-all-closed', () => {
  ioHook.unload();
  ioHook.stop();
  app.quit();
});
