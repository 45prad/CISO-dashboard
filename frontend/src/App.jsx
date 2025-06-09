import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CreateQuiz from './pages/admin/CreateQuiz';
import EditQuiz from './pages/admin/EditQuiz';
import ManageUsers from './pages/admin/ManageUsers';
import QuizMonitor from './pages/admin/QuizMonitor';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import TakeQuiz from './pages/user/TakeQuiz';
import WaitingRoom from './pages/user/WaitingRoom';
import QuizResult from './pages/user/QuizResult';
import ScoreBoard from './pages/admin/ScoreBoard';
function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/quiz/create"
                element={
                  <AdminRoute>
                    <CreateQuiz />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/quiz/:id/edit"
                element={
                  <AdminRoute>
                    <EditQuiz />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/scoreboard"
                element={
                  <AdminRoute>
                    <ScoreBoard />
                  </AdminRoute>

                }
              />
              <Route
                path="/admin/quiz/:id/monitor"
                element={
                  <AdminRoute>
                    <QuizMonitor />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <ManageUsers />
                  </AdminRoute>
                }
              />

              {/* User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz/:id"
                element={
                  <ProtectedRoute>
                    <TakeQuiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz/:id/waiting"
                element={
                  <ProtectedRoute>
                    <WaitingRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz/:id/result"
                element={
                  <ProtectedRoute>
                    <QuizResult />
                  </ProtectedRoute>
                }
              />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login\" replace />} />
              <Route path="*" element={<Navigate to="/login\" replace />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;