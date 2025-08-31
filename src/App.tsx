import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Login from "./components/Login";
import UpdateDatabase from "./components/UpdateDatabase";
import JobSearch from "./components/JobSearch";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
              path="/search"
              element={
                isLoggedIn ? (
                  <JobSearch setIsLoggedIn={setIsLoggedIn} />
                ) : (
                  <Login setIsLoggedIn={setIsLoggedIn} />
                )
              }
            />
            <Route
              path="/update-database"
              element={
                isLoggedIn ? (
                  <UpdateDatabase setIsLoggedIn={setIsLoggedIn} />
                ) : (
                  <Login setIsLoggedIn={setIsLoggedIn} />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
