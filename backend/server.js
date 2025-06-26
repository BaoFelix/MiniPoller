// Application's entry point from server side
require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const APIController = require("./controllers/apiController");
const SessionManager = require("./models/sessionManager");
const WebSocketServer = require("./services/webSocketServer");
const apiRoutes = require("./routes/apiRoutes");
const getLocalIPAddress = require("./utils/utilities").getLocalIPAddress;
const { spawn } = require("child_process");

// Hold reference to the capture helper so we can manage its lifecycle
let captureProcess;
let shuttingDown = false;

/**
 * Start the Windows capture helper if available. The spawned process is stored
 * globally so it can be restarted or terminated when the server exits.
 */
function startCaptureProcess() {
  const captureExe = path.join(__dirname, "../windows_capture/OverlayPoller.exe");
  if (!fs.existsSync(captureExe)) {
    console.log(`Capture executable not found at ${captureExe}`);
    return;
  }

  captureProcess = spawn(captureExe, [], { detached: true });
  captureProcess.unref();
  console.log(`Started text capture module`);

  captureProcess.stdout.on("data", (data) => {
    console.log(`[capture] ${data.toString().trim()}`);
  });

  captureProcess.stderr.on("data", (data) => {
    console.error(`[capture] ${data.toString().trim()}`);
  });

  // Restart the helper if it exits or errors
  captureProcess.on("exit", () => {
    if (!shuttingDown) {
      console.log("Capture helper exited; restarting...");
      startCaptureProcess();
    }
  });

  captureProcess.on("error", (err) => {
    if (!shuttingDown) {
      console.error(`Capture helper error: ${err}`);
      startCaptureProcess();
    }
  });
}



// Initialize an Express app to handle routing,  middleware and requests.
const app = express();

// Set the port number for the server to listen on
const port = process.env.PORT || 3000;
// Set the scope of the server to serve requests from any IP address
const host = process.env.HOST || "0.0.0.0";
const localIP = getLocalIPAddress();

// Launch the Windows text capture helper on Windows platforms
if (process.platform === "win32") {
  startCaptureProcess();

  const terminateHelper = () => {
    if (captureProcess) {
      shuttingDown = true;
      captureProcess.kill();
    }
  };

  process.on("exit", terminateHelper);
  ["SIGINT", "SIGTERM"].forEach((sig) =>
    process.on(sig, () => {
      terminateHelper();
      process.exit();
    })
  );
}


// Middleware to parse JSON data in requests
app.use(express.json());
// Middleware to provide access to the public directory(provide all static files in the public directory, such as images, CSS, and JavaScript files)
// Also set "../frontend" as the root directory for URL requests
app.use(express.static(path.join(__dirname, "../frontend"),{ maxAge: "7d" }));

const sessionManager = new SessionManager();
const webSocketServer = new WebSocketServer(sessionManager);
const apiController = new APIController(sessionManager, webSocketServer);

app.use("/api", apiRoutes(apiController));

//Handle all other requests by serving the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});




// Enable HTTPS if certificates are provided
let server;
if (process.env.HTTPS_ENABLED === "true") {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  server = https.createServer(httpsOptions, app);
  console.log(`Using HTTPS`);
} else {
  server = http.createServer(app);
  console.log(`Using HTTP`);
}

// Start the WebSocket server by sharing the HTTP server instance, so that it can listen for WebSocket connections
webSocketServer.initialize(server);




// Start the server
server.listen(port, host, () => {
  console.log(`Server is running at http://${localIP}:${port}/`);

  global.serverURL = `http://${localIP}:${port}/`;
});
