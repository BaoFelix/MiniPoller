const socketIO = require('socket.io');

class WebSocketServer {
  constructor(sessionManager) {
    this.io = null;
    this.sessionManager = sessionManager;
  }

  initialize(server) {
    try {
      this.io = socketIO(server);

      // Socket is the connection between the client and the server, it contains many functions to interact with the client
      this.io.on('connection', (socket) => {
        this.onConnection(socket);
      });

      console.log("WebSocket server initialized.");
    } catch (error) {
      console.error("Error initializing WebSocket server:", error.message);
    }
  }

  onConnection(socket) {
    const pollId = socket.handshake.query.pollId;
    if (pollId) {
      console.log(`🔌 Client trying to connect to poll: ${pollId}`);
      
      // Check if poll exists before joining
      if (!this.sessionManager.pollExists(pollId)) {
        console.error(`❌ Poll ${pollId} not found. Disconnecting client.`);
        socket.emit('error', { 
          message: 'Poll not found', 
          code: 'POLL_NOT_FOUND',
          pollId: pollId 
        });
        socket.disconnect();
        return;
      }

      // Add the client to the room for the poll
      socket.join(pollId);
      console.log(`✅ Client connected to poll ${pollId}`);

      try {
        const poll = this.sessionManager.getPoll(pollId);
        const results = poll.getResults();

        // Send the current poll results to all clients in the room
        this.io.to(pollId).emit('voteUpdate', results);
      } catch (error) {
        console.error(`❌ Error getting poll results for ${pollId}:`, error.message);
        socket.emit('error', { 
          message: 'Error loading poll data', 
          code: 'POLL_DATA_ERROR',
          pollId: pollId 
        });
      }

      // Listen for vote events from the client
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

      const poll = this.sessionManager.getPoll(pollId);

      if (!poll) {
        socket.emit('error', { message: 'Poll not found' });
        return;
      }

      poll.addVote(option, userId);

      const results = poll.getResults();

      // Send the current poll results to all clients in the room
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
