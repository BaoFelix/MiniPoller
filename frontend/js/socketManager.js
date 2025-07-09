// WebSocket communication

class SocketManager {
  constructor() {
    this.socket = null;
  }

  connect(pollId) {
    // Even though we don't need to specify the URL for the WebSocket connection, we can still use the io function from the socket.io-client library.
    // If you need to connect to a different server, you can specify the URL as an argument to the io function.
    this.socket = io({
      query: {
        pollId: pollId,
      },
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    // Handle errors from server
    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      if (error.code === 'POLL_NOT_FOUND') {
        alert(`Poll not found: ${error.pollId}\nThis poll may have expired or been deleted.`);
        // Optionally redirect to home page
        window.location.href = '/';
      } else if (error.code === 'POLL_DATA_ERROR') {
        alert(`Error loading poll data: ${error.message}`);
      }
    });
  }

  emit(event, data) {
    this.socket.emit(event, data);
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.error("Socket is not connected");
    }
  }
}
