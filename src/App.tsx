import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import GoogleOAuthCallback from "./components/GoogleOAuthCallback";
import UpdateDatabase from "./components/UpdateDatabase";
import JobSearch from "./components/JobSearch";

// Simple auth service without external dependency for now
const authService = {
  getToken: () => localStorage.getItem("dream_job_search_token"),
  isAuthenticated: () => !!localStorage.getItem("dream_job_search_token"),
  checkAuthStatus: async () => {
    const token = localStorage.getItem("dream_job_search_token");
    if (!token) throw new Error("No token");

    const response = await fetch("http://localhost:8000/auth/status", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Auth check failed");
    return response.json();
  },
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          await authService.checkAuthStatus();
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoggedIn(false);
        localStorage.removeItem("dream_job_search_token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to="/search" replace />
                ) : (
                  <Login setIsLoggedIn={setIsLoggedIn} />
                )
              }
            />
            <Route
              path="/register"
              element={
                isLoggedIn ? (
                  <Navigate to="/search" replace />
                ) : (
                  <Register setIsLoggedIn={setIsLoggedIn} />
                )
              }
            />
            <Route
              path="/search"
              element={
                isLoggedIn ? (
                  <JobSearch setIsLoggedIn={setIsLoggedIn} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/update-database"
              element={
                isLoggedIn ? (
                  <UpdateDatabase setIsLoggedIn={setIsLoggedIn} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/auth/google/callback"
              element={<GoogleOAuthCallback />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
