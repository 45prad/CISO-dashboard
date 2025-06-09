import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const UserHeader: React.FC = () => {
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
          <Link to="/dashboard" className="text-xl font-bold">TTX Platform</Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="hover:text-blue-200 transition-colors">My Scenarios</Link>
            
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
                to="/dashboard" 
                className="hover:bg-blue-700 px-2 py-2 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                My Scenarios
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

export default UserHeader;