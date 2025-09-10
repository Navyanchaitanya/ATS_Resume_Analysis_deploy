import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FaRocket, 
  FaChartLine, 
  FaUserTie, 
  FaTools, 
  FaFileAlt,
  FaHistory,
  FaStar,
  FaAward,
  FaLightbulb,
  FaBell,
  FaCog,
  FaSearch,
  FaPlus,
  FaArrowRight,
  FaBolt,
  FaExclamationTriangle,
  FaUserCircle
} from 'react-icons/fa';

// API service functions
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
const fetchUserProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

const fetchRecentAnalyses = async () => {
  try {
    const response = await api.get('/results');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    throw error;
  }
};

const fetchUserStats = async () => {
  try {
    const response = await api.get('/user-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Fallback to calculating from recent analyses
    try {
      const analyses = await fetchRecentAnalyses();
      return calculateStatsFromAnalyses(analyses);
    } catch (err) {
      throw err;
    }
  }
};

// Helper function to calculate stats from analyses
const calculateStatsFromAnalyses = (analyses) => {
  if (!analyses || analyses.length === 0) {
    return {
      totalAnalyses: 0,
      averageScore: 0,
      highestScore: 0,
      recentAnalyses: []
    };
  }

  const scores = analyses.map(a => a.score.total).filter(score => score !== undefined && score !== null);
  
  if (scores.length === 0) {
    return {
      totalAnalyses: 0,
      averageScore: 0,
      highestScore: 0,
      recentAnalyses: []
    };
  }

  const totalAnalyses = scores.length;
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAnalyses;
  const highestScore = Math.max(...scores);

  return {
    totalAnalyses,
    averageScore,
    highestScore,
    recentAnalyses: analyses.slice(0, 5)
  };
};

// Animated background component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, 70, 0],
          y: [0, -70, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>
  );
};

