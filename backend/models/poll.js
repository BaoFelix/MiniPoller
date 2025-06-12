const generateUniqueId = require("../utils/utilities").generateUniqueId;

class Poll {
  constructor(pollData) {
    if (!pollData || !pollData.taskDescription || !pollData.options || !Array.isArray(pollData.options) || pollData.options.length === 0) {
      throw new Error("Invalid poll data. Ensure taskDescription and options are provided.");
    }
    
    this.pollId = generateUniqueId();
    this.isActive = true;
    this.taskDescription = pollData.taskDescription;
    this.options = pollData.options;
    this.displayStyle = pollData.displayStyle;
    this.voteCounts = new Map();
    this.votes = new Map();

    this.options.forEach((option) => {
      this.voteCounts.set(option, 0);
    });
  }

  addVote(option, userId) {
    if (!this.isActive) {
      throw new Error("Poll has ended");
    }
    if (!this.options.includes(option)) {
      throw new Error("Invalid voting option");
    }
    if (this.votes.has(userId)) {
      throw new Error("User has already voted");
    }

    this.votes.set(userId, option);
    this.voteCounts.set(option, this.voteCounts.get(option) + 1);
  }

  getResults() {
    const voteCountsObj = {};
    this.voteCounts.forEach((count,option) => {
      voteCountsObj[option] = count;
    });

    let votes = null;
    if (this.displayStyle === "public") {
      votes = {};

      this.votes.forEach((option, userId) => {
        votes[userId] = option;
      });
    }

    return {
      pollId: this.pollId,
      voteCounts: voteCountsObj,
      votes: votes,
      isActive: this.isActive,
    };
  }

  endPoll() {
    this.isActive = false;
  }

  getDetails() {
    return {
      pollId: this.pollId,
      taskDescription: this.taskDescription,
      options: this.options,
      displayStyle: this.displayStyle,
      isActive: this.isActive,
    };
  }
}

module.exports = Poll;
