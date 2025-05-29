import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Edit, Save, X, Check, Search } from 'lucide-react';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import AuthContext from '../../context/AuthContext';

const ManageUsers = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: '',
    assignedQuizzes: []
  });
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users and quizzes in parallel
        const [usersRes, quizzesRes] = await Promise.all([
          axios.get(`${backendUrl}/api/users`),
          axios.get(`${backendUrl}/api/quizzes`)
        ]);
        
        setUsers(usersRes.data);
        setQuizzes(quizzesRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('All fields are required');
      return;
    }
    
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/register`, newUser);
      
      setUsers([...users, data]);
      setIsAddingUser(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user'
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
    }
  };
  
  const startEditing = (userId) => {
    const userToEdit = users.find(u => u._id === userId);
    if (userToEdit) {
      setEditingUserId(userId);
      setEditUserData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        assignedQuizzes: userToEdit.assignedQuizzes || []
      });
    }
  };
  
  const cancelEditing = () => {
    setEditingUserId(null);
    setEditUserData({
      name: '',
      email: '',
      role: '',
      assignedQuizzes: []
    });
  };
  
  const handleSaveUser = async (userId) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/users/${userId}`, {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role
      });
      
      // Update assignedQuizzes separately
      await axios.put(`${backendUrl}/api/users/${userId}/assign`, {
        quizzes: editUserData.assignedQuizzes
      });
      
      // Update users state
      setUsers(users.map(u => u._id === userId ? {
        ...u,
        name: data.name,
        email: data.email,
        role: data.role,
        assignedQuizzes: editUserData.assignedQuizzes
      } : u));
      
      cancelEditing();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await axios.delete(`${backendUrl}/api/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };
  
  const toggleQuizAssignment = (quizId) => {
    const isAssigned = editUserData.assignedQuizzes.includes(quizId);
    
    if (isAssigned) {
      // Remove quiz
      setEditUserData({
        ...editUserData,
        assignedQuizzes: editUserData.assignedQuizzes.filter(id => id !== quizId)
      });
    } else {
      // Add quiz
      setEditUserData({
        ...editUserData,
        assignedQuizzes: [...editUserData.assignedQuizzes, quizId]
      });
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600 mt-1">Add, edit, and assign Scenarios to users</p>
          </div>
          
          <button
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="mt-4 md:mt-0 flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {isAddingUser ? 'Cancel' : (
              <>
                <PlusCircle size={20} className="mr-2" />
                Add User
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {isAddingUser && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleAddUser}
                className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Check size={18} className="mr-2" />
                Save User
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-600">No users found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Scenarios
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    {editingUserId === u._id ? (
                      // Editing mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editUserData.name}
                            onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="email"
                            value={editUserData.email}
                            onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editUserData.role}
                            onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-h-32 overflow-y-auto">
                            {quizzes.map(quiz => (
                              <div key={quiz._id} className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  checked={editUserData.assignedQuizzes.includes(quiz._id)}
                                  onChange={() => toggleQuizAssignment(quiz._id)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                  {quiz.title}
                                </label>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleSaveUser(u._id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      // Display mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {u.assignedQuizzes && u.assignedQuizzes.length > 0 ? (
                              <span>{u.assignedQuizzes.length} Scenarios</span>
                            ) : (
                              <span>No Scenarios assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => startEditing(u._id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageUsers;