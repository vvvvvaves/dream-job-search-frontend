import { useEffect, useRef } from "react";

const GoogleOAuthCallback = () => {
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    console.log("OAuth callback component loaded");

    function showError(message: string) {
      console.error("OAuth callback error:", message);
      // Send error back to parent window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "GOOGLE_OAUTH_ERROR",
            error: message,
          },
          window.location.origin
        );
      }
    }

    function getUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const fragmentParams = new URLSearchParams(
        window.location.hash.substring(1)
      );

      // Combine both query and fragment parameters
      const params: Record<string, string> = {};
      for (const [key, value] of urlParams) {
        params[key] = value;
      }
      for (const [key, value] of fragmentParams) {
        params[key] = value;
      }

      return params;
    }

    async function handleCallback() {
      try {
        const params = getUrlParams();
        console.log("OAuth params:", params);

        // Check for error from Google
        if (params.error) {
          const errorMessage = params.error_description || params.error;
          console.error("OAuth error from Google:", errorMessage);
          throw new Error(`Google OAuth error: ${errorMessage}`);
        }

        // Check for authorization code
        const code = params.code;
        const state = params.state;

        if (!code) {
          throw new Error("No authorization code received from Google");
        }

        console.log("Authorization code received, exchanging for tokens...");

        // Exchange code for tokens via backend
        const response = await fetch(
          "http://localhost:8000/api/auth/google/callback",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
              state: state,
            }),
          }
        );

        console.log("Backend response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage =
            errorData?.detail ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const tokens = await response.json();
        console.log("Tokens received successfully");

        // Send tokens back to parent window (registration form)
        console.log("Checking parent window:", {
          hasOpener: !!window.opener,
          openerClosed: window.opener ? window.opener.closed : "no opener",
          targetOrigin: window.location.origin,
        });

        if (window.opener && !window.opener.closed) {
          try {
            const message = {
              type: "GOOGLE_OAUTH_SUCCESS",
              tokens: tokens,
            };

            console.log("Sending message to parent:", message);
            window.opener.postMessage(message, window.location.origin);

            console.log("Tokens sent to parent window successfully");
            // window.close(); // Keep popup open for debugging
          } catch (error) {
            console.error("Failed to send message to parent:", error);
            // Fallback to localStorage
            localStorage.setItem("google_oauth_tokens", JSON.stringify(tokens));
            localStorage.setItem("google_oauth_success", "true");
            alert(
              "OAuth successful! Please close this window and the registration will continue automatically."
            );
            // window.close(); // Keep popup open for debugging
          }
        } else {
          console.warn(
            "No valid parent window found, using localStorage fallback"
          );
          // Store tokens in localStorage as fallback
          localStorage.setItem("google_oauth_tokens", JSON.stringify(tokens));
          localStorage.setItem("google_oauth_success", "true");

          // Show success message with instructions
          alert(
            "OAuth successful! Please close this window and the registration will continue automatically."
          );
          // window.close(); // Keep popup open for debugging
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        showError(error.message);

        // Close window after showing error for a few seconds
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.close();
          }
        }, 5000);
      }
    }

    // Start the callback handling
    handleCallback();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            border: "3px solid rgba(255, 255, 255, 0.3)",
            borderTop: "3px solid white",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <h2>Processing Google Authentication...</h2>
        <p>Please wait while we complete your registration.</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
