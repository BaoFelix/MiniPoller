const Poll = require('../models/poll');

describe('Poll voting', () => {
  let poll;
  beforeEach(() => {
    poll = new Poll({
      taskDescription: 'Test poll',
      options: ['A', 'B'],
      displayStyle: 'anonymous'
    });
  });

  test('successful vote addition increments counts', () => {
    poll.addVote('A', 'user1');
    expect(poll.voteCounts.get('A')).toBe(1);
    expect(poll.votes.get('user1')).toBe('A');
  });

  test('duplicate votes throw an error', () => {
    poll.addVote('A', 'user1');
    expect(() => poll.addVote('B', 'user1')).toThrow('User has already voted');
  });

  test('invalid options throw an error', () => {
    expect(() => poll.addVote('C', 'user2')).toThrow('Invalid voting option');
  });
});
