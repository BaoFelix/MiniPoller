const ISessionRepository = require('../domain/ISessionRepository');

class InMemoryRepository extends ISessionRepository {
    constructor() {
        super();
        this.polls = new Map();
        this.ownerTokens = new Map();
    }

    save(poll) {
        this.polls.set(poll.pollId, poll);
        console.log('💾 Poll saved to repository:', poll.pollId);
        console.log('📊 Total polls in repository:', this.polls.size);
        console.log('📝 All poll IDs:', Array.from(this.polls.keys()));
    }

    findById(pollId) {
        console.log('🔍 Repository finding poll:', pollId);
        console.log('📋 Available polls:', Array.from(this.polls.keys()));
        console.log('📊 Total polls in memory:', this.polls.size);
        
        if (!this.polls.has(pollId)) {
            console.error('❌ Poll not found in repository:', pollId);
            console.error('📋 Available polls:', Array.from(this.polls.keys()));
            throw new Error(`Poll with ID ${pollId} not found`);
        }
        
        console.log('✅ Poll found and returned from repository:', pollId);
        return this.polls.get(pollId);
    }

    exists(pollId) {
        return this.polls.has(pollId);
    }

    delete(pollId) {
        console.log('🗑️ Deleting poll from repository:', pollId);
        this.polls.delete(pollId);
        this.ownerTokens.delete(pollId);
        console.log('📊 Total polls remaining:', this.polls.size);
    }

    setOwnerToken(pollId, ownerToken) {
        this.ownerTokens.set(pollId, ownerToken);
        console.log('🔑 Owner token set for poll:', pollId);
    }

    verifyOwnerToken(pollId, ownerToken) {
        const verified = this.ownerTokens.get(pollId) === ownerToken;
        console.log('🔐 Owner token verification for poll', pollId, ':', verified);
        return verified;
    }
}

module.exports = InMemoryRepository;
