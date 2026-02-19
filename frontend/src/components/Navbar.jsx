import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar with logo, navigation links, auth state, and dark/light mode toggle.
 */
export default function Navbar({ darkMode, toggleDarkMode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between border-b"
         style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
      
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
          ✓
        </div>
        <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          RealityCheck <span className="text-indigo-500">AI</span>
        </span>
      </Link>

      {/* Right: Nav links + auth + toggle */}
      <div className="flex items-center gap-4">
        <Link to="/about" className="text-sm font-medium hover:text-indigo-500 transition-colors hidden sm:block"
              style={{ color: 'var(--text-secondary)' }}>
          About
        </Link>

        {isAuthenticated ? (
          <>
            <Link to="/app" className="text-sm font-medium hover:text-indigo-500 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
              Analyzer
            </Link>
            <Link to="/profile" className="flex items-center gap-2 no-underline">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                {user?.full_name?.split(' ')[0]}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium hover:text-red-500 transition-colors hidden sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium hover:text-indigo-500 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
              Login
            </Link>
            <Link to="/signup"
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
              Sign Up
            </Link>
          </>
        )}

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-indigo-500/10 transition-colors"
          aria-label="Toggle dark mode"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.005 9.005 0 0012 21a9.005 9.005 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
