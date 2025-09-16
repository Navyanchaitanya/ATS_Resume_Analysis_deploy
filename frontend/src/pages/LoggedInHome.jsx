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
  FaCog,
  FaPlus,
  FaArrowRight,
  FaBolt,
  FaExclamationTriangle,
  FaBug,
  FaSync,
  FaExclamationCircle
} from 'react-icons/fa';

const LoggedInHome = ({ token }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('Connecting to server...');

  // Load all data - NO FALLBACK DATA
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setApiStatus('Loading data...');
      
      // Load user profile
      const profileResponse = await axios.get('http://localhost:5000/api/profile', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      setUserData(profileResponse.data);
      
      // Load analyses
      const analysesResponse = await axios.get('http://localhost:5000/api/results', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      setAnalyses(analysesResponse.data || []);
      
      // Load stats
      const statsResponse = await axios.get('http://localhost:5000/api/user-stats', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      setStats(statsResponse.data);
      
      setApiStatus('Data loaded successfully');
      
    } catch (err) {
      console.error('Error loading data:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Server timeout. Please check if backend is running.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Server endpoint not found. Check backend routes.');
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Make sure backend is running on port 5000.');
      } else {
        setError('Failed to load data. Please try again.');
      }
      
      setApiStatus('Connection failed');
      
      // SET EMPTY DATA INSTEAD OF DEMO DATA
      setUserData({ name: 'User', profession: 'Not set' });
      setAnalyses([]);
      setStats({
        totalAnalyses: 0,
        averageScore: 0,
        highestScore: 0,
        recentAnalyses: []
      });
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    } else {
      setLoading(false);
      setError('No authentication token found');
      navigate('/login');
    }
  }, [token, navigate]);

  // Debug panel component
  const DebugPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="fixed bottom-4 right-4 z-50">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 text-white p-4 rounded-lg shadow-xl max-w-md mb-2"
          >
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <FaBug /> Debug Information
            </h3>
            <div className="text-sm space-y-2">
              <div><strong>API Status:</strong> {apiStatus}</div>
              <div><strong>Token:</strong> {token ? 'Present' : 'Missing'}</div>
              <div><strong>User Data:</strong> {userData ? 'Loaded' : 'Not loaded'}</div>
              <div><strong>Analyses:</strong> {analyses.length} items</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
            </div>
            <button 
              onClick={loadData}
              className="mt-3 bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <FaSync className="text-xs" /> Retry
            </button>
          </motion.div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        >
          <FaBug />
        </button>
      </div>
    );
  };

  // Stats card component
  const StatCard = ({ value, label, icon, color = "blue" }) => {
    const colorMap = {
      blue: "text-blue-600",
      green: "text-green-600", 
      yellow: "text-yellow-600",
      purple: "text-purple-600"
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`text-2xl ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {value}
        </div>
        <div className="text-gray-600 text-sm">{label}</div>
      </motion.div>
    );
  };

  // Feature card component
  const FeatureCard = ({ icon, title, description, onClick, color = "blue" }) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600", 
      yellow: "bg-yellow-100 text-yellow-600",
      purple: "bg-purple-100 text-purple-600"
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      >
        <div className={`flex items-center justify-center w-16 h-16 ${colorMap[color]} rounded-2xl mb-4 mx-auto`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
          {title}
        </h3>
        <p className="text-gray-600 text-center">
          {description}
        </p>
      </motion.div>
    );
  };

  // Loading component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-700">Loading your dashboard</h2>
          <p className="text-gray-500 mt-2">{apiStatus}</p>
          <DebugPanel />
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <DebugPanel />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {userData?.name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Here's your personalized dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')}
              className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <FaCog className="text-gray-600" />
            </button>
          </div>
        </motion.header>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6 flex items-center"
          >
            <FaExclamationCircle className="mr-3 text-red-500" />
            <div>
              <strong className="font-bold">Error: </strong>
              {error}
            </div>
            <button
              onClick={loadData}
              className="ml-auto bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <FaSync className="text-xs" /> Retry
            </button>
          </motion.div>
        )}

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          <StatCard 
            value={stats?.totalAnalyses || 0}
            label="Resumes Analyzed"
            icon={<FaFileAlt />}
            color="blue"
          />
          <StatCard 
            value={stats?.averageScore ? Math.round(stats.averageScore) : 0}
            label="Average Score"
            icon={<FaStar />}
            color="green"
          />
          <StatCard 
            value={stats?.highestScore ? Math.round(stats.highestScore) : 0}
            label="Highest Score"
            icon={<FaAward />}
            color="yellow"
          />
          <StatCard 
            value={userData?.profession ? userData.profession.split(' ')[0] : 'Not set'}
            label={userData?.profession ? 'Profession' : 'Update Profile'}
            icon={<FaUserTie />}
            color="purple"
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Features Grid */}
          <div className="lg:col-span-2">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-6 text-gray-800"
            >
              What would you like to do today?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard
                icon={<FaChartLine className="text-2xl" />}
                title="Resume Score Checker"
                description="Analyze how well your resume matches job descriptions"
                onClick={() => navigate('/resume-score')}
                color="blue"
              />
              
              <FeatureCard
                icon={<FaTools className="text-2xl" />}
                title="AI Resume Builder"
                description="Create a professional resume with AI suggestions"
                onClick={() => navigate('/resume-builder')}
                color="purple"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaBolt className="text-yellow-500" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/resume-score')}
                  className="w-full bg-blue-500 text-white p-3 rounded-xl font-medium text-left flex items-center justify-between hover:bg-blue-600 transition-colors"
                >
                  <span>New Analysis</span>
                  <FaPlus />
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full bg-gray-100 text-gray-800 p-3 rounded-xl font-medium text-left flex items-center justify-between hover:bg-gray-200 transition-colors"
                >
                  <span>Profile Settings</span>
                  <FaCog />
                </button>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaHistory className="text-blue-600" />
                Recent Activity
              </h3>
              
              {analyses && analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.slice(0, 3).map((analysis, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FaFileAlt className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p>No analyses yet. Upload your first resume to get started!</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 border border-blue-200 p-6 rounded-2xl"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FaLightbulb className="text-amber-500" />
            Pro Tip
          </h3>
          <p className="text-gray-700">
            {analyses && analyses.length > 0 
              ? `Your average score is ${Math.round(stats?.averageScore || 0)}%. Try adding more industry-specific keywords to improve it further!`
              : 'Use action verbs like "developed", "managed", and "implemented" to start your bullet points for better results.'
            }
          </p>
          <button 
            onClick={() => navigate('/resume-score')}
            className="text-blue-600 font-medium mt-3 flex items-center gap-1 hover:text-blue-800 transition-colors"
          >
            Analyze Resume <FaArrowRight />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
export default LoggedInHome;