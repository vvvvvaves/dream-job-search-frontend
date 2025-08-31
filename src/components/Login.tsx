import { useState } from "react";
import axios from "axios";

interface LoginProps {
  setIsLoggedIn: (value: boolean) => void;
}

const Login = ({ setIsLoggedIn }: LoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/login");
      if (response.data.status === "success") {
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
      } else if (error.response?.status === 500) {
        setError("Login failed. Please check your credentials and try again.");
      } else if (error.response?.status === 401) {
        setError("Authentication failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to Dream Job Search</h2>
        <p>Sign in to access job search and database management features</p>

        <button
          onClick={handleGoogleLogin}
          className="btn btn-google"
          disabled={isLoading}
        >
          {isLoading ? (
            "Signing in..."
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && <div className="message error">{error}</div>}

        <div className="login-info">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
