import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./MyStadiums.css";

const MyStadiums = () => {
  const { user, logout } = useAuth() || {};
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authToken = localStorage.getItem("token");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStadium, setCurrentStadium] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    vipRows: "",
    seatsPerRow: "",
  });

  useEffect(() => {
    const fetchStadiums = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("http://localhost:3001/api/manager/stadiums", {
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Fetch failed: ${res.status}`);
        }

        const data = await res.json();
        setStadiums(data.data || data);
      } catch (err) {
        setError(err.message || "Failed to load stadiums");
      } finally {
        setLoading(false);
      }
    };

    if (!user && !authToken) {
      setLoading(false);
      setError("Not authenticated. Please login.");
      return;
    }

    fetchStadiums();
  }, [user, authToken]);

  // ----------------------------
  // MODAL: CREATE STADIUM
  // ----------------------------
  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: "",
      vipRows: "",
      seatsPerRow: "",
    });
    setShowModal(true);
  };

  // ----------------------------
  // MODAL: EDIT STADIUM
  // ----------------------------
  const openEditModal = (stadium) => {
    setEditMode(true);
    setCurrentStadium(stadium);

    setFormData({
      name: stadium.name,
      vipRows: stadium.vipRows.toString(),
      seatsPerRow: stadium.seatsPerRow.toString(),
    });

    setShowModal(true);
  };

  // ----------------------------
  // SUBMIT (CREATE + EDIT)
  // ----------------------------
  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim() || !formData.vipRows || !formData.seatsPerRow) {
      alert("Please fill in all fields");
      return;
    }

    if (Number(formData.vipRows) < 1 || Number(formData.seatsPerRow) < 1) {
      alert("VIP Rows and Seats Per Row must be at least 1");
      return;
    }

    const url = editMode
      ? `http://localhost:3001/api/manager/stadiums/${currentStadium._id}`
      : `http://localhost:3001/api/manager/stadiums`;

    const method = editMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          vipRows: Number(formData.vipRows),
          seatsPerRow: Number(formData.seatsPerRow),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save stadium");
      }

      setShowModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------
  // DELETE STADIUM
  // ----------------------------
  const handleDelete = async (stadiumId) => {
    if (window.confirm("Are you sure you want to delete this stadium?")) {
      try {
        const res = await fetch(`http://localhost:3001/api/manager/stadiums/${stadiumId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to delete stadium");

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
    return <div className="stadiums-wrap">Loading your stadiums...</div>;
  if (error)
    return (
      <div className="stadiums-wrap">
        <div className="error">{error}</div>
        <button onClick={() => logout?.()}>Logout</button>
      </div>
    );

  // ----------------------------
  // MAIN RETURN
  // ----------------------------
  return (
    <div className="stadiums-wrap">
      <h2 className="page-title">My Stadiums</h2>

      {/* Create Stadium Button */}
      <button onClick={openCreateModal} className="create-btn">
        + Create Stadium
      </button>

      {!stadiums.length ? (
        <div>No stadiums created yet.</div>
      ) : (
        <div className="stadiums-list">
          {stadiums.map((stadium) => {
            const totalCapacity = stadium.vipRows * stadium.seatsPerRow;

            return (
              <div className="stadiums-card" key={stadium._id}>
                <div className="stadiums-header">
                  <div className="stadium-name">{stadium.name}</div>
                  <div className="capacity-badge">{totalCapacity} seats</div>
                </div>

                <div className="stadiums-body">
                  <div className="edit-delete-btns">
                    <button
                      className="edit-stadium"
                      onClick={() => openEditModal(stadium)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-stadium"
                      onClick={() => handleDelete(stadium._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="info-row">
                    <strong>VIP Rows:</strong> {stadium.vipRows}
                  </div>

                  <div className="info-row">
                    <strong>Seats Per Row:</strong> {stadium.seatsPerRow}
                  </div>

                  <div className="info-row">
                    <strong>Total Capacity:</strong> {totalCapacity} seats
                  </div>
                </div>

                <div className="stadiums-footer">
                  <small>
                    Created at: {new Date(stadium.createdAt).toLocaleString()}
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
            <h3>{editMode ? "Edit Stadium" : "Create Stadium"}</h3>

            <div className="modal-form">
              <input
                placeholder="Stadium Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="VIP Rows"
                min="1"
                value={formData.vipRows}
                onChange={(e) =>
                  setFormData({ ...formData, vipRows: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Seats Per Row"
                min="1"
                value={formData.seatsPerRow}
                onChange={(e) =>
                  setFormData({ ...formData, seatsPerRow: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleSubmit} className="save-btn">
                {editMode ? "Save Changes" : "Create Stadium"}
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

export default MyStadiums;