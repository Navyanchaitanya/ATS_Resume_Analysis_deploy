import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaBriefcase, FaMapMarkerAlt, FaEdit, FaQuestionCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL } from '../App';

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profession: '',
    location: '',
    bio: '',
    security_question: '',
    security_answer: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.security_question || !formData.security_answer) {
      setError('Security question and answer are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccessMessage('Registration successful! You can now login.');
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegister(data.token, data.user);
        
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const securityQuestions = [
    "What was your first pet's name?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite book?",
    "What was your childhood nickname?",
    "What is the name of your favorite teacher?",
    "What street did you grow up on?",
    "What is your favorite movie?",
    "What is your favorite sports team?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <FaExclamationTriangle className="mr-3" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input 
                name="name" 
                onChange={handleChange} 
                value={formData.name} 
                placeholder="Full Name" 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input 
                name="email" 
                type="email" 
                onChange={handleChange} 
                value={formData.email} 
                placeholder="Email" 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input 
                name="password" 
                type="password" 
                onChange={handleChange} 
                value={formData.password} 
                placeholder="Password" 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input 
                name="confirmPassword" 
                type="password" 
                onChange={handleChange} 
                value={formData.confirmPassword} 
                placeholder="Confirm Password" 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Security Question</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaQuestionCircle className="text-gray-400" />
              </div>
              <select
                name="security_question"
                onChange={handleChange}
                value={formData.security_question}
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                required
                disabled={loading}
              >
                <option value="">Select a security question</option>
                {securityQuestions.map((question, index) => (
                  <option key={index} value={question}>{question}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Security Answer</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaQuestionCircle className="text-gray-400" />
              </div>
              <input 
                name="security_answer"
                type="text"
                onChange={handleChange}
                value={formData.security_answer}
                placeholder="Your answer (remember this for password reset)"
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Profession (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaBriefcase className="text-gray-400" />
              </div>
              <input 
                name="profession" 
                onChange={handleChange} 
                value={formData.profession} 
                placeholder="e.g., Software Engineer" 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Location (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <input 
                name="location" 
                onChange={handleChange} 
                value={formData.location} 
                placeholder="e.g., San Francisco, CA" 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Bio (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                <FaEdit className="text-gray-400" />
              </div>
              <textarea 
                name="bio" 
                onChange={handleChange} 
                value={formData.bio} 
                placeholder="Tell us about yourself..." 
                className="w-full border pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Login here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;