// Main JS file that initializes the app
/*浏览器加载网页的流程
DNS 解析：

用户在浏览器地址栏中输入 URL（例如 http://example.com/index.html）。
浏览器通过 DNS 解析将域名转换为服务器的 IP 地址。
发送 HTTP 请求：

浏览器向服务器发送 HTTP 请求，要求获取 index.html 文件。
服务器响应：

服务器接收到请求后，返回 index.html 文件作为响应。
解析 HTML：

浏览器接收到 index.html 文件后，开始解析 HTML 内容。
在解析过程中，浏览器会遇到各种标签（如 <head>、<body>、<script> 等），并根据这些标签加载相应的资源。
加载和执行 JavaScript 文件：

当浏览器遇到 <script> 标签时，会根据 src 属性下载指定的 JavaScript 文件（如 js/apiService.js）。
浏览器下载文件后，会解析并执行其中的 JavaScript 代码。
构建 DOM 树：

浏览器解析 HTML 文件并构建 DOM 树（Document Object Model）。
DOM 树表示 HTML 文档的结构，包含所有的元素和属性。
构建 CSSOM 树：

浏览器解析 CSS 文件并构建 CSSOM 树（CSS Object Model）。
CSSOM 树表示样式信息，包含所有的样式规则。
合并 DOM 树和 CSSOM 树：

浏览器将 DOM 树和 CSSOM 树合并，生成渲染树。
渲染树包含每个可见元素的布局和样式信息。
布局和绘制：

浏览器根据渲染树计算每个元素的布局（位置和大小）。
浏览器将元素绘制到屏幕上，完成页面的渲染。*/

// Since all components are imported in the index.html file, we don't need to import them here
// import ApiService from './apiService.js';
// import SocketManager from './socketManager.js';
// import UIComponents from './uiComponents.js';

class ClientApp {
  constructor() {
    this.apiService = new ApiService();
    this.socketManager = new SocketManager();
    this.uiComponents = new UIComponents(this.apiService, this.socketManager);
    this.pollId = null;
    this.ownerToken = null;
    this.userId = this.generateUserID();

    this.uiComponents.votingInterface.userId = this.userId;
  }

  initialize() {
    // Get the poll ID and owner token from the URL
    const pollId = this.extractPollIdFormUrl();
    const urlParams = new URLSearchParams(window.location.search);
    const ownerToken = urlParams.get('ownerToken');

    const appContainer = document.getElementById('app');

    // Show the appropriate UI components based on the presence of a poll ID
    if (pollId === null) 
    {
      this.uiComponents.showPollCreationForm();
    } 
    else 
    {
      // Poll ID exists, proceed to voting interface
      this.pollId = pollId;
      this.ownerToken = ownerToken;

      // Connect to the socket with the poll ID
      this.socketManager.connect(pollId);

      // Render the voting interface
      this.uiComponents.votingInterface.render(appContainer);
      // Pass the ownerToken if available
      this.uiComponents.votingInterface.renderPoll(this.pollId, this.ownerToken);

      // Listen for vote updates
      this.socketManager.on("voteUpdate", (results) => {
        this.uiComponents.votingInterface.updateChartData(results);
      });

      // Listen for poll ended event
      this.socketManager.on("pollEnded", () => {
        this.uiComponents.handlePollEnded();
      });
    }
  }

  extractPollIdFormUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/poll\/(.+)/);
    return match ? match[1] : null;
  }

  generateUserID() {
    return "user_" + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize the app, when the DOM is ready(document is a global object that represents the HTML document)
// DOMContentLoaded event is fired when the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading
document.addEventListener("DOMContentLoaded", function () {
  // if need to access the app obj globally, then you can use "window.app = new ClientApp();"
  const app = new ClientApp();
  app.initialize();
});
