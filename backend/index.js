const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/userRoute');
const documentRoutes = require('./routes/documentRoute');
const versionRoutes = require('./routes/versionRoute');

// Import socket handlers
const socketHandlers = require('./socket/socket');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/versions', versionRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  // Set a timeout for authentication
  const authTimeout = setTimeout(() => {
    socket.emit('authentication-error', { message: 'Authentication timeout' });
    socket.disconnect();
  }, 5000); // 5 seconds to authenticate

  // Listen for authentication
  socket.on('authenticate', async (token) => {
    clearTimeout(authTimeout);
    // Pass the socket and io to your socketHandlers
    // Your socketHandlers should handle authentication and log only authenticated users
    socketHandlers(io, socket, token);
  });

  // Optionally, handle disconnects
  socket.on('disconnect', () => {
    // You can log or clean up here if needed
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
