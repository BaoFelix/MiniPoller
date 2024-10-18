const Poll = require('./poll');

class SessionManager {
    constructor(){
        this.polls = new Map();
        this.ownerTokens = new Map();
    }

    createPoll(pollData){
        const poll = new Poll(pollData);
        this.polls.set(poll.pollId, poll);

        console.log(poll);
        return poll;
    }

    getPoll(pollId){
        return this.polls.get(pollId);
    }

    endPoll(pollId){
        const poll = this.polls.get(pollId);
        if(poll){
            poll.endPoll();
        }
        else{
            throw new Error(`Poll with ID ${pollId} not found`);
        }
    }

    setOwnerToken(pollId, ownerToken) {
        this.ownerTokens.set(pollId, ownerToken);
    }

    verifyOwnerToken(pollId, ownerToken) {
        return this.ownerTokens.get(pollId) === ownerToken;
    }
}

module.exports = SessionManager;