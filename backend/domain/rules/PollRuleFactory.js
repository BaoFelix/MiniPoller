const SingleChoiceRule = require('./SingleChoiceRule');

class PollRuleFactory {
    static create(ruleType) {
        switch (ruleType) {
            case 'single':
                return new SingleChoiceRule();
            default:
                throw new Error(`Unknown rule type: ${ruleType}`);
        }
    }
}
module.exports = PollRuleFactory;
