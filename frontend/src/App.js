import React from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return (
      <div className="App">
        <AuthPage />
      </div>
    );
  }

  // Authenticated as Admin - show admin dashboard
  if (user?.role === 'Admin') {
    return (
      <div className="App">
        <AdminDashboard />
      </div>
    );
  }

  // Authenticated as regular user - show user dashboard
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;
