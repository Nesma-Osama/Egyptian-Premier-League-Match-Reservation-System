import React from "react";
import { useAuth } from "./context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./components/HomePage";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import MyReservation from "./components/MyReservation";
import MyMatches from "./components/MyMatches";
import MyStadiums from "./components/MyStadiums";
import BookMatch from "./components/BookMatch";

import "./App.css";

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      
      <Route
        path="/auth"
        element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />}
      />
      
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            user?.role === "Admin" ? (
              <AdminDashboard />
            ) : (
              <Dashboard />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      
      <Route
        path="/my-reservations"
        element={
          isAuthenticated && user?.role !== "Admin" ? (
            <MyReservation />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      
      <Route
        path="/book-match/:matchId"
        element={
          isAuthenticated ? (
            <BookMatch />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      
      <Route
        path="/my-matches"
        element={
          isAuthenticated && user?.role === "Manager" ? (
            <MyMatches />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      
      <Route
        path="/my-stadiums"
        element={
          isAuthenticated && user?.role === "Manager" ? (
            <MyStadiums />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
    </Routes>
  );
}

export default App;
