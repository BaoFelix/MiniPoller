// Manages the UI components of the application

class UIComponents {
  constructor(apiService, socketManager) {
    this.apiService = apiService;
    this.socketManager = socketManager;
    this.pollCreationForm = new PollCreationForm(apiService);
    this.votingInterface = new VotingInterface(apiService, socketManager);
    this.appElement = document.getElementById("app");
  }

  showPollCreationForm() {
    this.clearAppElement();
    this.pollCreationForm.render(this.appElement);
  }

  showVotingInterface() {
    this.clearAppElement();
    this.votingInterface.render(this.appElement);
  }

  handlePollEnded() {
    this.votingInterface.removeVotingElements();
    this.votingInterface.centerPollTitle();
    this.votingInterface.displayPollEndedMessage();
    this.votingInterface.animateChartDisplay();
  }

  clearAppElement() {
    this.appElement.innerHTML = "";
  }
}
