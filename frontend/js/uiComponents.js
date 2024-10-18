// Manges the UI components of the application

class UIComponents {
  constructor(apiService, socketManager) {
    this.apiService = apiService;
    this.socketManager = socketManager;
    this.pollCreationForm = new PollCreationForm(apiService);
    this.ownerInterface = new OwnerInterface(apiService, socketManager);
    this.votingInterface = new VotingInterface(apiService, socketManager);
    this.appElement = document.getElementById("app");
  }

  showPollCreationForm() {
    this.clearAppElement();
    this.pollCreationForm.render(this.appElement);
  }

  showOwnerInterface() {
    this.clearAppElement();
    this.ownerInterface.render(this.appElement);
  }

  showVotingInterface() {
    this.clearAppElement();
    this.votingInterface.render(this.appElement);
  }

  handlePollEnded() {
    this.votingInterface.disableVoting();
    this.votingInterface.resultsDisplay.showFinalResults();
  }

  clearAppElement() {
    this.appElement.innerHTML = "";
  }
}
