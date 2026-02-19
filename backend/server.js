// Application's entry point from server side
require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const socketIO = require('socket.io');
const InMemoryRepository = require("./infrastructure/InMemoryRepository");
const SessionService = require("./application/SessionService");
const WebSocketObserver = require("./infrastructure/WebSocketObserver");
const SocketHandler = require("./presentation/SocketHandler");
const APIController = require("./presentation/APIController");
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

// ① Infrastructure: Repository (no dependencies)
const repository = new InMemoryRepository();

// ② Application: SessionService (depends on Repository)
const sessionService = new SessionService(repository);

// ③ Enable HTTPS if certificates are provided
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

// ④ Socket.IO (depends on HTTP server)
const io = socketIO(server);

// ⑤ Infrastructure: WebSocketObserver (depends on io)
const wsObserver = new WebSocketObserver(io);
sessionService.addObserver(wsObserver);

// ⑥ Presentation: SocketHandler (depends on io + sessionService)
const socketHandler = new SocketHandler(io, sessionService);
socketHandler.initialize();

// ⑦ Presentation: APIController (depends on sessionService only)
const apiController = new APIController(sessionService);
app.use("/api", apiRoutes(apiController));

//Handle all other requests by serving the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});




// Start the server
server.listen(port, host, () => {
  console.log(`Server is running at http://${localIP}:${port}/`);
  global.serverURL = `http://${localIP}:${port}/`;
});
