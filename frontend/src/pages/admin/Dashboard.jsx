///frontend/src/pages/admin/Dashboard.jsx


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const [statsRes, usersRes, analysesRes] = await Promise.all([
        axios.get('/api/admin/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/users?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/analyses?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.stats);
      setRecentUsers(usersRes.data.users);
      setRecentAnalyses(analysesRes.data.analyses);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75"
          color="blue"
          change="+12%"
        />
        <StatCard
          title="Total Analyses"
          value={stats?.totalAnalyses || 0}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="green"
          change="+23%"
        />
        <StatCard
          title="Recent Users"
          value={stats?.recentUsers || 0}
          icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          color="purple"
          change="+8%"
        />
        <StatCard
          title="Avg. Score"
          value={stats?.averageScore || '0.00'}
          icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          color="orange"
          suffix="/100"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
              <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        {user.is_admin && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
              <Link to="/admin/analyses" className="text-sm text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAnalyses.length > 0 ? (
              recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {analysis.filename}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {analysis.user?.name || 'Unknown User'}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${analysis.total_score >= 70 ? 'bg-green-500' : analysis.total_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <span className="text-sm font-semibold text-gray-900">
                            {analysis.total_score}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/100</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {analysis.keyword_match_percentage || 0}% match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No analyses found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">Manage Users</h4>
                <p className="text-sm text-gray-500 mt-1">View and manage all users</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/admin/analyses"
            className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:border-green-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">View Analyses</h4>
                <p className="text-sm text-gray-500 mt-1">All resume analysis data</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/admin/settings"
            className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">System Settings</h4>
                <p className="text-sm text-gray-500 mt-1">Configure admin settings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, change, suffix }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center">
        <div className={`${iconBgClasses[color]} p-3 rounded-lg`}>
          <svg className={`h-6 w-6 ${iconColorClasses[color]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {suffix && <span className="ml-1 text-sm text-gray-500">{suffix}</span>}
          </div>
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
          <span className="text-sm text-gray-500 ml-2">from last week</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;