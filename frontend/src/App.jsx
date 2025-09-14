// frontend/src/App.jsx
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
        // FIX: Add proper error handling for JSON parsing
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
          <Route path="/profile" element={userToken ? <Profile token={userToken} /> : <Navigate to="/login" />} />
          <Route path="/resume-score" element={userToken ? <ResumeScore token={userToken} /> : <Navigate to="/login" />} />
          <Route path="/resume-builder" element={userToken ? <ResumeBuilder /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );


  // Add this inside your App component return statement
<button 
  onClick={() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }}
  style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    background: 'red',
    color: 'white',
    padding: '10px',
    borderRadius: '5px'
  }}
>
  Clear Storage
</button>
}

export default App;