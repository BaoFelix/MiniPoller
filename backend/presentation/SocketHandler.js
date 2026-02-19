class SocketHandler {
    constructor(io, sessionService) {
        this.io = io;
        this.sessionService = sessionService;
    }

    initialize() {
        this.io.on('connection', (socket) => {
            this.onConnection(socket);
        });
        console.log("WebSocket handler initialized.");
    }

    onConnection(socket) {
        const pollId = socket.handshake.query.pollId;
        if (pollId) {
            console.log(`🔌 Client trying to connect to poll: ${pollId}`);
            
            // Check if poll exists before joining
            try {
                const poll = this.sessionService.getSession(pollId);
                if (!poll) {
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
                socket.disconnect();
                return;
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

            // SessionService.vote() will handle the voting logic and notify observers
            this.sessionService.vote(pollId, userId, { option });

            console.log(`Vote received for poll ${pollId}: ${option} by user ${userId}`);
        } catch (error) {
            console.error('Error processing vote:', error.message);
            socket.emit('error', { message: error.message });
        }
    }
}

module.exports = SocketHandler;
