class ISessionObserver {
    onVoteUpdate(pollId, results) {
        throw new Error('Method "onVoteUpdate" must be implemented.');
    }
    onPollEnded(pollId, finalResults) {
        throw new Error('Method "onPollEnded" must be implemented.');
    }
}
module.exports = ISessionObserver;
