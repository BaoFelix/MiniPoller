const generateUniqueId = require("../utils/utilities").generateUniqueId;
const PollRuleFactory = require('./rules/PollRuleFactory');

class Poll {
  constructor(pollData, rule = null) {
    if (!pollData || !pollData.taskDescription || !pollData.options || !Array.isArray(pollData.options) || pollData.options.length === 0) {
      throw new Error("Invalid poll data. Ensure taskDescription and options are provided.");
    }
    
    this.pollId = generateUniqueId();
    this.isActive = true;
    this.taskDescription = pollData.taskDescription;
    this.options = pollData.options;
    this.displayStyle = pollData.displayStyle;
    this.ruleType = pollData.ruleType || 'single';
    this.voteCounts = new Map();
    this.votes = new Map();
    this.rule = rule || PollRuleFactory.create(this.ruleType);

    this.options.forEach((option) => {
      this.voteCounts.set(option, 0);
    });
  }

  addVote(option, userId) {
    const voteData = { option };
    this.rule.validate(this, userId, voteData);
    this.rule.apply(this, userId, voteData);
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
      ruleType: this.ruleType,
    };
  }
}

module.exports = Poll;
