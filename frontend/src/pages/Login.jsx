import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, user, error } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-slate-800 to-blue-900">
            <div className="flex items-center justify-center mb-6">
              <div className="">
                <img
                  src="/CS25_White_Logo.png-1748334152897-826258387.png"
                  alt="Logo"
                  className="h-20 w-auto" // Enlarged logo
                />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                TTX Platform
              </h1>
            </div>

            {/* Security indicator */}
            <div className="absolute top-4 right-4 flex items-center space-x-1 text-xs text-green-300">
              <Lock className="h-3 w-3" />
              <span>Secured</span>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {/* Status Messages */}
            {localError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start">
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">Access Denied</p>
                  <p className="text-sm mt-1">{localError}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-start">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Access Granted</p>
                  <p className="text-sm mt-1">{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
                  Delegates Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="your.email@company.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                  Secure Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter your secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Access Platform
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-blue-200">
            <CheckCircle className="h-4 w-4" />
            <span>Powered By Hacktify</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;