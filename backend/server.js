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

// Initialize an Express app to handle routing, middleware and requests.
const app = express();

// Set the port number for the server to listen on
const port = process.env.PORT || 3000;
// Set the scope of the server to serve requests from any IP address
const host = process.env.HOST || "0.0.0.0";
const localIP = getLocalIPAddress();


// Middleware to parse JSON data in requests with UTF-8 support
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Middleware to provide access to the public directory(provide all static files in the public directory, such as images, CSS, and JavaScript files)
// Also set "../frontend" as the root directory for URL requests
app.use(express.static(path.join(__dirname, "../frontend"), { 
  maxAge: 0, // Disable caching for development
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    // Set aggressive no-cache headers for all static files
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

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
