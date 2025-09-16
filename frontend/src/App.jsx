import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './components/Profile';
import ResumeScore from './components/ResumeScore';
import ResumeBuilder from './components/ResumeBuilder';
import LoggedInHome from './pages/LoggedInHome';
import Navbar from './components/Navbar';

function App() {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token) {
      setUserToken(token);
    }
    
    if (user) {
      try {
        setUserData(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('user');
        setUserData(null);
      }
    }
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUserToken(token);
    setUserData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserToken(null);
    setUserData(null);
  };

  // Reset Password Component
  const ResetPassword = () => {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
      }
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setMessage('');

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });

        const data = await res.json();
        
        if (res.ok) {
          setMessage('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setError(data.error || 'Password reset failed');
        }
      } catch (err) {
        setError('Cannot connect to server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Reset Password</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
              {message}
            </div>
          )}

          {token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="text-center text-gray-600">
              <p>Invalid or missing reset token.</p>
              <Link to="/login" className="text-blue-600 hover:underline">
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Email Verification Component
  const EmailVerification = () => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const verifyEmail = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setError('No verification token provided');
          setLoading(false);
          return;
        }

        try {
          const res = await fetch(`http://localhost:5000/api/verify-email?token=${token}`);
          const data = await res.json();
          
          if (res.ok) {
            setMessage(data.message || 'Email verified successfully!');
          } else {
            setError(data.error || 'Email verification failed');
          }
        } catch (err) {
          setError('Cannot connect to server. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      verifyEmail();
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Email Verification</h2>
          
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Verifying your email...</p>
            </div>
          ) : error ? (
            <>
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
              <Link to="/login" className="text-blue-600 hover:underline">
                Go to Login
              </Link>
            </>
          ) : (
            <>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                {message}
              </div>
              <Link to="/login" className="text-blue-600 hover:underline">
                Proceed to Login
              </Link>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar token={userToken} userData={userData} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={!userToken ? <Home /> : <Navigate to="/home" />} />
          <Route 
            path="/login" 
            element={!userToken ? <Login onLogin={handleLogin} /> : <Navigate to="/home" />} 
          />
          <Route 
            path="/register" 
            element={!userToken ? <Register onRegister={handleLogin} /> : <Navigate to="/home" />} 
          />
          <Route path="/home" element={userToken ? <LoggedInHome token={userToken} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={userToken ? <Profile token={userToken} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/resume-score" element={userToken ? <ResumeScore token={userToken} /> : <Navigate to="/login" />} />
          <Route path="/resume-builder" element={userToken ? <ResumeBuilder /> : <Navigate to="/login" />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;