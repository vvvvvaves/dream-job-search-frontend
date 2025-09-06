import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface RegisterProps {
  setIsLoggedIn: (value: boolean) => void;
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

const Register = ({ setIsLoggedIn }: RegisterProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Debug Google tokens state changes
  useEffect(() => {
    console.log(
      "Google tokens state changed:",
      googleTokens ? "CONNECTED" : "NOT CONNECTED"
    );
  }, [googleTokens]);

  // Check for tokens in localStorage on component mount (fallback mechanism)
  useEffect(() => {
    const checkStoredTokens = () => {
      const storedTokens = localStorage.getItem("google_oauth_tokens");
      const oauthSuccess = localStorage.getItem("google_oauth_success");

      console.log("Checking for stored tokens...", {
        storedTokens: !!storedTokens,
        oauthSuccess,
        currentGoogleTokens: !!googleTokens,
      });

      if (storedTokens && oauthSuccess === "true" && !googleTokens) {
        try {
          const tokens = JSON.parse(storedTokens);
          console.log("Setting Google tokens from localStorage:", tokens);
          setGoogleTokens(tokens);
          setIsGoogleLoading(false);

          // Clean up
          localStorage.removeItem("google_oauth_tokens");
          localStorage.removeItem("google_oauth_success");
          console.log("Cleaned up localStorage tokens");
        } catch (error) {
          console.error("Error parsing stored tokens:", error);
          localStorage.removeItem("google_oauth_tokens");
          localStorage.removeItem("google_oauth_success");
        }
      }
    };

    checkStoredTokens();

    // Also check periodically in case tokens arrive after component mounts
    const interval = setInterval(checkStoredTokens, 1000);

    // Cleanup interval after 30 seconds to avoid infinite checking
    setTimeout(() => clearInterval(interval), 30000);

    return () => clearInterval(interval);
  }, [googleTokens]);

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID =
    "715767866519-dr537aonsft7kmipo9rnlielpjjnkusr.apps.googleusercontent.com";
  const GOOGLE_REDIRECT_URI = "http://localhost:5173/auth/google/callback";
  const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ];

  const generateRandomString = (length: number) => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      // Generate state parameter for CSRF protection
      const state = generateRandomString(32);

      // Build Google OAuth URL
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        scope: GOOGLE_SCOPES.join(" "),
        response_type: "code",
        state: state,
        access_type: "offline",
        prompt: "consent",
      });

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // Open popup window
      const popup = window.open(
        googleAuthUrl,
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes,left=" +
          (window.screen.width / 2 - 250) +
          ",top=" +
          (window.screen.height / 2 - 300)
      );

      if (!popup || popup.closed) {
        throw new Error(
          "Popup blocked. Please allow popups for this site and try again."
        );
      }

      // Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        console.log(
          "Received message from popup:",
          event.data,
          "Origin:",
          event.origin
        );

        if (event.origin !== window.location.origin) {
          console.warn("Message from different origin, ignoring");
          return;
        }

        if (event.data.type === "GOOGLE_OAUTH_SUCCESS") {
          console.log(
            "Setting Google tokens from postMessage:",
            event.data.tokens
          );
          setGoogleTokens(event.data.tokens);
          setIsGoogleLoading(false);
          window.removeEventListener("message", handleMessage);
          console.log(
            "Google OAuth successful, tokens received via postMessage"
          );
        } else if (event.data.type === "GOOGLE_OAUTH_ERROR") {
          setError(`Google authentication failed: ${event.data.error}`);
          setIsGoogleLoading(false);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      // Handle popup closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          // Only show error if we haven't received tokens yet
          setTimeout(() => {
            if (!googleTokens && isGoogleLoading) {
              setIsGoogleLoading(false);
              setError("Google authentication was cancelled or failed");
            }
          }, 500);
        }
      }, 1000);
    } catch (error: any) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validation
      if (!email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      if (!googleTokens) {
        setError("Please connect your Google account first");
        return;
      }

      // Prepare registration data
      const registrationData = {
        email: email,
        password: password,
        other_creds: {
          google_creds: googleTokens,
          spreadsheet_data: {}, // Will be populated by backend when spreadsheet is created
        },
      };

      console.log("Registering user with Google tokens...");
      console.log("Registration data:", registrationData);

      const response = await axios.post(
        "http://localhost:8000/register",
        registrationData
      );

      if (response.data.access_token) {
        localStorage.setItem(
          "dream_job_search_token",
          response.data.access_token
        );
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.access_token}`;
        setIsLoggedIn(true);
        console.log("Registration successful, user logged in");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === "ERR_NETWORK") {
        setError(
          "Unable to connect to the server. Please check your connection and try again."
        );
      } else if (error.response?.status === 400) {
        setError(
          "Registration failed - user may already exist with this email."
        );
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          error.response?.data?.detail ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Your Account</h2>
        <p>Join Dream Job Search and connect your Google account</p>

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
              placeholder="Create a password (min 6 characters)"
              className="form-input"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="form-input"
              required
            />
          </div>

          {/* Google OAuth Section */}
          <div className="form-group">
            <label>Google Account Connection</label>
            {!googleTokens ? (
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="btn btn-google"
                disabled={isGoogleLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {isGoogleLoading ? (
                  "Connecting to Google..."
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
                    Connect Google Account
                  </>
                )}
              </button>
            ) : (
              <div
                style={{
                  padding: "0.75rem",
                  background: "#e6fffa",
                  border: "1px solid #38b2ac",
                  borderRadius: "8px",
                  color: "#2d3748",
                }}
              >
                ✅ Google account connected successfully!
                <button
                  type="button"
                  onClick={() => {
                    setGoogleTokens(null);
                    setError("");
                  }}
                  style={{
                    marginLeft: "1rem",
                    background: "none",
                    border: "none",
                    color: "#38b2ac",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !googleTokens}
            style={{ opacity: !googleTokens ? 0.6 : 1 }}
          >
            {isLoading ? "Creating Account..." : "Register & Connect Google"}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        <div className="auth-switch">
          <p>
            Already have an account?{" "}
            <Link to="/" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
