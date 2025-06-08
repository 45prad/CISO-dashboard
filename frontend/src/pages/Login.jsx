import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Shield, Users, TrendingUp, Award } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, user, error } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("hello");
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    try {
      await login(email, password);
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Marketing/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: '#00174D' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="max-w-md">
            {/* Logo */}
            <div className="mb-8">
              <img
                src="/CS25_White_Logo.png-1748334152897-826258387.png"
                alt="Logo"
                className="h-16 w-auto mb-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-xl mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-2">TTX Platform</h1>
              <p className="text-xl text-blue-200">Prepare. Respond. Improve.</p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Scenario Simulation</h3>
                  <p className="text-blue-200">Engage in emergency simulations that reflect real-world challenges and threats.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Team Collaboration</h3>
                  <p className="text-blue-200">Work together with your team to assess risks, make decisions, and improve coordination across departments.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Instant Feedback</h3>
                  <p className="text-blue-200">Review outcomes, identify gaps, and receive insights that help you and your team perform better in real emergencies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
        <div className="absolute top-1/2 right-32 w-2 h-16 bg-white bg-opacity-20 rounded-full transform rotate-45"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-24 bg-gray-50">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/CS25_White_Logo.png-1748334152897-826258387.png"
              alt="Logo"
              className="h-12 w-auto mx-auto mb-3"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center w-12 h-12 mx-auto mb-3" style={{ backgroundColor: '#00174D' }}>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#00174D' }}>TTX Platform</h2>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-lg text-gray-600">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error || localError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
                style={{ backgroundColor: '#00174D' }}
              >
                Sign in
              </button>
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: '#00174D' }}
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;