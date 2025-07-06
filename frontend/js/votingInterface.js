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

    this.pollSharedLink = null;
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
    // Generate a unique identifier for this participant
    this.userId = generateUserId();

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

      // Enable or disable voting based on poll status
      if (this.pollData.isActive) {
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
    const { taskDescription, options} = this.pollData; // Destructure poll data
    const url = `${window.location.protocol}//${window.location.host}`;
    this.pollSharedLink  = this.getPollShareLink(url);
    
    // Detect if running in Electron
    const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

    // Set the inner HTML of the container to display the poll question and options
    this.container.innerHTML = `
      <h2 style="text-align: center; margin-bottom: 25px; color: #343a40; font-size: ${isElectron ? '1.6rem' : '1.8rem'};">${taskDescription}</h2>
      <div id="options-container"></div>
      <div id="chart-container">
        <canvas id="resultsChart"></canvas>
      </div>
      ${
        this.isOwner
          ? `
        <div id="share-link-container" style="margin-top: ${isElectron ? '5px' : '15px'};">
            <p style="font-size: ${isElectron ? '9px' : '12px'}; margin-bottom: ${isElectron ? '2px' : '6px'}; color: #6c757d;">Share:</p>
            <div style="display: flex; align-items: center; gap: ${isElectron ? '3px' : '6px'}; justify-content: center;">
              <input type="text" id="poll-share-link" value="${this.pollSharedLink}" readonly 
                     style="flex: 1; max-width: ${isElectron ? '180px' : '300px'}; padding: ${isElectron ? '2px 4px' : '4px 6px'}; font-size: ${isElectron ? '8px' : '11px'}; border: 1px solid #ced4da; border-radius: 2px; background-color: #f8f9fa;" />
              <button id="copy-link-button" style="padding: ${isElectron ? '2px 4px' : '4px 8px'}; font-size: ${isElectron ? '8px' : '11px'}; background-color: #007bff; color: white; border: none; border-radius: 2px; cursor: pointer;">Copy</button>
            </div>
        </div>
      `
          : ""
      }
      ${this.isOwner ? `<div style="text-align: center; margin-top: ${isElectron ? '8px' : '20px'};"><button id="end-poll-button" style="padding: ${isElectron ? '6px 12px' : '12px 24px'}; font-size: ${isElectron ? '12px' : '16px'};">End Poll</button></div>` : ""}
    `;

    const optionsContainer = this.container.querySelector("#options-container"); // Get the options container div

    options.forEach((option) => {
      const button = document.createElement("button"); // Create a button for each option
      button.textContent = option; // Set the button text to the option
      button.addEventListener("click", () => this.castVote(option)); // Add click event listener to cast vote
      
      // Style the button differently for Electron
      if (isElectron) {
        button.style.padding = "8px 16px";
        button.style.fontSize = "13px";
        button.style.minWidth = "80px";
        button.style.margin = "4px";
      }
      
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

    // Detect if running in Electron
    const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

    // Adjust chart container and canvas styles for better visualization
    this.chartContainer.style.width = isElectron ? "95%" : "85%"; // Much larger in Electron
    this.chartContainer.style.height = isElectron ? "600px" : "450px"; // Much taller in Electron
    this.chartContainer.style.margin = isElectron ? "5px auto" : "15px auto"; // Minimal margins in Electron
    this.chartContainer.style.backgroundColor = "#f8f9fa"; // Light background
    this.chartContainer.style.padding = isElectron ? "35px" : "25px";
    this.chartContainer.style.borderRadius = "8px";
    this.chartContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";

    const canvas = this.container.querySelector("#resultsChart");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    canvas.style.width = "100%"; // Canvas occupies full container width
    canvas.style.height = isElectron ? "530px" : "400px"; // Much taller in Electron

    const ctx = canvas.getContext("2d");
    this.resultsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Votes",
            data: [],
            backgroundColor: [
              "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
              "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"
            ],
            borderColor: [
              "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
              "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"
            ],
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 14,
              },
              color: '#495057'
            },
            grid: {
              color: '#e9ecef'
            }
          },
          y: {
            ticks: {
              font: {
                size: 14,
              },
              color: '#495057'
            },
            grid: {
              color: '#e9ecef'
            }
          }
        },
        plugins: {
          legend: {
            display: false, // Hide legend for cleaner look
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#fff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `${context.parsed.x} votes`;
              }
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        }
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
    
    // Professional color palette for poll results
    const backgroundColors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
      "#9966FF", "#FF9F40", "#FF8A80", "#C5E1A5",
      "#FFAB91", "#CE93D8", "#90CAF9", "#A5D6A7"
    ];

    this.resultsChart.data.labels = labels;
    this.resultsChart.data.datasets[0].data = data;
    this.resultsChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, data.length);
    this.resultsChart.data.datasets[0].borderColor = backgroundColors.slice(0, data.length);
    this.resultsChart.update('none'); // Update without animation for real-time updates
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

  getPollShareLink(serverURL) {
    return `${serverURL}/poll/${this.pollId}`;
  }

  async copyPollLink() {
    try {
      if(navigator.clipboard)
      {
        await navigator.clipboard.writeText(`${this.pollSharedLink}`);
        alert("Link copied to clipboard!");
      }
      else{
        const textArea = document.createElement("textarea");
        textArea.value = this.pollSharedLink;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert("Link copied to clipboard!");
        } catch (err) {
          console.error('Failed to copy the link:', err);
          alert("Failed to copy the link. Please copy it manually.");
        }
        document.body.removeChild(textArea);
        return;
      }
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
    message.textContent = "Final Results:";
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
    // Expand chart for final results view
    this.chartContainer.style.width = "80%";
    this.chartContainer.style.height = "450px";
    this.chartContainer.style.margin = "30px auto";
    this.chartContainer.style.backgroundColor = "#ffffff";
    this.chartContainer.style.border = "2px solid #e9ecef";

    // Update chart with enhanced animation
    this.resultsChart.options.animation = {
      duration: 1200,
      easing: "easeOutBounce",
    };
    
    // Add final results styling
    this.resultsChart.options.plugins.legend = {
      display: true,
      position: 'top',
      labels: {
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#495057',
        usePointStyle: true,
        pointStyle: 'rectRounded'
      }
    };
    
    this.resultsChart.update();
  }

}
