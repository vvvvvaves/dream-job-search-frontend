import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface LoginProps {
  setIsLoggedIn: (value: boolean) => void;
}

const Login = ({ setIsLoggedIn }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Please enter both email and password");
        return;
      }

      const response = await axios.post("http://localhost:8000/login", {
        email: email,
        password: password,
      });

      if (response.data.access_token) {
        localStorage.setItem(
          "dream_job_search_token",
          response.data.access_token
        );
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.access_token}`;
        setIsLoggedIn(true);
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "ERR_NETWORK") {
        setError(
          "Unable to connect to the server. Please check your connection and try again."
        );
      } else if (error.response?.status === 401) {
        setError("Invalid credentials. Please check your email and password.");
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          error.response?.data?.detail || "Login failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Sign in to your Dream Job Search account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        <div className="auth-switch">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
