import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Professional navbar with glassmorphism, 3D effects, and smooth animations.
 */
export default function Navbar({ darkMode, toggleDarkMode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 py-4 backdrop-blur-xl border-b transition-all duration-300"
         style={{ 
           borderColor: 'rgba(255, 255, 255, 0.1)',
           backgroundColor: 'rgba(255, 255, 255, 0.02)'
         }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Logo with 3D effect */}
        <Link to="/" className="flex items-center gap-3 no-underline group transform transition-transform duration-300 hover:scale-105">
          <div className="relative w-10 h-10">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            {/* Main badge */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l7 3v6c0 5.2-3.8 8.4-7 10-3.2-1.6-7-4.8-7-10V5l7-3z" />
                <path d="M8.5 12.3l2.3 2.3 4.7-4.8" />
              </svg>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Reality Check AI Plus
            </span>
            <span className="text-xs block text-indigo-400 font-medium">Trust Signal Engine</span>
          </div>
        </Link>

        {/* Right: Nav links + auth + toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/about" 
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-400 active:scale-95"
                  style={{ color: 'var(--text-secondary)' }}>
              About
            </Link>
            <Link to="/image-detector"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-400 active:scale-95"
                  style={{ color: 'var(--text-secondary)' }}>
              Image Authenticity Checker
            </Link>
            <Link to="/image-generator"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-400 active:scale-95"
                  style={{ color: 'var(--text-secondary)' }}>
              Image Generator
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/app" 
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-400 active:scale-95"
                      style={{ color: 'var(--text-secondary)' }}>
                  Analyzer
                </Link>
                <Link to="/student-assistant" 
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-400 active:scale-95"
                      style={{ color: 'var(--text-secondary)' }}>
                  Student
                </Link>
              </>
            )}
          </div>

          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Link to="/profile" className="flex items-center gap-2 no-underline group">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>
                <span className="text-sm font-medium hidden sm:block group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name?.split(' ')[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-red-500/10 hover:text-red-400 active:scale-95 hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" 
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-400 active:scale-95 hidden sm:block"
                    style={{ color: 'var(--text-secondary)' }}>
                Login
              </Link>
              <Link to="/signup"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95">
                Sign Up
              </Link>
            </div>
          )}

          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg transition-all duration-300 hover:bg-indigo-500/10 active:scale-95 transform"
            aria-label="Toggle dark mode"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400 hover:text-yellow-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400 hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.005 9.005 0 0012 21a9.005 9.005 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
