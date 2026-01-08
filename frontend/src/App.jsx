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
// Added these routes for admin panel 
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
// Removed Settings import since we don't have the file
// import Settings from './pages/admin/Settings';
// import UserDetail from './pages/admin/UserDetail';
// import AnalysisDetail from './pages/admin/AnalysisDetail';


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
            {/* Public Routes */}
            <Route path="/" element={!userToken ? <Home /> : <Navigate to="/home" />} />
            <Route path="/login" element={!userToken ? <Login onLogin={handleLogin} /> : <Navigate to="/home" />} />
            <Route path="/register" element={!userToken ? <Register onRegister={handleLogin} /> : <Navigate to="/home" />} />
            
            {/* Protected User Routes */}
            <Route path="/home" element={userToken ? <LoggedInHome token={userToken} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={userToken ? <Profile token={userToken} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/resume-score" element={userToken ? <ResumeScore token={userToken} /> : <Navigate to="/login" />} />
            <Route path="/resume-builder" element={userToken ? <ResumeBuilder /> : <Navigate to="/login" />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              {/* Comment out or remove routes for files that don't exist yet */}
              {/* <Route path="users/:id" element={<UserDetail />} /> */}
              {/* <Route path="analyses" element={<Analyses />} /> */}
              {/* <Route path="analyses/:id" element={<AnalysisDetail />} /> */}
              {/* <Route path="settings" element={<Settings />} /> */}
            </Route>
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;