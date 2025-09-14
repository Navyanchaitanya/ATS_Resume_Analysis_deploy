import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FaUser, 
  FaEnvelope, 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaSave,
  FaTimes,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaAward,
  FaGraduationCap,
  FaStar,
  FaRocket,
  FaMagic,
  FaExclamationCircle,
  FaSync,
  FaFileAlt
} from 'react-icons/fa';

const Profile = ({ token }) => {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    profession: '',
    location: '',
    bio: '',
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
    skills: ''
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState(null);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchUserStats();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });
      
      const userData = response.data;
      setUser(userData);
      setForm({
        name: userData.name || '',
        profession: userData.profession || '',
        location: userData.location || '',
        bio: userData.bio || '',
        linkedin: userData.linkedin || '',
        github: userData.github || '',
        twitter: userData.twitter || '',
        website: userData.website || '',
        skills: userData.skills || ''
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data. Please try again.');
      
      setUser({ 
        email: 'user@example.com',
        name: '',
        profession: '',
        location: '',
        bio: ''
      });
      
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const response = await axios.get('http://localhost:5000/api/user-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });
      
      setUserStats(response.data);
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStatsError('Failed to load statistics data.');
      
      setUserStats({
        totalAnalyses: 0,
        averageScore: 0,
        highestScore: 0,
        recentAnalyses: []
      });
      
    } finally {
      setStatsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      const response = await axios.put('http://localhost:5000/api/profile', form, {
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

  const getSkillsArray = () => {
    return form.skills ? form.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyek0yIDM0aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnoiIHN0cm9rZT0iI2VlZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMiIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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

        {statsError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded-lg mb-6 flex items-center">
            <FaExclamationCircle className="mr-3 text-yellow-500" />
            <div className="flex-1">
              <strong className="font-bold">Stats Error: </strong>
              {statsError}
            </div>
            <button
              onClick={fetchUserStats}
              className="ml-4 bg-yellow-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
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
              </div>

              {/* Stats - REAL DATA FROM API */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl backdrop-blur-sm">
                  <FaFileAlt className="text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {statsLoading ? (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      userStats?.totalAnalyses || 0
                    )}
                  </div>
                  <div className="text-gray-600 text-sm">Resumes Analyzed</div>
                </div>
                
                <div className="text-center p-4 bg-cyan-50 rounded-xl backdrop-blur-sm">
                  <FaStar className="text-cyan-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {statsLoading ? (
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      userStats?.averageScore ? Math.round(userStats.averageScore) + '%' : '0%'
                    )}
                  </div>
                  <div className="text-gray-600 text-sm">Avg. Score</div>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-xl backdrop-blur-sm">
                  <FaAward className="text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">
                    {statsLoading ? (
                      <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      userStats?.highestScore ? Math.round(userStats.highestScore) + '%' : '0%'
                    )}
                  </div>
                  <div className="text-gray-600 text-sm">Highest Score</div>
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* Bio & Skills Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaGraduationCap className="mr-3 text-cyan-500" />
                  About & Skills
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-600 mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className="text-gray-700 leading-relaxed">
                      {form.bio || 'No bio provided yet. Share something about yourself!'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">Skills (comma-separated)</label>
                  {isEditing ? (
                    <textarea
                      name="skills"
                      value={form.skills}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="e.g., JavaScript, React, Python, UI/UX Design"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getSkillsArray().map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {getSkillsArray().length === 0 && (
                        <span className="text-gray-500">No skills added yet</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaGlobe className="mr-3 text-green-500" />
                  Social Links
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['linkedin', 'github', 'twitter', 'website'].map((platform) => (
                  <div key={platform}>
                    <label className="block text-gray-600 mb-2 capitalize">
                      {platform === 'website' ? 'Personal Website' : platform}
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        name={platform}
                        value={form[platform]}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Your ${platform} URL`}
                      />
                    ) : (
                      <div className="text-gray-800 truncate">
                        {form[platform] || 'Not provided'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="text-center">
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 px-12 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-3 mx-auto"
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
                  <div className="text-green-600 mt-4 flex items-center justify-center">
                    <FaMagic className="mr-2" /> Profile updated successfully!
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
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white shadow-xl z-50"
        >
          <FaRocket />
        </button>
      </div>
    </div>
  );
};

export default Profile;