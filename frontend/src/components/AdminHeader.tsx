import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const AdminHeader: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
   <header className="text-white shadow-md" style={{ backgroundColor: '#00174D' }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/admin" className="text-xl font-bold">Admin</Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/admin" className="hover:text-blue-200 transition-colors">Dashboard</Link>
            <Link to="/admin/quiz/create" className="hover:text-blue-200 transition-colors">Create Scenario</Link>
            <Link to="/admin/users" className="hover:text-blue-200 transition-colors">Manage Users</Link>
            <Link to="/admin/scoreboard" className="hover:text-blue-200 transition-colors">ScoreBoard</Link>
            
            <div className="flex items-center ml-6">
              <span className="mr-4">Hi, {user?.name}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </div>
          </nav>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <nav className="mt-4 pb-2 md:hidden">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/admin" 
                className="hover:bg-blue-700 px-2 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/quiz/create" 
                className="hover:bg-blue-700 px-2 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Create Scenario
              </Link>
              <Link 
                to="/admin/users" 
                className="hover:bg-blue-700 px-2 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Manage Users
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;