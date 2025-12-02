import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const statsData = await adminService.getStats();
      setStats(statsData.stats);

      if (activeTab === 'pending') {
        const pendingData = await adminService.getPendingUsers();
        setPendingUsers(pendingData.users);
      } else {
        const allUsersData = await adminService.getAllUsers();
        setAllUsers(allUsersData.users);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (userId) => {
    try {
      await adminService.approveUser(userId);
      alert('User approved successfully!');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Are you sure you want to reject and delete this user?')) {
      try {
        await adminService.rejectUser(userId);
        alert('User rejected successfully!');
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to reject user');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        alert('User deleted successfully!');
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.firstName} {user?.lastName}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending Approval</h3>
            <p className="stat-number">{stats.pendingUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Managers</h3>
            <p className="stat-number">{stats.managers}</p>
          </div>
          <div className="stat-card">
            <h3>Fans</h3>
            <p className="stat-number">{stats.fans}</p>
          </div>
        </div>
      )}

      <div className="admin-content">
        <div className="tabs">
          <button 
            className={activeTab === 'pending' ? 'active' : ''} 
            onClick={() => setActiveTab('pending')}
          >
            Pending Users ({stats?.pendingUsers || 0})
          </button>
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            All Users
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="users-table-container">
            {activeTab === 'pending' && (
              pendingUsers.length === 0 ? (
                <div className="no-data">No pending users</div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>City</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user._id}>
                        <td>{user.username}</td>
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                        <td>{user.city}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleApprove(user._id)} 
                              className="approve-btn"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(user._id)} 
                              className="reject-btn"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'all' && (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>City</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                      <td>
                        <span className={`status-badge ${user.isAuthorized ? 'authorized' : 'pending'}`}>
                          {user.isAuthorized ? 'Authorized' : 'Pending'}
                        </span>
                      </td>
                      <td>{user.city}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        {user.role !== 'Admin' && (
                          <button 
                            onClick={() => handleDelete(user._id)} 
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
