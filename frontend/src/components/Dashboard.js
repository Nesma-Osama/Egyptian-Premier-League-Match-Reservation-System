import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.reload(); // Reload to show login page
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Egyptian Premier League</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.firstName} {user?.lastName}!</h2>
          <div className="user-info">
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>Status:</strong> {user?.isAuthorized ? 
              <span className="status-authorized">Authorized</span> : 
              <span className="status-pending">Pending Approval</span>
            }</p>
          </div>
          
          {!user?.isAuthorized && (
            <div className="pending-message">
              <p>⏳ Your account is waiting for admin approval. You'll be notified once approved.</p>
            </div>
          )}
          
          {user?.isAuthorized && (
            <div className="actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn">View Matches</button>
                <button className="action-btn">My Reservations</button>
                {user?.role === 'Manager' && <button className="action-btn">Manage Matches</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
