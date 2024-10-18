// Application's entry point from server side
/*
CommonJS (require):
    主要用于 Node.js 环境。
    语法：const module = require('module');
    特点：同步加载模块，适用于服务器端。
ES6 Modules (import):
    主要用于现代浏览器和支持 ES6 模块的环境。
    语法：import module from 'module';
    特点：支持静态分析和优化，适用于客户端和现代 JavaScript 环境。

Can specify the type in package.json.
*/

const express = require("express");
const http = require("http");
const path = require("path");
const APIController = require("./controllers/apiController");
const SessionManager = require("./models/sessionManager");
const WebSocketServer = require("./services/webSocketServer");
const apiRoutes = require("./routes/apiRoutes");

// Initialize an Express application
const app = express();
// Create an HTTP server to handle requests using the Express app
const server = http.createServer(app);
// Set the port number for the server to listen on
const port = process.env.PORT || 3000;

// Middleware to parse JSON data in requests
app.use(express.json());
// Middleware to provide access to the public directory(provide all static files in the public directory, such as images, CSS, and JavaScript files)
// Also set "../frontend" as the root directory for URL requests
app.use(express.static(path.join(__dirname, "../frontend")));


// Initialization
const sessionManager = new SessionManager();
const webSocketServer = new WebSocketServer(sessionManager);
const apiController = new APIController(sessionManager, webSocketServer);

// Set up API routes
app.use("/api", apiRoutes(apiController));

//Handle all other requests by serving the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Start the WebSocket server
webSocketServer.initialize(server);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
