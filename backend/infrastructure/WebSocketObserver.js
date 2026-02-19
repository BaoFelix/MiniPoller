const ISessionObserver = require('../domain/ISessionObserver');

class WebSocketObserver extends ISessionObserver {
    constructor(io) {
        super();
        this.io = io;
    }

    onVoteUpdate(pollId, results) {
        console.log(`📡 Broadcasting vote update for poll ${pollId}`);
        this.io.to(pollId).emit('voteUpdate', results);
    }

    onPollEnded(pollId, finalResults) {
        console.log(`📡 Broadcasting poll ended for poll ${pollId}`);
        this.io.to(pollId).emit('pollEnded', finalResults);
    }
}

module.exports = WebSocketObserver;
