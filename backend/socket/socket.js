import Quiz from '../models/Quiz.js';

const setupSocketHandlers = (io) => {
  // Store active rooms and users
  const rooms = {};


  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a quiz room
    socket.on('joinQuizRoom', ({ quizId, userId, role }) => {
      socket.join(quizId);

      if (!rooms[quizId]) {
        rooms[quizId] = { users: new Set(), admins: new Set() };
      }

      if (role === 'admin') {
        rooms[quizId].admins.add(userId);
      } else {
        rooms[quizId].users.add(userId);
      }

      // Emit updated room info
      io.to(quizId).emit('roomUpdate', {
        userCount: rooms[quizId].users.size,
        adminCount: rooms[quizId].admins.size
      });

      console.log(`User ${userId} joined room ${quizId} as ${role}`);
    });

    // Leave a quiz room
    socket.on('leaveQuizRoom', ({ quizId, userId, role }) => {
      socket.leave(quizId);

      if (rooms[quizId]) {
        if (role === 'admin') {
          rooms[quizId].admins.delete(userId);
        } else {
          rooms[quizId].users.delete(userId);
        }

        // Emit updated room info
        io.to(quizId).emit('roomUpdate', {
          userCount: rooms[quizId].users.size,
          adminCount: rooms[quizId].admins.size
        });

        // Clean up empty rooms
        if (rooms[quizId].users.size === 0 && rooms[quizId].admins.size === 0) {
          delete rooms[quizId];
        }
      }

      console.log(`User ${userId} left room ${quizId}`);
    });

    // Admin triggers show impact
    socket.on('adminShowImpact', async ({ quizId }) => {
      try {
        // Update quiz in database
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.showImpact = true;
          await quiz.save();

          // Broadcast to all users in the room
          io.to(quizId).emit('showImpact', { quizId });
          console.log(`Impact shown for quiz ${quizId}`);
        }
      } catch (error) {
        console.error('Error showing impact:', error);
      }
    });
    // socket.js
    // Add this new handler alongside the existing ones
    socket.on('adminShowSummary', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.showSummary = true;
          await quiz.save();

          io.to(quizId).emit('showSummary', { quizId });
          console.log(`Summary shown for quiz ${quizId}`);
        }
      } catch (error) {
        console.error('Error showing summary:', error);
      }
    });
    // Add this new handler alongside the existing ones
    socket.on('adminShowOptions', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          if (!quiz.showOptions) {
            quiz.showOptions = true;
            await quiz.save();
          }

          io.to(quizId).emit('showOptions', { quizId });
        }
      } catch (error) {
        console.error('Error showing summary:', error);
      }
    });
    // Admin triggers show mitigation
    socket.on('adminShowMitigation', async ({ quizId }) => {
      try {
        // Update quiz in database
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.showMitigation = true;
          await quiz.save();

          // Broadcast to all users in the room
          io.to(quizId).emit('showMitigation', { quizId });
          console.log(`Mitigation shown for quiz ${quizId}`);
        }
      } catch (error) {
        console.error('Error showing mitigation:', error);
      }
    });

    // Admin activates quiz
    socket.on('adminActivateQuiz', async ({ quizId }) => {
      try {
        // Update quiz in database
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.isActive = true;
          await quiz.save();

          // Broadcast to all users in the room
          io.to(quizId).emit('quizActivated', { quizId });
          console.log(`Quiz ${quizId} activated`);
        }
      } catch (error) {
        console.error('Error activating quiz:', error);
      }
    });

    // Admin deactivates quiz
    socket.on('adminDeactivateQuiz', async ({ quizId }) => {
      try {
        // Update quiz in database
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.isActive = false;
          quiz.showImpact = false;
          quiz.showMitigation = false;
          await quiz.save();

          // Broadcast to all users in the room
          io.to(quizId).emit('quizDeactivated', { quizId });
          console.log(`Quiz ${quizId} deactivated`);
        }
      } catch (error) {
        console.error('Error deactivating quiz:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Clean up user from all rooms
      Object.keys(rooms).forEach(quizId => {
        if (socket.rooms.has(quizId)) {
          // Since we don't know if user was admin or regular user,
          // we can't properly update the counts, but the room will
          // be cleaned up on next explicit leave or room join
          socket.leave(quizId);
        }
      });
    });
  });
};

export default setupSocketHandlers;