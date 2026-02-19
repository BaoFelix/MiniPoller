class IPollRule {
    validate(poll, userId, voteData) {
        throw new Error('Method "validate" must be implemented.');
    }
    apply(poll, userId, voteData) {
        throw new Error('Method "apply" must be implemented.');
    }
}
module.exports = IPollRule;
