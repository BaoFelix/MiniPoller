// Displaying voting interface and handling voting events

class OwnerInterface {
  constructor(apiService, socketManager) {
    this.apiService = apiService; // Store the API service instance
    this.socketManager = socketManager; // Store the Socket.IO manager instance
    this.pollData = null; // Will hold the poll data once loaded
    this.container = document.createElement("div"); // Create a container div for the voting interface
    this.voteButtons = []; // Array to store the vote buttons
    this.endPollButton = null;
    this.userId = null; // Will be set when needed, to identify the user
    this.resultsDisplay = null; // Will hold the results display component
  }

  render(container) {
    // Set initial loading message
    this.container.innerHTML = "<h2>Loading poll...</h2>";
    // Append the container to the provided parent container
    container.appendChild(this.container);
  }

  async renderPoll(pollId, ownerToken) {
    this.pollId = pollId;
    this.ownerToken = ownerToken;

    try {
      // Fetch poll data from the API
      this.pollData = await this.apiService.getPoll(pollId);
      // Display the poll once data is fetched
      this.displayPoll();
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
          <div id="results-container"></div>
          <button id="end-poll-button">End Poll</button>
        `;

    const optionsContainer = this.container.querySelector("#options-container"); // Get the options container div

    options.forEach((option) => {
      const button = document.createElement("button"); // Create a button for each option
      button.textContent = option; // Set the button text to the option
      button.addEventListener("click", () => this.castVote(option)); // Add click event listener to cast vote
      optionsContainer.appendChild(button); // Append the button to the options container
      this.voteButtons.push(button); // Store the button in the voteButtons array
    });

    // Initialize results display
    this.resultsDisplay = new ResultsDisplay();
    this.resultsDisplay.render(
      this.container.querySelector("#results-container")
    ); // Render the results display in the results container

    // Add event listener to end poll button
    const endPollButton = this.container.querySelector("#end-poll-button");
    endPollButton.addEventListener("click", () => this.handleEndPoll());
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

  disableVoting() {
    // Disable all vote buttons to prevent multiple votes
    this.voteButtons.forEach((button) => {
      button.disabled = true;
    });
  }

  //End poll by using poll id and owner token emitted to the server via socketManager
  async handleEndPoll() {
    if (!this.pollId || !this.ownerToken) {
      alert("缺少必要的参数");
      return;
    }

    try {
      // 调用 API 结束投票
      const response = await this.apiService.endPoll(
        this.pollId,
        this.ownerToken
      );
      alert(response.message);
      // 重定向到投票页面（不再是所有者界面）
      console.log(`/poll/${this.pollId}`);
      window.location.href = `/poll/${this.pollId}`;
    } catch (error) {
      alert("结束投票时出错: " + error.message);
    }
  }
}
