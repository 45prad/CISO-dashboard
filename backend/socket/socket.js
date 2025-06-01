import Quiz from '../models/Quiz.js';

const setupSocketHandlers = (io) => {
  const rooms = {};
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
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
      
      io.to(quizId).emit('roomUpdate', {
        userCount: rooms[quizId].users.size,
        adminCount: rooms[quizId].admins.size
      });
    });
    
    socket.on('leaveQuizRoom', ({ quizId, userId, role }) => {
      socket.leave(quizId);
      
      if (rooms[quizId]) {
        if (role === 'admin') {
          rooms[quizId].admins.delete(userId);
        } else {
          rooms[quizId].users.delete(userId);
        }
        
        io.to(quizId).emit('roomUpdate', {
          userCount: rooms[quizId].users.size,
          adminCount: rooms[quizId].admins.size
        });
        
        if (rooms[quizId].users.size === 0 && rooms[quizId].admins.size === 0) {
          delete rooms[quizId];
        }
      }
    });

    // Question control events
    socket.on('showQuestion', async ({ quizId, questionIndex }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.questions[questionIndex].isVisible = true;
          quiz.currentQuestionIndex = questionIndex;
          await quiz.save();
          io.to(quizId).emit('questionShown', { quizId, questionIndex });
        }
      } catch (error) {
        console.error('Error showing question:', error);
      }
    });

    socket.on('showOptions', async ({ quizId, questionIndex }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.questions[questionIndex].optionsVisible = true;
          await quiz.save();
          io.to(quizId).emit('optionsShown', { quizId, questionIndex });
        }
      } catch (error) {
        console.error('Error showing options:', error);
      }
    });

    socket.on('showQuestionSummary', async ({ quizId, questionIndex }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.questions[questionIndex].showSummary = true;
          await quiz.save();
          io.to(quizId).emit('questionSummaryShown', { quizId, questionIndex });
        }
      } catch (error) {
        console.error('Error showing summary:', error);
      }
    });

    socket.on('showQuestionImpact', async ({ quizId, questionIndex }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.questions[questionIndex].showImpact = true;
          await quiz.save();
          io.to(quizId).emit('questionImpactShown', { quizId, questionIndex });
        }
      } catch (error) {
        console.error('Error showing impact:', error);
      }
    });

    socket.on('showQuestionMitigation', async ({ quizId, questionIndex }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.questions[questionIndex].showMitigation = true;
          await quiz.save();
          io.to(quizId).emit('questionMitigationShown', { quizId, questionIndex });
        }
      } catch (error) {
        console.error('Error showing mitigation:', error);
      }
    });

    socket.on('nextQuestion', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz && quiz.currentQuestionIndex < quiz.questions.length - 1) {
          quiz.currentQuestionIndex += 1;
          await quiz.save();
          io.to(quizId).emit('movedToNextQuestion', { 
            quizId, 
            questionIndex: quiz.currentQuestionIndex 
          });
        }
      } catch (error) {
        console.error('Error moving to next question:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      Object.keys(rooms).forEach(quizId => {
        if (socket.rooms.has(quizId)) {
          socket.leave(quizId);
        }
      });
    });
  });
};

export default setupSocketHandlers;

export default setupSocketHandlers