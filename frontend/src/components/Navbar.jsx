import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, 
  FaUser, 
  FaFileAlt, 
  FaTools, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaFileSignature
} from 'react-icons/fa';

const Navbar = ({ token, userData, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/home', label: 'Dashboard', icon: FaHome },
    { path: '/resume-score', label: 'Analyze Resume', icon: FaFileAlt },
    { path: '/resume-builder', label: 'Resume Builder', icon: FaTools },
    { path: '/profile', label: 'Profile', icon: FaUser }
  ];

  const isActive = (path) => location.pathname === path;

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg' 
          : 'bg-white/90 backdrop-blur-md border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center"
              >
                <FaFileSignature className="text-white text-lg" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ResumeCheck
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {token ? (
                <>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogoutClick}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl font-medium transition-all hover:shadow-md"
                  >
                    <FaSignOutAlt className="text-sm" />
                    <span>Logout</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl font-medium transition-all hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden mobile-menu-container">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 w-80 bg-white/95 backdrop-blur-lg border-l border-gray-200 shadow-2xl z-50 md:hidden mobile-menu-container"
            >
              <div className="flex flex-col h-full">
                {/* User Info */}
                {token && userData && (
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                        {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 truncate">
                          {userData.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {userData.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto">
                  <nav className="p-4 space-y-2">
                    {token ? (
                      <>
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 font-medium ${
                                isActive(item.path)
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <Icon className="text-lg" />
                              <span className="text-lg">{item.label}</span>
                            </Link>
                          );
                        })}
                        
                        <div className="pt-4 border-t border-gray-200 mt-4">
                          <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                          >
                            <FaSignOutAlt className="text-lg" />
                            <span className="text-lg">Logout</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium"
                        >
                          <FaUser className="text-lg" />
                          <span className="text-lg">Login</span>
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium justify-center mt-4"
                        >
                          <FaFileSignature className="text-lg" />
                          <span className="text-lg">Get Started</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>

                {/* App Info */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">
                    ResumeCheck v1.0
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;