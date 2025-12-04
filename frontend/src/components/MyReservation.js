import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./matches.css";

const MyReservation = () => {
  const { user, logout } = useAuth() || {};
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authToken = localStorage.getItem("token");
  const handleCancelSeat = async (reservationId, seatId, matchDate) => {
    const now = new Date();
    if (new Date(matchDate) <= now) {
      alert("You cannot cancel this seat because the match already started.");
      return;
    }
    if (!window.confirm("Are you sure you want to cancel this seat?")) return;
    try {
      const res = await fetch(
        `http://localhost:3001/api/reservations/${reservationId}/seat/${seatId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Cancel failed");
      }
      const updatedReservation = await res.json();
      setReservations((prev) => {
        if (!updatedReservation || !updatedReservation._id) {
          return prev.filter((r) => r._id !== reservationId);
        }
        return prev.map((r) =>
          r._id === updatedReservation._id ? updatedReservation : r
        );
      });
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("http://localhost:3001/api/reservations", {
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        console.log(res);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Fetch failed: ${res.status}`);
        }

        const data = await res.json();
        setReservations(data);
      } catch (err) {
        setError(err.message || "Failed to load reservations");
      } finally {
        setLoading(false);
      }
    };

    if (!user && !authToken) {
      setLoading(false);
      setError("Not authenticated. Please login.");
      return;
    }
    fetchReservations();
  }, [user, authToken]);

  if (loading)
    return <div className="matches-wrap">Loading your reservations...</div>;
  if (error)
    return (
      <div className="matches-wrap">
        <div className="error">{error}</div>
        <button onClick={() => logout?.()}>Logout</button>
      </div>
    );

  if (!reservations.length) {
    return <div className="matches-wrap">You have no reservations yet.</div>;
  }

  return (
    <div className="matches-wrap">
      <h2 className="page-title">My Reservations</h2>

      <div className="matches-list">
        {reservations.map((r) => {
          const match = r.match || {};
          const seats = r.seats || [];
          const matchDate = match.matchDate ? new Date(match.matchDate) : null;
          return (
            <div className="matches-card" key={r._id}>
              <div className="matches-header">
                <div className="teams">
                  <span className="team">Team {match.homeTeam}</span>
                  <span className="vs">vs</span>
                  <span className="team">Team{match.awayTeam}</span>
                </div>
                <div className="date">
                  {matchDate ? matchDate.toLocaleString() : "Date TBA"}
                </div>
              </div>

              <div className="matches-body">
                <div className="info-row">
                  <strong>Stadium:</strong>{" "}
                  {match.stadium ? match.stadium.name : "—"}
                </div>

                <div className="info-row">
                  <strong>Referee:</strong> {match.referee || "—"}
                </div>

                <div className="seats-section">
                  <strong>Seats:</strong>
                  <div className="seats-list">
                    {seats.length ? (
                      seats.map((s) => (
                        <div
                          className={`seat-state ${
                            s.state === "reserved"
                              ? "seat-reserved"
                              : "seat-vacant"
                          }`}
                          key={s._id}
                        >
                          Row {s.vipRow} • #{s.seatNumber}
                          {matchDate && new Date(matchDate) > new Date() && (
                            <button
                              className="cancel-seat"
                              onClick={() =>
                                handleCancelSeat(r._id, s._id, matchDate)
                              }
                            >
                              ✖
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                </div>

                <div className="amount-row">
                  <strong>Total:</strong> ${r.totalAmount?.toFixed(2) ?? "0.00"}
                </div>
              </div>

              <div className="matches-footer">
                <small>
                  Reservation created: {new Date(r.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyReservation;
