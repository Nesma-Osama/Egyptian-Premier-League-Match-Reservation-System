import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/matches');
      const data = await response.json();
      if (data.success) {
        setMatches(data.data);
      }
    } catch (err) {
      setError('Failed to load matches. Please try again later.');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchStatus = (match) => {
    if (match.state === 'Completed') return 'Completed';
    if (match.state === 'Cancelled') return 'Cancelled';
    if (match.availableSeats === 0) return 'Sold Out';
    if (new Date(match.matchDate) < new Date()) return 'In Progress';
    return 'Available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#28a745';
      case 'Sold Out': return '#dc3545';
      case 'Completed': return '#6c757d';
      case 'Cancelled': return '#dc3545';
      case 'In Progress': return '#ffc107';
      default: return '#007bff';
    }
  };

  if (loading) {
    return (
      <div className="home-page">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">⚽ Egyptian Premier League</h1>
          </div>
        </nav>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">⚽ Egyptian Premier League</h1>
          <div className="nav-buttons">
            {isAuthenticated ? (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => logout()}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/auth')}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Egyptian Premier League</h1>
          <p className="hero-subtitle">Book your tickets for the most exciting matches!</p>
        </div>
      </div>

      <div className="matches-container">
        <h2 className="section-title">Upcoming Matches</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {matches.length === 0 ? (
          <div className="no-matches">
            <p>No matches available at the moment. Check back later!</p>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map((match) => {
              const status = getMatchStatus(match);
              return (
                <div key={match._id} className="match-card">
                  <div className="match-header">
                    <span 
                      className="match-status"
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {status}
                    </span>
                  </div>
                  
                  <div className="match-teams">
                    <div className="team home-team">
                      <h3>{match.homeTeam}</h3>
                      <span className="team-label">Home</span>
                    </div>
                    
                    <div className="vs-divider">
                      <span>VS</span>
                    </div>
                    
                    <div className="team away-team">
                      <h3>{match.awayTeam}</h3>
                      <span className="team-label">Away</span>
                    </div>
                  </div>

                  <div className="match-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">{formatDate(match.matchDate)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">🏟️</span>
                      <span className="detail-text">{match.stadium.name}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">👨‍⚖️</span>
                      <span className="detail-text">Referee: {match.referee}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">🎫</span>
                      <span className="detail-text">
                        Available Seats: {match.availableSeats} / {match.totalSeats}
                      </span>
                    </div>
                  </div>

                  <div className="match-footer">
                    <button 
                      className="btn-book"
                      onClick={() => {
                        if (isAuthenticated && user?.isAuthorized) {
                          navigate(`/book-match/${match._id}`);
                        } else if (isAuthenticated && !user?.isAuthorized) {
                        } else {
                          navigate('/auth');
                        }
                      }}
                      disabled={
                        status === 'Sold Out' || 
                        status === 'Completed' || 
                        status === 'Cancelled' ||
                        (isAuthenticated && !user?.isAuthorized)
                      }
                    >
                      {status === 'Sold Out' ? 'Sold Out' : 
                       status === 'Completed' ? 'Match Ended' :
                       status === 'Cancelled' ? 'Cancelled' :
                       isAuthenticated && !user?.isAuthorized ? 'Waiting for Approval' :
                       isAuthenticated ? 'Book Now' : 'Login to Book'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="footer">
        <p>&copy; 2025 Egyptian Premier League. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
