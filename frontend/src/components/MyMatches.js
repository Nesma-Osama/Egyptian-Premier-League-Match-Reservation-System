import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./matches.css";

const REFEREES = [
  "John Smith",
  "Carlos Rodriguez",
  "Ahmed Hassan",
  "Marco Rossi",
  "Michel Platini",
  "Howard Webb",
  "Pierluigi Collina",
  "Gianluca Rocchi",
  "Andre Marriner",
  "Clattenburg Mark",
];

const MyMatches = () => {
  const { user, logout } = useAuth() || {};
  const [matches, setMatches] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authToken = localStorage.getItem("token");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    homeTeam: "",
    awayTeam: "",
    matchDate: "",
    stadium: "",
    referee: "",
    linesmen: "",
  });

  // Fetch matches and stadiums
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch matches
        const matchRes = await fetch("http://localhost:3001/api/manager/matches", {
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });

        if (!matchRes.ok) {
          const text = await matchRes.text();
          throw new Error(text || `Fetch failed: ${matchRes.status}`);
        }

        const matchData = await matchRes.json();
        setMatches(matchData.data || matchData);

        // Fetch stadiums
        const stadiumRes = await fetch("http://localhost:3001/api/manager/stadiums", {
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });

        if (!stadiumRes.ok) {
          throw new Error("Failed to fetch stadiums");
        }

        const stadiumData = await stadiumRes.json();
        setStadiums(stadiumData.data || stadiumData);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (!user && !authToken) {
      setLoading(false);
      setError("Not authenticated. Please login.");
      return;
    }

    fetchData();
  }, [user, authToken]);

  // ----------------------------
  // MODAL: CREATE MATCH
  // ----------------------------
  const openCreateModal = () => {
    setEditMode(false);
    setFormError("");
    setFormData({
      homeTeam: "",
      awayTeam: "",
      matchDate: "",
      stadium: "",
      referee: "",
      linesmen: "",
    });
    setShowModal(true);
  };

  // ----------------------------
  // MODAL: EDIT MATCH
  // ----------------------------
  const openEditModal = (match) => {
    setEditMode(true);
    setFormError("");
    setCurrentMatch(match);

    setFormData({
      homeTeam: match.homeTeam.toString(),
      awayTeam: match.awayTeam.toString(),
      matchDate: match.matchDate?.slice(0, 16),
      stadium: match.stadium?._id || "",
      referee: match.referee || "",
      linesmen: match.linesmen?.join(", ") || "",
    });

    setShowModal(true);
  };

  // ----------------------------
  // VALIDATION
  // ----------------------------
  const validateForm = () => {
    setFormError("");

    if (!formData.homeTeam || !formData.awayTeam) {
      setFormError("Please select both teams");
      return false;
    }

    if (Number(formData.homeTeam) === Number(formData.awayTeam)) {
      setFormError("Home team and away team must be different");
      return false;
    }

    if (!formData.matchDate) {
      setFormError("Please select a match date");
      return false;
    }

    if (!formData.stadium) {
      setFormError("Please select a stadium");
      return false;
    }

    if (!formData.referee) {
      setFormError("Please select a referee");
      return false;
    }

    if (!formData.linesmen) {
      setFormError("Please enter linesmen names (comma separated)");
      return false;
    }

    const linesmenArray = formData.linesmen.split(",").map((s) => s.trim());
    if (linesmenArray.length !== 2) {
      setFormError("Please enter exactly 2 linesmen");
      return false;
    }

    if (
      linesmenArray[0] === linesmenArray[1] ||
      linesmenArray.includes(formData.referee)
    ) {
      setFormError("Linesmen must be unique and different from referee");
      return false;
    }

    return true;
  };

  // ----------------------------
  // SUBMIT (CREATE + EDIT)
  // ----------------------------
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const url = editMode
      ? `http://localhost:3001/api/manager/matches/${currentMatch._id}`
      : `http://localhost:3001/api/manager/matches`;

    const method = editMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          homeTeam: Number(formData.homeTeam),
          awayTeam: Number(formData.awayTeam),
          matchDate: formData.matchDate,
          stadium: formData.stadium,
          referee: formData.referee,
          linesmen: formData.linesmen,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save match");
      }

      setShowModal(false);
      window.location.reload();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // ----------------------------
  // DELETE MATCH
  // ----------------------------
  const handleDelete = async (matchId) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        const res = await fetch(
          `http://localhost:3001/api/manager/matches/${matchId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to delete match");

        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // ----------------------------
  // UI STATES
  // ----------------------------
  if (loading)
    return <div className="matches-wrap">Loading your matches...</div>;
  if (error)
    return (
      <div className="matches-wrap">
        <div className="error">{error}</div>
        <button onClick={() => logout?.()}>Logout</button>
      </div>
    );

  // ----------------------------
  // MAIN RETURN
  // ----------------------------
  return (
    <div className="matches-wrap">
      <h2 className="page-title">My Matches</h2>

      {/* Create Match Button */}
      <button onClick={openCreateModal} className="create-btn">
        + Create Match
      </button>

      {!matches.length ? (
        <div>No matches created yet.</div>
      ) : (
        <div className="matches-list">
          {matches.map((match) => {
            const matchDate = match.matchDate
              ? new Date(match.matchDate)
              : null;

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
                  <div className="match-actions">
                    {match.state !== "Completed" && (
                      <>
                        <button
                          className="edit-match"
                          onClick={() => openEditModal(match)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="delete-match"
                          onClick={() => handleDelete(match._id)}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>

                  <div className="info-row">
                    <strong>Stadium:</strong> {match.stadium?.name || "—"}
                  </div>

                  <div className="info-row">
                    <strong>Referee:</strong> {match.referee || "—"}
                  </div>

                  <div className="info-row">
                    <strong>Linesmen:</strong>{" "}
                    {match.linesmen?.length
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
      )}

      {/* ---------------------
            MODAL UI
        ---------------------- */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>{editMode ? "Edit Match" : "Create Match"}</h3>

            {formError && <div className="form-error">{formError}</div>}

            <div className="modal-form">
              <select
                value={formData.homeTeam}
                onChange={(e) =>
                  setFormData({ ...formData, homeTeam: e.target.value })
                }
              >
                <option value="">Select Home Team</option>
                {[...Array(18)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Team {i + 1}
                  </option>
                ))}
              </select>

              <select
                value={formData.awayTeam}
                onChange={(e) =>
                  setFormData({ ...formData, awayTeam: e.target.value })
                }
              >
                <option value="">Select Away Team</option>
                {[...Array(18)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Team {i + 1}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={formData.matchDate}
                onChange={(e) =>
                  setFormData({ ...formData, matchDate: e.target.value })
                }
              />

              <select
                value={formData.stadium}
                onChange={(e) =>
                  setFormData({ ...formData, stadium: e.target.value })
                }
              >
                <option value="">Select Stadium</option>
                {stadiums.map((stadium) => (
                  <option key={stadium._id} value={stadium._id}>
                    {stadium.name}
                  </option>
                ))}
              </select>

              <select
                value={formData.referee}
                onChange={(e) =>
                  setFormData({ ...formData, referee: e.target.value })
                }
              >
                <option value="">Select Referee</option>
                {REFEREES.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>

              <input
                placeholder="Linesmen (comma separated, e.g. John Doe, Jane Smith)"
                value={formData.linesmen}
                onChange={(e) =>
                  setFormData({ ...formData, linesmen: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleSubmit} className="save-btn">
                {editMode ? "Save Changes" : "Create Match"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMatches;