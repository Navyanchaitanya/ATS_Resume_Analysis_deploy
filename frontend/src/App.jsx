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
  const [userToken, setUserToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    setUserToken(localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserToken(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar token={userToken} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={!userToken ? <Home /> : <Navigate to="/home" />} />
          <Route path="/login" element={!userToken ? <Login onLogin={setUserToken} /> : <Navigate to="/home" />} />
          <Route path="/register" element={!userToken ? <Register onRegister={setUserToken} /> : <Navigate to="/home" />} />
          <Route path="/home" element={userToken ? <LoggedInHome /> : <Navigate to="/login" />} />

          {/* 👤 User profile */}
          <Route path="/profile" element={userToken ? <Profile token={userToken} /> : <Navigate to="/login" />} />

          {/* 📄 Resume scoring */}
          <Route path="/resume-score" element={userToken ? <ResumeScore token={userToken} /> : <Navigate to="/login" />} />

          {/* 🛠️ Resume builder (placeholder) */}
          <Route path="/resume-builder" element={userToken ? <ResumeBuilder /> : <Navigate to="/login" />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;