const Poll = require('../domain/Poll');
const PollRuleFactory = require('../domain/rules/PollRuleFactory');

class SessionService {
    constructor(repository) {
        this.repository = repository;
        this.observers = [];
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyVoteUpdate(pollId, results) {
        this.observers.forEach(observer => {
            try {
                observer.onVoteUpdate(pollId, results);
            } catch (error) {
                console.error('Error notifying observer of vote update:', error.message);
            }
        });
    }

    notifyPollEnded(pollId, finalResults) {
        this.observers.forEach(observer => {
            try {
                observer.onPollEnded(pollId, finalResults);
            } catch (error) {
                console.error('Error notifying observer of poll end:', error.message);
            }
        });
    }

    createSession(pollData) {
        const rule = PollRuleFactory.create(pollData.ruleType || 'single');
        const poll = new Poll(pollData, rule);
        this.repository.save(poll);
        console.log('✅ Poll created:', poll.pollId);
        return poll;
    }

    getSession(pollId) {
        console.log('🔍 Trying to get poll:', pollId);
        return this.repository.findById(pollId);
    }

    vote(pollId, userId, voteData) {
        const poll = this.repository.findById(pollId);
        if (!poll) {
            throw new Error(`Poll with ID ${pollId} not found`);
        }
        poll.addVote(voteData.option, userId);
        const results = poll.getResults();
        this.notifyVoteUpdate(pollId, results);
        return results;
    }

    endSession(pollId) {
        const poll = this.repository.findById(pollId);
        if (!poll) {
            throw new Error(`Poll with ID ${pollId} not found`);
        }
        poll.endPoll();
        const finalResults = poll.getResults();
        this.notifyPollEnded(pollId, finalResults);
        this.repository.delete(pollId);
        return finalResults;
    }

    setOwnerToken(pollId, ownerToken) {
        this.repository.setOwnerToken(pollId, ownerToken);
    }

    verifyOwnerToken(pollId, ownerToken) {
        return this.repository.verifyOwnerToken(pollId, ownerToken);
    }
}

module.exports = SessionService;
