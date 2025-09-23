import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './components/Profile';
import ResumeScore from './components/ResumeScore';
import ResumeBuilder from './components/ResumeBuilder';
import LoggedInHome from './pages/LoggedInHome';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Auto-detect API URL for Render production
export const API_BASE_URL = window.location.origin;

function App() {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token) setUserToken(token);
    if (user) {
      try {
        setUserData(JSON.parse(user));
      } catch (error) {
        localStorage.removeItem('user');
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

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar token={userToken} userData={userData} onLogout={handleLogout} />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={!userToken ? <Home /> : <Navigate to="/home" />} />
            <Route path="/login" element={!userToken ? <Login onLogin={handleLogin} /> : <Navigate to="/home" />} />
            <Route path="/register" element={!userToken ? <Register onRegister={handleLogin} /> : <Navigate to="/home" />} />
            <Route path="/home" element={userToken ? <LoggedInHome token={userToken} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={userToken ? <Profile token={userToken} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/resume-score" element={userToken ? <ResumeScore token={userToken} /> : <Navigate to="/login" />} />
            <Route path="/resume-builder" element={userToken ? <ResumeBuilder /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;