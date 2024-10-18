const socketIO = require('socket.io');

class WebSocketServer {
  constructor(sessionManager) {
    this.io = null;
    this.sessionManager = sessionManager;
  }

  initialize(server) {
    this.io = socketIO(server);

    this.io.on('connection', (socket) => {
      this.onConnection(socket);
    });
  }

  onConnection(socket) {
    const pollId = socket.handshake.query.pollId;
    if (pollId) {
      socket.join(pollId);
      console.log(`Client connected to poll ${pollId}`);

      const poll = this.sessionManager.getPoll(pollId);
      if(poll)
      {
        const results = poll.getResults();
        this.io.to(pollId).emit('voteUpdate', results);
      }

      // 监听 'vote' 事件
      socket.on('vote', (data) => this.onVote(socket, data));

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    } else {
      console.error('pollId not provided in connection query parameters.');
      socket.disconnect();
    }
  }

  onVote(socket, data) {
    try {
      const { pollId, option, userId } = data;

      // 验证投票
      const poll = this.sessionManager.getPoll(pollId);

      if (!poll) {
        socket.emit('error', { message: 'Poll not found' });
        return;
      }

      poll.addVote(option, userId);

      // 获取更新后的结果
      const results = poll.getResults();

      // 向房间内的所有客户端广播更新结果
      this.io.to(pollId).emit('voteUpdate', results);

      console.log(`Vote received for poll ${pollId}: ${option} by user ${userId}`);
    } catch (error) {
      console.error('Error processing vote:', error.message);
      socket.emit('error', { message: error.message });
    }
  }

  notifyPollEnd(pollId) {
    this.io.to(pollId).emit('pollEnded');
  }
}

module.exports = WebSocketServer;
