// Main JS file that initializes the app
/*
Browser webpage loading process:

DNS Resolution:
- User enters URL in browser address bar (e.g., http://example.com/index.html)
- Browser converts domain name to server IP address through DNS resolution

HTTP Request:
- Browser sends HTTP request to server requesting index.html file
- Server receives request and returns index.html file as response

HTML Parsing:
- Browser receives index.html file and begins parsing HTML content
- During parsing, browser encounters various tags (<head>, <body>, <script>, etc.) and loads corresponding resources

JavaScript File Loading and Execution:
- When browser encounters <script> tags, it downloads specified JavaScript files (e.g., js/apiService.js)
- Browser parses and executes JavaScript code after downloading

DOM Tree Construction:
- Browser parses HTML file and constructs DOM tree (Document Object Model)
- DOM tree represents HTML document structure, including all elements and attributes

CSSOM Tree Construction:
- Browser parses CSS files and constructs CSSOM tree (CSS Object Model)
- CSSOM tree represents style information, including all style rules

Merge DOM and CSSOM Trees:
- Browser merges DOM tree and CSSOM tree to generate render tree
- Render tree contains layout and style information for each visible element

Layout and Rendering:
- Browser calculates layout (position and size) for each element based on render tree
- Browser renders elements to screen, completing page rendering
*/

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
    // Generate a unique ID for this client
    this.userId = generateUserId();

    this.uiComponents.votingInterface.userId = this.userId;
  }

  initialize() {
    // Get the poll ID and owner token from the URL
    const pollId = this.extractPollIdFromUrl();
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

  extractPollIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/poll\/(.+)/);
    return match ? match[1] : null;
  }
}

// Initialize the app, when the DOM is ready(document is a global object that represents the HTML document)
// DOMContentLoaded event is fired when the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading
document.addEventListener("DOMContentLoaded", function () {
  // if need to access the app obj globally, then you can use "window.app = new ClientApp();"
  const app = new ClientApp();
  app.initialize();
});
