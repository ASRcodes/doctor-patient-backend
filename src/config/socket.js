const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("./index");

/**
 * Sets up Socket.io for real-time chat within consultations.
 *
 * Events:
 *   - join-consultation: client joins a consultation room
 *   - new-message: server broadcasts when a message is sent via REST API
 *
 * Authentication: clients must pass their JWT token on connection.
 */
const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId}`);

    // Client joins a consultation room
    socket.on("join-consultation", (consultationId) => {
      socket.join(`consultation:${consultationId}`);
      console.log(`  → User ${socket.userId} joined consultation:${consultationId}`);
    });

    socket.on("leave-consultation", (consultationId) => {
      socket.leave(`consultation:${consultationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = setupSocket;
