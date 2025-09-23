import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaExclamationTriangle, FaArrowLeft, FaQuestionCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { API_BASE_URL } from '../App';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    security_answer: '',
    reset_token: '',
    new_password: '',
    confirm_password: ''
  });
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordData({ ...forgotPasswordData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
        navigate('/home');
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSecurityQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/get-security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordData.email })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.has_user) {
          setSecurityQuestion(data.security_question);
          setForgotPasswordStep(2);
          setForgotPasswordStatus('');
        } else {
          setForgotPasswordStatus('If this email exists in our system, you will be able to reset your password.');
        }
      } else {
        setError(data.error || 'Failed to get security question');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again later.');
      console.error('Security question error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurityAnswer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-security-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotPasswordData.email,
          security_answer: forgotPasswordData.security_answer
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setForgotPasswordData(prev => ({ ...prev, reset_token: data.reset_token }));
        setForgotPasswordStep(3);
        setForgotPasswordStatus('Security answer verified. You can now reset your password.');
      } else {
        setError(data.error || 'Please provide a valid security answer.');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again later.');
      console.error('Security answer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (forgotPasswordData.new_password !== forgotPasswordData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (forgotPasswordData.new_password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_token: forgotPasswordData.reset_token,
          new_password: forgotPasswordData.new_password,
          confirm_password: forgotPasswordData.confirm_password
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setForgotPasswordStatus('Password reset successfully! You can now login with your new password.');
        setForgotPasswordStep(4);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again later.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPasswordFlow = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotPasswordData({
      email: '',
      security_answer: '',
      reset_token: '',
      new_password: '',
      confirm_password: ''
    });
    setSecurityQuestion('');
    setForgotPasswordStatus('');
    setError('');
  };

  const renderForgotPasswordStep = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <form onSubmit={handleGetSecurityQuestion} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input 
                  name="email"
                  type="email" 
                  value={forgotPasswordData.email}
                  onChange={handleForgotPasswordChange}
                  placeholder="Enter your registered email" 
                  className="w-full border border-gray-300 pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                  disabled={loading}
                />
              </div>
            </div>
            
            {forgotPasswordStatus && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg">
                {forgotPasswordStatus}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifySecurityAnswer} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Security Question</label>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-gray-800 font-medium">{securityQuestion}</p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Your Answer</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaQuestionCircle className="text-gray-400" />
                </div>
                <input 
                  name="security_answer"
                  type="text" 
                  value={forgotPasswordData.security_answer}
                  onChange={handleForgotPasswordChange}
                  placeholder="Enter your answer" 
                  className="w-full border border-gray-300 pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
              {loading ? 'Verifying...' : 'Verify Answer'}
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input 
                  name="new_password"
                  type="password" 
                  value={forgotPasswordData.new_password}
                  onChange={handleForgotPasswordChange}
                  placeholder="Enter new password (min. 6 characters)" 
                  className="w-full border border-gray-300 pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input 
                  name="confirm_password"
                  type="password" 
                  value={forgotPasswordData.confirm_password}
                  onChange={handleForgotPasswordChange}
                  placeholder="Confirm new password" 
                  className="w-full border border-gray-300 pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        );

      case 4:
        return (
          <div className="text-center py-6">
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">Password Reset Successful!</h3>
            <p className="text-gray-600 mb-6">{forgotPasswordStatus}</p>
            <button
              onClick={resetForgotPasswordFlow}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
        >
          <button
            onClick={resetForgotPasswordFlow}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Login
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {forgotPasswordStep === 1 ? 'Reset Your Password' :
             forgotPasswordStep === 2 ? 'Security Verification' :
             forgotPasswordStep === 3 ? 'Create New Password' :
             'Success!'}
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
              <FaExclamationTriangle className="mr-3 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {forgotPasswordStatus && !error && forgotPasswordStep !== 4 && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {forgotPasswordStatus}
            </div>
          )}

          {renderForgotPasswordStep()}

          {forgotPasswordStep !== 4 && (
            <div className="mt-6 text-center">
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      step === forgotPasswordStep
                        ? 'bg-blue-600'
                        : step < forgotPasswordStep
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Step {forgotPasswordStep} of 3
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login to Your Account</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <FaExclamationTriangle className="mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input 
                name="email" 
                type="email" 
                onChange={handleChange} 
                value={formData.email} 
                placeholder="Enter your email" 
                className="w-full border border-gray-300 pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input 
                name="password" 
                type="password" 
                onChange={handleChange} 
                value={formData.password} 
                placeholder="Enter your password" 
                className="w-full border border-gray-300 pl-10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </form>

        <div className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold transition-colors">
            Create account here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;