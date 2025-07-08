const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const { execSync } = require('child_process');

if (isMainThread) {
  // This shouldn't happen as this file should only be run as a worker
  console.error('captureWorker.js should only be run as a worker thread');
  process.exit(1);
}

// Worker thread state
let lastText = '';
let lastTextTime = 0;
let startPoint = null;
let isDragging = false;
let isCtrlPressed = false;
let isCPressed = false;
let currentMousePos = { x: 0, y: 0 }; // Track current mouse position

// Clipboard functionality using PowerShell
const clipboard = {
  readSync: function() {
    try {
      // Windows PowerShell command to read clipboard with proper UTF-8 encoding
      const result = execSync('powershell.exe -command "$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Clipboard"', { 
        encoding: 'utf8',
        windowsHide: true
      });
      return result.trim();
    } catch (error) {
      console.warn('Failed to read clipboard via PowerShell:', error.message);
      return '';
    }
  }
};

// Set up uiohook-napi event listeners
uIOhook.on('keydown', (e) => {
  if (e.keycode === UiohookKey.Ctrl) {
    isCtrlPressed = true;
  }
  if (e.keycode === UiohookKey.C) {
    isCPressed = true;
  }
  
  // Detect Ctrl+C combination when both keys are pressed
  if (isCtrlPressed && isCPressed) {
    console.log('Ctrl+C detected, reading clipboard...');
    setTimeout(() => {
      try {
        const clipboardText = clipboard.readSync();
        console.log('Clipboard content:', clipboardText ? clipboardText.substring(0, 50) + '...' : 'empty');
        
        if (clipboardText && clipboardText.trim().length > 0) {
          const currentTime = Date.now();
          const isSameText = clipboardText.trim() === lastText;
          const timeDiff = currentTime - lastTextTime;
          
          // Allow overlay if it's new text OR same text but more than 1 second ago
          if (!isSameText || timeDiff > 1000) {
            lastText = clipboardText.trim();
            lastTextTime = currentTime;
            console.log('Text selected via Ctrl+C:', lastText.substring(0, 50) + '...');
            
            // Send message to main thread to create overlay
            parentPort.postMessage({
              type: 'text-selected',
              text: lastText,
              method: 'ctrl-c',
              position: { x: currentMousePos.x, y: currentMousePos.y } // 直接使用鼠标位置
            });
          } else {
            console.log('Same text within 1 second, ignoring...');
          }
        }
      } catch (error) {
        console.warn('Error reading clipboard:', error.message);
      }
    }, 100); // Small delay to ensure clipboard is updated
  }
});

uIOhook.on('keyup', (e) => {
  if (e.keycode === UiohookKey.Ctrl) {
    isCtrlPressed = false;
  }
  if (e.keycode === UiohookKey.C) {
    isCPressed = false;
  }
});

uIOhook.on('mousedown', (e) => {
  currentMousePos = { x: e.x, y: e.y }; // Update current mouse position
  if (e.button === 1) { // Left mouse button
    startPoint = { x: e.x, y: e.y };
    isDragging = false;
    console.log('Mouse down at:', e.x, e.y);
  }
});

uIOhook.on('mousemove', (e) => {
  currentMousePos = { x: e.x, y: e.y }; // Update current mouse position
});

uIOhook.on('mousedrag', (e) => {
  currentMousePos = { x: e.x, y: e.y }; // Update current mouse position
  if (startPoint) {
    // Calculate distance to determine if it's actually a drag (supports any direction)
    const distance = Math.sqrt(
      Math.pow(e.x - startPoint.x, 2) + Math.pow(e.y - startPoint.y, 2)
    );
    if (distance > 5) { // Minimum drag distance
      isDragging = true;
      console.log('Dragging detected, distance:', distance);
    }
  }
});

uIOhook.on('mouseup', (e) => {
  currentMousePos = { x: e.x, y: e.y }; // Update current mouse position
  if (e.button === 1 && startPoint && isDragging) { // Left mouse button release after drag
    console.log('Mouse drag completed, checking clipboard...');
    // User has finished dragging (potential text selection)
    setTimeout(() => {
      try {
        const clipboardText = clipboard.readSync();
        console.log('Clipboard content after drag:', clipboardText ? clipboardText.substring(0, 50) + '...' : 'empty');
        
        if (clipboardText && clipboardText.trim().length > 0) {
          const currentTime = Date.now();
          const isSameText = clipboardText.trim() === lastText;
          const timeDiff = currentTime - lastTextTime;
          
          // Allow overlay if it's new text OR same text but more than 1 second ago
          if (!isSameText || timeDiff > 1000) {
            lastText = clipboardText.trim();
            lastTextTime = currentTime;
            console.log('Text selected via mouse drag:', lastText.substring(0, 50) + '...');
            
            // Send message to main thread to create overlay
            parentPort.postMessage({
              type: 'text-selected',
              text: lastText,
              method: 'mouse-drag',
              position: { x: e.x, y: e.y } // 直接使用鼠标释放位置
            });
          } else {
            console.log('Same text within 1 second, ignoring...');
          }
        }
      } catch (error) {
        console.warn('Error reading clipboard after mouse selection:', error.message);
      }
    }, 300); // Longer delay to allow text selection to complete
  }
  
  // Reset drag state
  startPoint = null;
  isDragging = false;
});

// Handle messages from main thread
parentPort.on('message', (message) => {
  if (message.type === 'stop') {
    try {
      uIOhook.stop();
      console.log('uiohook stopped');
    } catch (error) {
      console.warn('Error stopping uiohook:', error.message);
    }
    process.exit(0);
  }
});

// Start the hook
try {
  uIOhook.start();
  console.log('Mouse and keyboard hooks started successfully in worker thread');
  
  // Send ready message to main thread
  parentPort.postMessage({
    type: 'ready',
    message: 'Capture worker started successfully'
  });
} catch (error) {
  console.error('Failed to start uiohook in worker thread:', error);
  
  // Send error message to main thread
  parentPort.postMessage({
    type: 'error',
    message: 'Failed to start uiohook: ' + error.message
  });
}
