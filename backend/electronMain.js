const { app, BrowserWindow, ipcMain } = require('electron');
const { Worker } = require('worker_threads');
const path = require('path');

let captureWorker;
let shuttingDown = false;
let overlayWindow = null;
let overlayTimer = null; // 添加定时器变量
let overlayCreating = false; // 添加创建锁
let lastOverlayRequest = 0; // 添加防抖机制
let serverURL = '';

function createOverlayWindow(text, position) {
  console.log('Creating overlay window...');
  
  // 防抖机制：如果距离上次请求太近，忽略
  const now = Date.now();
  if (now - lastOverlayRequest < 500) {
    console.log('Overlay request too frequent, ignoring');
    return;
  }
  lastOverlayRequest = now;
  
  // 如果正在创建中，忽略新的请求
  if (overlayCreating) {
    console.log('Overlay creation already in progress, ignoring request');
    return;
  }
  
  overlayCreating = true; // 设置创建锁
  
  // 强制清理所有之前的overlay资源
  cleanupOverlay();
  
  // 添加小延迟确保之前的窗口完全关闭
  setTimeout(() => {
    createActualOverlay(text, position);
  }, 30); // 减少延迟时间，提升响应速度
}

function cleanupOverlay() {
  // 清理定时器
  if (overlayTimer) {
    console.log('Clearing existing timer');
    clearTimeout(overlayTimer);
    overlayTimer = null;
  }
  
  // 强制关闭现有overlay
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    console.log('Closing existing overlay window');
    overlayWindow.removeAllListeners(); // 移除所有事件监听器
    overlayWindow.close();
    overlayWindow = null;
  }
}

function createActualOverlay(text, position) {
  // 再次检查确保没有现有的overlay
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    console.log('Warning: Overlay still exists, forcing close');
    overlayWindow.destroy(); // 使用destroy而不是close
    overlayWindow = null;
  }

  // 获取屏幕信息来处理多显示器坐标
  const { screen } = require('electron');
  const point = { x: position.x, y: position.y };
  
  // 找到鼠标所在的显示器
  const currentDisplay = screen.getDisplayNearestPoint(point);
  const primaryDisplay = screen.getPrimaryDisplay();
  
  console.log('Mouse position:', position.x, position.y);
  console.log('Current display bounds:', currentDisplay.bounds);
  console.log('Primary display bounds:', primaryDisplay.bounds);
  
  // 计算最终窗口位置，确保在鼠标附近且在屏幕范围内
  const windowWidth = 150;
  const windowHeight = 40;
  
  // 将全局坐标转换为当前显示器的本地坐标
  let finalX = position.x - currentDisplay.bounds.x;
  let finalY = position.y - currentDisplay.bounds.y;
  
  // 调整位置以居中鼠标，但确保窗口完全在屏幕内
  finalX = Math.max(0, Math.min(finalX - windowWidth / 2, currentDisplay.bounds.width - windowWidth));
  finalY = Math.max(0, Math.min(finalY - windowHeight / 2, currentDisplay.bounds.height - windowHeight));
  
  // 转换回绝对坐标
  finalX += currentDisplay.bounds.x;
  finalY += currentDisplay.bounds.y;
  
  console.log('Final position (centered and bounded):', finalX, finalY);
  
  overlayWindow = new BrowserWindow({
    width: 150,
    height: 40,
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
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(21, 128, 61, 0.95));
        border: 2px solid rgba(21, 128, 61, 0.8);
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 
          0 4px 15px rgba(34, 197, 94, 0.3),
          0 2px 8px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        letter-spacing: 0.3px;
        position: relative;
        overflow: hidden;
      }
      
      button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.5s;
      }
      
      button:hover::before {
        left: 100%;
      }
      
      button:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(5, 150, 105, 1));
        border-color: rgba(5, 150, 105, 1);
        transform: translateY(-2px) scale(1.02);
        box-shadow: 
          0 6px 20px rgba(34, 197, 94, 0.4),
          0 4px 12px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }
      
      button:active {
        transform: translateY(0) scale(1);
        box-shadow: 
          0 2px 8px rgba(34, 197, 94, 0.3),
          0 1px 4px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
  
  // 使用调整后的坐标
  overlayWindow.setPosition(finalX, finalY);
  console.log('Overlay window positioned at:', finalX, finalY);
  
  // Handle overlay window close event
  overlayWindow.on('closed', () => {
    overlayWindow = null;
    overlayCreating = false; // 释放创建锁
    if (overlayTimer) {
      clearTimeout(overlayTimer);
      overlayTimer = null;
    }
  });
  
  // Auto-close after 5 seconds，使用管理的定时器
  overlayTimer = setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close();
    }
    overlayTimer = null;
    overlayCreating = false; // 释放创建锁
  }, 5000);
  
  overlayCreating = false; // 创建完成，释放锁
  console.log('Overlay window created at exact mouse position:', position.x, position.y);
}

/**
 * Open poll creation window
 */
function openPollWindow(text) {
  console.log('openPollWindow called with text:', text);
  console.log('Current serverURL:', serverURL);
  
  if (!serverURL) {
    console.error('ServerURL is not set! Cannot open poll window.');
    return;
  }
  
  const url = `${serverURL}?prefill=${encodeURIComponent(text)}`;
  console.log('Opening poll window with URL:', url);
  
  try {
    const pollWin = new BrowserWindow({ 
      width: 800, 
      height: 600,
      show: false, // 先隐藏，等加载完成后显示
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false // Allow loading local resources
      }
    });
    
    // 完全隐藏菜单栏
    pollWin.setMenuBarVisibility(false);
    
    // 页面加载完成后显示窗口
    pollWin.once('ready-to-show', () => {
      pollWin.show();
      console.log('Poll window displayed successfully');
    });
    
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
    
    // Error handling for page load
    pollWin.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Poll window failed to load:', errorCode, errorDescription);
    });
    
    // Clear cache before loading URL
    pollWin.webContents.session.clearCache();
    pollWin.webContents.session.clearStorageData();
    
    pollWin.loadURL(url);
    
  } catch (error) {
    console.error('Error creating poll window:', error);
  }
  
  // Close overlay window and clear resources
  cleanupOverlay();
  overlayCreating = false; // 释放创建锁
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
  overlayCreating = false; // 释放创建锁
  
  // 使用统一的清理函数
  cleanupOverlay();
  
  if (captureWorker) {
    captureWorker.postMessage({ type: 'stop' });
    captureWorker.terminate();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});
