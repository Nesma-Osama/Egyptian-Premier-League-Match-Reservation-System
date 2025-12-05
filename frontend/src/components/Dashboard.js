import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const authToken = localStorage.getItem("token");

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    birthDate: user?.birthDate ? user.birthDate.split("T")[0] : "",
    gender: user?.gender || "",
    city: user?.city || "",
    address: user?.address || "",
    password: "",
    confirmPassword: "",
  });

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Open profile modal
  const openProfileModal = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      birthDate: user?.birthDate ? user.birthDate.split("T")[0] : "",
      gender: user?.gender || "",
      city: user?.city || "",
      address: user?.address || "",
      password: "",
      confirmPassword: "",
    });
    setEditMode(false);
    setShowProfileModal(true);
    setProfileError("");
    setProfileSuccess("");
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setProfileError("");
    setProfileSuccess("");
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form - UPDATED to make city optional
  const validateForm = () => {
    setProfileError("");

    // Required fields
    if (formData.firstName.trim() === "") {
      setProfileError("First name cannot be empty");
      return false;
    }

    if (formData.lastName.trim() === "") {
      setProfileError("Last name cannot be empty");
      return false;
    }

    // Optional fields - only validate if provided
    if (formData.gender && !["M", "F"].includes(formData.gender)) {
      setProfileError("Gender must be Male or Female");
      return false;
    }

    // City is now optional - no validation needed

    // If password is being changed
    if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 6) {
        setProfileError("Password must be at least 6 characters");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setProfileError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const updateData = {};

      // Only include non-empty fields
      if (formData.firstName.trim()) {
        updateData.firstName = formData.firstName.trim();
      }
      if (formData.lastName.trim()) {
        updateData.lastName = formData.lastName.trim();
      }
      if (formData.birthDate) {
        updateData.birthDate = formData.birthDate;
      }
      if (formData.gender) {
        updateData.gender = formData.gender;
      }
      if (formData.city.trim()) {
        updateData.city = formData.city.trim();
      }
      if (formData.address !== undefined) {
        updateData.address = formData.address.trim();
      }

      // Only include password if user wants to change it
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`http://localhost:3001/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response. Check backend logs.");
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const responseData = await res.json();
      const updatedUser = responseData.data || responseData;

      // Update auth context
      setUser(updatedUser);

      setProfileSuccess("Profile updated successfully!");

      setTimeout(() => {
        setShowProfileModal(false);
        setEditMode(false);
        // Reset form with updated data
        setFormData({
          firstName: updatedUser?.firstName || "",
          lastName: updatedUser?.lastName || "",
          birthDate: updatedUser?.birthDate
            ? updatedUser.birthDate.split("T")[0]
            : "",
          gender: updatedUser?.gender || "",
          city: updatedUser?.city || "",
          address: updatedUser?.address || "",
          password: "",
          confirmPassword: "",
        });
      }, 1500);
    } catch (err) {
      console.error("Update error:", err);
      setProfileError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Egyptian Premier League</h1>
        <div className="header-actions">
          <button
            className="profile-icon-btn"
            onClick={openProfileModal}
            title="Edit Profile"
          >
            👤
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>
            Welcome, {user?.firstName} {user?.lastName}!
          </h2>
          <div className="user-info">
            <p>
              <strong>Username:</strong> {user?.username}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Role:</strong> {user?.role}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {user?.isAuthorized ? (
                <span className="status-authorized">Authorized</span>
              ) : (
                <span className="status-pending">Pending Approval</span>
              )}
            </p>
          </div>

          {!user?.isAuthorized && (
            <div className="pending-message">
              <p>
                ⏳ Your account is waiting for admin approval. You'll be
                notified once approved.
              </p>
            </div>
          )}

          {user?.isAuthorized && (
            <div className="actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn">View Matches</button>
                <button
                  className="action-btn"
                  onClick={() => navigate("/my-reservations")}
                >
                  My Reservations
                </button>
                {user?.role === "Manager" && (
                  <button
                    className="action-btn"
                    onClick={() => navigate("/my-matches")}
                  >
                    Manage Matches
                  </button>
                )}
                {user?.role === "Manager" && (
                  <button
                    className="action-btn"
                    onClick={() => navigate("/my-stadiums")}
                  >
                    Manage Stadiums
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------
            PROFILE MODAL
        ---------------------- */}
      {showProfileModal && (
        <div className="modal-backdrop">
          <div className="profile-modal-box">
            <div className="profile-modal-header">
              <h3>My Profile</h3>
              <button
                className="close-btn"
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            {profileError && <div className="profile-error">{profileError}</div>}
            {profileSuccess && (
              <div className="profile-success">{profileSuccess}</div>
            )}

            <div className="profile-content">
              {!editMode ? (
                <>
                  <div className="profile-view">
                    <div className="profile-field">
                      <label>First Name</label>
                      <p>{user?.firstName}</p>
                    </div>
                    <div className="profile-field">
                      <label>Last Name</label>
                      <p>{user?.lastName}</p>
                    </div>
                    <div className="profile-field">
                      <label>Birth Date</label>
                      <p>
                        {user?.birthDate
                          ? new Date(user.birthDate).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="profile-field">
                      <label>Gender</label>
                      <p>{user?.gender === "M" ? "Male" : user?.gender === "F" ? "Female" : "—"}</p>
                    </div>
                    <div className="profile-field">
                      <label>City</label>
                      <p>{user?.city || "—"}</p>
                    </div>
                    <div className="profile-field">
                      <label>Address</label>
                      <p>{user?.address || "—"}</p>
                    </div>
                    <div className="profile-field">
                      <label>Username</label>
                      <p className="read-only">{user?.username}</p>
                    </div>
                    <div className="profile-field">
                      <label>Email</label>
                      <p className="read-only">{user?.email}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="First Name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Birth Date (Optional)</label>
                        <input
                          type="date"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Gender (Optional)</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City (Optional)</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Address (Optional)</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Address"
                      />
                    </div>

                    <div className="password-section">
                      <h4>Change Password (Optional)</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>New Password</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Leave blank to keep current"
                          />
                        </div>
                        <div className="form-group">
                          <label>Confirm Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="profile-modal-footer">
              {!editMode ? (
                <>
                  <button
                    onClick={toggleEditMode}
                    className="edit-profile-btn"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="close-modal-btn"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleUpdateProfile}
                    className="save-profile-btn"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={toggleEditMode}
                    className="cancel-profile-btn"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;