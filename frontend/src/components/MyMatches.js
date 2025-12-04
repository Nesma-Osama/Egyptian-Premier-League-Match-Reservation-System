import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./matches.css";

const MyMatches = () => {
  const { user, logout } = useAuth() || {};
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authToken = localStorage.getItem("token");
  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("http://localhost:3001/api/manager/matches", {
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
        setMatches(data);
      } catch (err) {
        setError(err.message || "Failed to load mathces");
      } finally {
        setLoading(false);
      }
    };

    if (!user && !authToken) {
      setLoading(false);
      setError("Not authenticated. Please login.");
      return;
    }
    fetchMatches();
  }, [user, authToken]);

  if (loading)
    return <div className="matches-wrap">Loading your matches...</div>;
  if (error)
    return (
      <div className="matches-wrap">
        <div className="error">{error}</div>
        <button onClick={() => logout?.()}>Logout</button>
      </div>
    );

  if (!matches.length) {
    return <div className="matches-wrap">You have no matches yet.</div>;
  }

  return (
    <div className="matches-wrap">
      <h2 className="page-title">My Matches</h2>
      <div className="matches-list">
        {matches.map((match) => {
          const matchDate = match.matchDate ? new Date(match.matchDate) : null;
          return (
            <div className="matches-card" key={match._id}>
              <div className="matches-header">
                <div className="teams">
                  <span className="team">Team {match.homeTeam}</span>
                  <span className="vs">vs</span>
                  <span className="team">Team {match.awayTeam}</span>
                </div>
                <div className="date">
                  {matchDate ? matchDate.toLocaleString() : "Date TBA"}
                </div>
              </div>
              <div className="matches-body">
                {match.state !== "Completed" && (
                  <div className="action-row">
                    <button className="edit-match" >⚙</button>
                  </div>
                )}
                <div className="info-row">
                  <strong>Stadium:</strong> {match.stadium?.name || "—"}
                </div>
                <div className="info-row">
                  <strong>Referee:</strong> {match.referee || "—"}
                </div>
                <div className="info-row">
                  <strong>Linesmen:</strong>{" "}
                  {match.linesmen && match.linesmen.length
                    ? match.linesmen.join(" , ")
                    : "—"}
                </div>
                <div className="info-row">
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      match.state === "Completed" ? "done" : "scheduled"
                    }
                  >
                    {match.state}
                  </span>
                </div>
                <div className="stats-row">
                  <p>
                    <strong>Total Seats:</strong> {match.totalSeats}
                  </p>
                  <p>
                    <strong>Reserved Seats:</strong> {match.reservedSeats}
                  </p>
                  <p>
                    <strong>Total Revenue:</strong> ${match.totalRevenue}
                  </p>
                </div>
              </div>

              <div className="matches-footer">
                <small>
                  Created at: {new Date(match.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyMatches;
