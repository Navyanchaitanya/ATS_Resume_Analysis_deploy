import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          name: data.name,
          email: data.email,
          profession: data.profession,
          location: data.location,
          bio: data.bio
        }));
        onLogin(data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running on port 5000.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold text-center">Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 mb-2">Email</label>
          <input 
            name="email" 
            type="email" 
            onChange={handleChange} 
            value={formData.email} 
            placeholder="Email" 
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300" 
            required 
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Password</label>
          <input 
            name="password" 
            type="password" 
            onChange={handleChange} 
            value={formData.password} 
            placeholder="Password" 
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:border-blue-300" 
            required 
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Register here
          </a>
        </p>
      </form>
    </div>
  );
}

export default Login;