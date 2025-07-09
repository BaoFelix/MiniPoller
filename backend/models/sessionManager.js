const Poll = require('./poll');

class SessionManager {
    constructor(){
        this.polls = new Map();
        this.ownerTokens = new Map();
    }

    createPoll(pollData){
        const poll = new Poll(pollData);
        this.polls.set(poll.pollId, poll);

        console.log('✅ Poll created:', poll.pollId);
        console.log('📊 Total active polls:', this.polls.size);
        console.log('📝 All poll IDs:', Array.from(this.polls.keys()));
        return poll;
    }

    getPoll(pollId){
        console.log('🔍 Trying to get poll:', pollId);
        console.log('📋 Available polls:', Array.from(this.polls.keys()));
        console.log('📊 Total polls in memory:', this.polls.size);
        
        if (!this.polls.has(pollId)) {
            console.error('❌ Poll not found:', pollId);
            console.error('📋 Available polls:', Array.from(this.polls.keys()));
            throw new Error(`Poll with ID ${pollId} not found`);
        }
        
        console.log('✅ Poll found and returned:', pollId);
        return this.polls.get(pollId);
    }

    // Add method to check if poll exists without throwing
    pollExists(pollId) {
        return this.polls.has(pollId);
    }

    endPoll(pollId){
        const poll = this.polls.get(pollId);
        if(poll){
            poll.endPoll();
            this.polls.delete(pollId);
            this.ownerTokens.delete(pollId);
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