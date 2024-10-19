class VotingInterface {
  constructor(apiService, socketManager) {
    this.apiService = apiService; // Store the API service instance
    this.socketManager = socketManager; // Store the Socket.IO manager instance
    this.pollData = null; // Will hold the poll data once loaded
    this.container = document.createElement("div"); // Create a container div for the voting interface
    this.voteButtons = []; // Array to store the vote buttons
    this.userId = null; // Will be set when needed, to identify the user
    this.resultsChart = null; // Used to store the Chart.js instance
    this.chartContainer = null; // Used to store the chart container
    this.isOwner = false; // Flag to determine if the user is the poll owner
  }

  render(container) {
    // Set initial loading message
    this.container.innerHTML = "<h2>Loading poll...</h2>";
    // Append the container to the provided parent container
    container.appendChild(this.container);
  }

  async renderPoll(pollId, ownerToken = null) {
    this.pollId = pollId;
    this.ownerToken = ownerToken;
    this.userId = this.generateUserId(); // Generate user ID

    // Determine if the current user is the owner
    this.isOwner = ownerToken !== null;

    try {
      // Fetch poll data from the API
      this.pollData = await this.apiService.getPoll(pollId);
      // Display the poll once data is fetched
      this.displayPoll();

      // Initialize the chart
      this.initializeChart();

      // Listen for vote updates
      this.socketManager.on("voteUpdate", (results) => {
        this.updateChartData(results);
      });

      // If the poll is active, allow voting
      if (!this.pollData.isEnded) {
        this.enableVoting();
      } else {
        this.disableVoting();
      }
    } catch (error) {
      // Display error message if poll data cannot be loaded
      this.container.innerHTML = `<p>Error loading poll: ${error.message}</p>`;
    }
  }

  displayPoll() {
    const { taskDescription, options } = this.pollData; // Destructure poll data

    // Set the inner HTML of the container to display the poll question and options
    this.container.innerHTML = `
      <h2>${taskDescription}</h2>
      <div id="options-container"></div>
      <div id="chart-container">
        <canvas id="resultsChart"></canvas>
      </div>
      <br>
      <br>
      <br>
      <br>
      ${
        this.isOwner
          ? `
        <div id="share-link-container">
          <p>Share this link to invite others to vote:
            <input type="text" id="poll-share-link" value="${this.getPollShareLink()}" readonly />
            <button id="copy-link-button">Copy Link</button>
          </p>
        </div>
      `
          : ""
      }
      ${this.isOwner ? '<button id="end-poll-button">End Poll</button>' : ""}
    `;

    const optionsContainer = this.container.querySelector("#options-container"); // Get the options container div

    options.forEach((option) => {
      const button = document.createElement("button"); // Create a button for each option
      button.textContent = option; // Set the button text to the option
      button.addEventListener("click", () => this.castVote(option)); // Add click event listener to cast vote
      optionsContainer.appendChild(button); // Append the button to the options container
      this.voteButtons.push(button); // Store the button in the voteButtons array
    });

    // If the user is the owner, add event listener to the end poll button
    if (this.isOwner) {
      const endPollButton = this.container.querySelector("#end-poll-button");
      endPollButton.addEventListener("click", () => this.handleEndPoll());
      
      const copyLinkButton = this.container.querySelector("#copy-link-button");
      copyLinkButton.addEventListener("click", () => this.copyPollLink());
    }
  }

  initializeChart() {
    // Get the chart container
    this.chartContainer = this.container.querySelector("#chart-container");
    if (!this.chartContainer) {
      console.error("Chart container not found");
      return;
    }

    // Adjust chart container and canvas styles
    this.chartContainer.style.width = "25%"; // Chart container occupies 25% of the page width

    const canvas = this.container.querySelector("#resultsChart");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    canvas.style.width = "100%"; // Canvas occupies full container width
    canvas.style.height = "auto"; // Height adjusts automatically

    const ctx = canvas.getContext("2d");
    this.resultsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Vote Results",
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false, // Allow the chart to adjust aspect ratio
        scales: {
          x: {
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 12, // Adjust legend font size for readability
              },
            },
          },
        },
      },
    });
  }

  updateChartData(results) {
    if (!results.voteCounts) {
      console.error("voteCounts not found in results");
      return;
    }

    const voteCounts = results.voteCounts;
    const labels = Object.keys(voteCounts);
    const data = Object.values(voteCounts);
    const backgroundColors = [
      "#ff6384",
      "#36a2eb",
      "#ffce56",
      "#4bc0c0",
      "#9966ff",
      "#ff9f40",
    ];

    this.resultsChart.data.labels = labels;
    this.resultsChart.data.datasets[0].data = data;
    this.resultsChart.data.datasets[0].backgroundColor = backgroundColors.slice(
      0,
      data.length
    );
    this.resultsChart.update();
  }

  castVote(option) {
    // Emit a vote event with the poll ID, selected option, and user ID
    this.socketManager.emit("vote", {
      pollId: this.pollData.pollId,
      option: option,
      userId: this.userId,
    });
    this.disableVoting(); // Disable voting after casting a vote
  }

  enableVoting() {
    // Enable all vote buttons
    this.voteButtons.forEach((button) => {
      button.disabled = false;
    });
  }

  disableVoting() {
    // Disable all vote buttons
    this.voteButtons.forEach((button) => {
      button.disabled = true;
    });
  }

  getPollShareLink() {
    const { protocol, host } = window.location;
    return `${protocol}//${host}/poll/${this.pollId}`;
  }

  async copyPollLink() {
    const pollLink = this.getPollShareLink();
  
    try {
      await navigator.clipboard.writeText(pollLink);
      alert("Link copied to clipboard!");
    } catch (err) {
      alert("Failed to copy the link. Please copy it manually.");
    }
  }

  async handleEndPoll() {
    if (!this.pollId || !this.ownerToken) {
      alert("Missing necessary parameters.");
      return;
    }

    try {
      // Call the API to end the poll
      const response = await this.apiService.endPoll(
        this.pollId,
        this.ownerToken
      );
      // Notify all clients that the poll has ended
      this.socketManager.emit("pollEnded", { pollId: this.pollId });
    } catch (error) {
      alert("Error ending poll: " + error.message);
    }
  }

  removeVotingElements() {
    const optionsContainer = this.container.querySelector("#options-container");
    if (optionsContainer) {
      optionsContainer.remove();
    }

    const shareLinkContainer = this.container.querySelector("#share-link-container");
    if (shareLinkContainer) {
      shareLinkContainer.remove();
    }

    const endPollButton = this.container.querySelector("#end-poll-button");
    if (endPollButton) {
      endPollButton.remove();
    }
  }

  displayPollEndedMessage() {
    const message = document.createElement("h3");
    message.textContent = "The Final Result：";
    message.style.textAlign = "center";
    message.style.marginTop = "20px";
    this.container.insertBefore(message, this.chartContainer);
  }

  centerPollTitle() {
    const pollTitle = this.container.querySelector("h2");
    if (pollTitle) {
      pollTitle.style.textAlign = "center";
      pollTitle.style.marginTop = "30px";
    }
  }

  animateChartDisplay() {
    this.chartContainer.style.width = "50%";
    this.chartContainer.style.margin = "20px auto";

    this.resultsChart.options.animation = {
      duration: 1000, //
      easing: "easeOutBounce",
    };
    this.resultsChart.update();
  }

  generateUserId() {
    return "user_" + Math.random().toString(36).substr(2, 9);
  }
}
