class ISessionRepository {
    save(poll) {
        throw new Error('Method "save" must be implemented.');
    }
    findById(pollId) {
        throw new Error('Method "findById" must be implemented.');
    }
    exists(pollId) {
        throw new Error('Method "exists" must be implemented.');
    }
    delete(pollId) {
        throw new Error('Method "delete" must be implemented.');
    }
}
module.exports = ISessionRepository;
