const IPollRule = require('./IPollRule');

class SingleChoiceRule extends IPollRule {
    validate(poll, userId, voteData) {
        if (!poll.isActive) {
            throw new Error("Poll has ended");
        }
        if (!poll.options.includes(voteData.option)) {
            throw new Error("Invalid voting option");
        }
        if (poll.votes.has(userId)) {
            throw new Error("User has already voted");
        }
    }
    apply(poll, userId, voteData) {
        poll.votes.set(userId, voteData.option);
        poll.voteCounts.set(voteData.option, poll.voteCounts.get(voteData.option) + 1);
    }
}
module.exports = SingleChoiceRule;