// Floating cards component
const FloatingCard = ({ icon, title, description, onClick, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group relative overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ scale: 0.8 }}
        whileHover={{ scale: 1 }}
      />
      
      <motion.div 
        className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-6 relative z-10 mx-auto"
        animate={{ 
          rotate: isHovered ? 360 : 0,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ scale: isHovered ? 1.2 : 1 }}
          transition={{ duration: 0.3 }}
          className="text-2xl text-white"
        >
          {icon}
        </motion.div>
      </motion.div>
      
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center relative z-10">
        {title}
      </h3>
      
      <p className="text-gray-600 leading-relaxed text-center relative z-10">
        {description}
      </p>
      
      <motion.div
        className="flex justify-center mt-6 relative z-10"
        animate={{ x: isHovered ? 5 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <FaArrowRight className="text-blue-600" />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Stats card component
const StatCard = ({ value, label, icon, trend, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl text-blue-600">
          {icon}
        </div>
        {trend && (
          <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-2">
        {value}
      </div>
      <div className="text-gray-600 text-sm">{label}</div>
    </motion.div>
  );
};

// Recent activity component
const ActivityFeed = ({ analyses, loading }) => {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FaHistory className="text-blue-600" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse flex items-center justify-between p-3 rounded-xl bg-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-300 rounded w-10 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.6 }}
      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaHistory className="text-blue-600" />
        Recent Activity
      </h3>
      
      {analyses && analyses.length > 0 ? (
        <div className="space-y-4">
          {analyses.slice(0, 5).map((analysis, index) => (
            <motion.div
              key={analysis.id || index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
              onClick={() => navigate('/resume-score')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaFileAlt className="text-blue-600" />
                </div>
                <div>
                  <div className="text-gray-800 font-medium">Resume Analyzed</div>
                  <div className="text-gray-600 text-sm">{analysis.filename || 'Untitled'}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-bold ${analysis.score?.total >= 80 ? 'text-green-600' : analysis.score?.total >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {analysis.score?.total || 0}%
                </div>
                <div className="text-gray-500 text-xs">
                  {analysis.created_at ? new Date(analysis.created_at).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FaFileAlt className="text-4xl mx-auto mb-3 text-gray-300" />
          <p>No analyses yet</p>
          <p className="text-sm">Analyze your first resume to see results here</p>
          <button 
            onClick={() => navigate('/resume-score')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Analyze Resume
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Quick actions component
const QuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    { icon: <FaPlus />, label: 'New Analysis', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', onClick: () => navigate('/resume-score') },
    { icon: <FaSearch />, label: 'Find Jobs', color: 'bg-gradient-to-r from-purple-500 to-pink-500', onClick: () => navigate('/job-matcher') },
    { icon: <FaCog />, label: 'Settings', color: 'bg-gradient-to-r from-amber-500 to-orange-500', onClick: () => navigate('/profile') },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.8 }}
      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaBolt className="text-yellow-500" />
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className={`${action.color} text-white p-4 rounded-xl flex items-center justify-between transition-all duration-300 shadow-md hover:shadow-lg`}
          >
            <span className="font-medium">{action.label}</span>
            <span className="text-lg">{action.icon}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

const LoggedInHome = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profile = await fetchUserProfile();
        setUserData(profile);
        
        // Fetch recent analyses
        const recentAnalyses = await fetchRecentAnalyses();
        setAnalyses(recentAnalyses);
        
        // Fetch user stats
        const userStats = await fetchUserStats();
        setStats(userStats);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          // Token is invalid, redirect to login
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const features = [
    {
      icon: <FaChartLine />,
      title: 'Resume Score Checker',
      description: 'Instantly analyze how well your resume matches a job description. Get insights on keywords, grammar, and more.',
      onClick: () => navigate('/resume-score')
    },
    {
      icon: <FaTools />,
      title: 'AI Resume Builder',
      description: 'Craft a stunning, professional resume using beautiful templates and AI suggestions — export it in seconds.',
      onClick: () => navigate('/resume-builder')
    },
    {
      icon: <FaUserTie />,
      title: 'Job Matcher',
      description: 'Find perfect job matches based on your resume and preferences. Get personalized recommendations.',
      onClick: () => navigate('/job-matcher')
    },
    {
      icon: <FaLightbulb />,
      title: 'Career Advisor',
      description: 'Get personalized career advice and roadmap based on your skills, experience, and goals.',
      onClick: () => navigate('/career-advisor')
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 overflow-hidden relative p-6 flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 overflow-hidden relative p-6 flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md"
        >
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 overflow-hidden relative p-6">
      <AnimatedBackground />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.header 
          className="flex justify-between items-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {userData?.name || userData?.email || 'User'}! 👋
            </h1>
            <p className="text-gray-600">
              Here's your personalized dashboard • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <FaBell className="text-gray-700" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
              onClick={() => navigate('/profile')}
            >
              <FaCog className="text-gray-700" />
            </motion.button>
          </div>
        </motion.header>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatCard 
            value={stats?.totalAnalyses || 0}
            label="Resumes Analyzed"
            icon={<FaFileAlt />}
            trend={stats?.totalAnalyses > 0 ? undefined : null}
            delay={0.3}
          />
          <StatCard 
            value={stats?.averageScore ? Math.round(stats.averageScore) : 0}
            label="Average Score"
            icon={<FaStar />}
            trend={stats?.averageScore > 70 ? "+5%" : null}
            delay={0.4}
          />
          <StatCard 
            value={stats?.highestScore ? Math.round(stats.highestScore) : 0}
            label="Highest Score"
            icon={<FaAward />}
            delay={0.5}
          />
          <StatCard 
            value={userData?.profession ? userData.profession.split(' ')[0] : 'Not set'}
            label={userData?.profession ? 'Profession' : 'Update Profile'}
            icon={<FaUserTie />}
            delay={0.6}
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Features Grid */}
          <div className="lg:col-span-2">
            <motion.h2 
              className="text-2xl font-bold mb-6 flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <FaRocket className="text-blue-600" />
              What would you like to do today?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <FloatingCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  onClick={feature.onClick}
                  delay={0.5 + index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <QuickActions />
            <ActivityFeed analyses={analyses} loading={loading} />
          </div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="bg-gradient-to-r from-blue-100 to-cyan-100 p-8 rounded-2xl border border-blue-200 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaLightbulb className="text-amber-500" />
            Pro Tip of the Day
          </h3>
          <p className="text-gray-700 mb-4">
            {analyses && analyses.length > 0 
              ? `Your average score is ${Math.round(stats?.averageScore || 0)}%. Try adding more industry-specific keywords to improve it further!`
              : 'Use action verbs like "developed", "managed", and "implemented" to start your bullet points. This increases your ATS score by up to 15%!'
            }
          </p>
          <button 
            onClick={() => navigate('/resume-score')}
            className="text-blue-600 font-medium flex items-center gap-2 hover:text-blue-800 transition-colors duration-300"
          >
            Analyze Resume <FaArrowRight />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LoggedInHome;