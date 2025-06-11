import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import quizRoutes from './routes/quizzes.js';
import submissionRoutes from './routes/submissions.js';
import scoreboardRoutes from './routes/scoreboard.js';
import QuizTimerRoutes from './routes/QuizTimer.js';

// Import socket handler
import setupSocketHandlers from './socket/socket.js';
import { protect } from './middleware/auth.js';

// Configure environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://pradipgarhwal183:pradip183@quiz.yk2hzv0.mongodb.net/?retryWrites=true&w=majority&appName=quiz')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/quizTimer', QuizTimerRoutes);

// serve media files
app.get('/uploads/:type/:filename', protect, async (req, res) => {
  const {type, filename} = req.params;
  const filePath = path.join(process.cwd(), 'uploads', type, filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    return res.status(404).json({ message: 'File not found' });
  }
});

// Setup socket handlers
setupSocketHandlers(io);

// Serve static assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});