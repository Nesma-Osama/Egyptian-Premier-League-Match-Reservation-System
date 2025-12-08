import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BookMatch.css';

const BookMatch = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const authToken = localStorage.getItem('token');

  const [match, setMatch] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  
  const prevMatchData = useRef(null);
  const prevSeatsData = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (!user?.isAuthorized) {
      navigate('/dashboard');
      return;
    }
    
    fetchMatchDetails();
    
    pollingIntervalRef.current = setInterval(fetchMatchDetails, 5000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user]);

  const fetchMatchDetails = async () => {
    try {
      const matchResponse = await fetch('http://localhost:3001/api/matches');
      const matchJson = await matchResponse.json();
      const matchData = matchJson.data.find(m => m._id === matchId);
      
      if (!matchData) {
        setError('Match not found');
        if (loading) setLoading(false);
        return;
      }

      const seatsResponse = await fetch(
        `http://localhost:3001/api/matches/${matchId}/seats`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      const seatsJson = await seatsResponse.json();
      const seatsData = seatsJson.data || seatsJson;

      const matchChanged = JSON.stringify(matchData) !== JSON.stringify(prevMatchData.current);
      const seatsChanged = JSON.stringify(seatsData) !== JSON.stringify(prevSeatsData.current);
      
      if (matchChanged || seatsChanged) {
        setMatch(matchData);
        setSeats(seatsData);
        prevMatchData.current = matchData;
        prevSeatsData.current = seatsData;
      }

      if (loading) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching match details:', err);
      if (loading) {
        setError('Failed to load match details');
        setLoading(false);
      }
    }
  };

  const toggleSeatSelection = (seat) => {
    if (seat.state === 'reserved') return;

    const isSelected = selectedSeats.find(s => s._id === seat._id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s._id !== seat._id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getTotalAmount = () => {
    return selectedSeats.reduce((sum, seat) => sum + seat.ticketPrice, 0);
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    if (!window.confirm(`Confirm booking ${selectedSeats.length} seat(s) for $${getTotalAmount()}?`)) {
      return;
    }

    try {
      setBooking(true);
      const response = await fetch(
        'http://localhost:3001/api/reservations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            matchId,
            seatIds: selectedSeats.map(s => s._id),
            totalAmount: getTotalAmount()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed');
      }

      alert('Booking successful!');
      navigate('/my-reservations');
    } catch (err) {
      console.error('Booking error:', err);
      alert(err.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
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

  const groupSeatsByRow = () => {
    const grouped = {};
    seats.forEach(seat => {
      if (!grouped[seat.vipRow]) {
        grouped[seat.vipRow] = [];
      }
      grouped[seat.vipRow].push(seat);
    });
    
    Object.keys(grouped).forEach(row => {
      grouped[row].sort((a, b) => a.seatNumber - b.seatNumber);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="book-match-container">
        <div className="loading">Loading match details...</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="book-match-container">
        <div className="error-message">{error || 'Match not found'}</div>
        <button onClick={() => navigate('/')} className="btn-back">
          Back to Home
        </button>
      </div>
    );
  }

  const groupedSeats = groupSeatsByRow();

  return (
    <div className="book-match-container">
      <div className="book-match-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
        <h1>Book Your Seats</h1>
      </div>

      <div className="match-info-card">
        <div className="match-teams-header">
          <h2>{match.homeTeam} <span className="vs-text">VS</span> {match.awayTeam}</h2>
        </div>
        <div className="match-details-grid">
          <div className="detail">
            <span className="detail-label">📅 Date:</span>
            <span className="detail-value">{formatDate(match.matchDate)}</span>
          </div>
          <div className="detail">
            <span className="detail-label">🏟️ Stadium:</span>
            <span className="detail-value">{match.stadium.name}</span>
          </div>
          <div className="detail">
            <span className="detail-label">👨‍⚖️ Referee:</span>
            <span className="detail-value">{match.referee}</span>
          </div>
          <div className="detail">
            <span className="detail-label">🎫 Available:</span>
            <span className="detail-value">{match.availableSeats} / {match.totalSeats} seats</span>
          </div>
        </div>
      </div>

      <div className="seating-section">
        <div className="seating-legend">
          <div className="legend-item">
            <div className="seat-box available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="seat-box selected"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="seat-box reserved"></div>
            <span>Reserved</span>
          </div>
        </div>

        <div className="stadium-screen">SCREEN / FIELD</div>

        <div className="seats-grid">
          {Object.keys(groupedSeats).sort((a, b) => a - b).map(rowNum => (
            <div key={rowNum} className="seat-row">
              <div className="row-label">Row {rowNum}</div>
              <div className="seats-in-row">
                {groupedSeats[rowNum].map(seat => {
                  const isSelected = selectedSeats.find(s => s._id === seat._id);
                  const isReserved = seat.state === 'reserved';
                  
                  return (
                    <div
                      key={seat._id}
                      className={`seat ${isReserved ? 'reserved' : isSelected ? 'selected' : 'available'}`}
                      onClick={() => toggleSeatSelection(seat)}
                      title={`Row ${seat.vipRow}, Seat ${seat.seatNumber} - $${seat.ticketPrice}`}
                    >
                      {seat.seatNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="booking-summary">
          <div className="summary-content">
            <div className="summary-details">
              <h3>Booking Summary</h3>
              <div className="selected-seats-list">
                {selectedSeats.map(seat => (
                  <div key={seat._id} className="selected-seat-item">
                    Row {seat.vipRow}, Seat {seat.seatNumber} - ${seat.ticketPrice}
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <strong>Total Seats:</strong> {selectedSeats.length}
              </div>
              <div className="summary-total">
                <strong>Total Amount:</strong> ${getTotalAmount()}
              </div>
            </div>
            <button 
              className="btn-confirm-booking" 
              onClick={handleBooking}
              disabled={booking}
            >
              {booking ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookMatch;