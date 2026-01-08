import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaSave,
  FaTimes,
  FaAward,
  FaStar,
  FaFileAlt,
  FaExclamationCircle,
  FaSync
} from 'react-icons/fa';
import { API_BASE_URL } from '../App';

const Profile = ({ token, onLogout }) => {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    profession: '',
    location: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchUserStats();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = response.data;
      setUser(userData);
      setForm({
        name: userData.name || '',
        profession: userData.profession || '',
        location: userData.location || '',
        bio: userData.bio || ''
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUserStats(response.data);
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      const response = await axios.put(`${API_BASE_URL}/api/profile`, form, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUser({ ...user, ...form });
      setIsEditing(false);
      setSaveStatus('success');
      
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          initial={{ rotate: 0, scale: 0.8 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Profile Dashboard
            </span>
          </h1>
          <p className="text-gray-600">Manage your professional identity</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6 flex items-center">
            <FaExclamationCircle className="mr-3 text-red-500" />
            <div className="flex-1">
              <strong className="font-bold">Error: </strong>
              {error}
            </div>
            <button
              onClick={fetchProfile}
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <FaSync className="text-xs" /> Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white shadow-2xl">
              {/* Avatar Section */}
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-2xl">
                  {getInitials(user?.name || user?.email)}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {user?.name || 'Your Name'}
                </h2>
                
                <p className="text-blue-600 mb-4">
                  {user?.profession || 'Professional Title'}
                </p>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>

              {/* Stats - REAL DATA FROM API */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <FaFileAlt className="text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {userStats?.totalAnalyses || 0}
                  </div>
                  <div className="text-gray-600 text-sm">Resumes Analyzed</div>
                </div>
                
                <div className="text-center p-4 bg-cyan-50 rounded-xl">
                  <FaStar className="text-cyan-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {userStats?.averageScore ? Math.round(userStats.averageScore) + '%' : '0%'}
                  </div>
                  <div className="text-gray-600 text-sm">Avg. Score</div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {isEditing ? (
                  <>
                    <FaTimes />
                    <span>Cancel Edit</span>
                  </>
                ) : (
                  <>
                    <FaEdit />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Info Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaUser className="mr-3 text-blue-500" />
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-600 mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="text-gray-800 text-lg">{form.name || 'Not specified'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">Email</label>
                  <div className="text-gray-800 text-lg flex items-center">
                    <FaEnvelope className="mr-2 text-blue-400" />
                    {user?.email || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">Profession</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="profession"
                      value={form.profession}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                      placeholder="e.g., Software Engineer"
                    />
                  ) : (
                    <div className="text-gray-800 text-lg flex items-center">
                      <FaBriefcase className="mr-2 text-green-500" />
                      {form.profession || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                      placeholder="e.g., San Francisco, CA"
                    />
                  ) : (
                    <div className="text-gray-800 text-lg flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      {form.location || 'Not specified'}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              <div className="mt-6">
                <label className="block text-gray-600 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="text-gray-700 leading-relaxed">
                    {form.bio || 'No bio provided yet. Share something about yourself!'}
                  </div>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2 mx-auto"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  {saveStatus === 'success' && (
                    <div className="text-green-600 mt-4">
                      Profile updated successfully!
                    </div>
                  )}

                  {saveStatus === 'error' && (
                    <div className="text-red-600 mt-4">
                      Error saving profile. Please try again.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaAward className="mr-3 text-yellow-500" />
                Your Resume Analysis Statistics
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <FaFileAlt className="text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{userStats?.totalAnalyses || 0}</div>
                  <div className="text-gray-600 text-sm">Total Analyses</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <FaStar className="text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {userStats?.averageScore ? Math.round(userStats.averageScore) + '%' : '0%'}
                  </div>
                  <div className="text-gray-600 text-sm">Average Score</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <FaAward className="text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {userStats?.highestScore ? Math.round(userStats.highestScore) + '%' : '0%'}
                  </div>
                  <div className="text-gray-600 text-sm">Highest Score</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <FaUser className="text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {userStats?.recentAnalyses?.length || 0}
                  </div>
                  <div className="text-gray-600 text-sm">Recent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;