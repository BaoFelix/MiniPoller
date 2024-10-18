// WebSocket communication

class SocketManager {
  constructor() {
    this.socket = null;
  }

  //虽然在代码中没有明确指定服务器的 URL，但 Socket.IO 客户端库会默认连接到提供 HTML 文件的同一服务器。如果需要指定不同的服务器地址，可以在调用 io 函数时传递完整的 URL。
  connect(pollId) {
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
