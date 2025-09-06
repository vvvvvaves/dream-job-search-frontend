import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

export interface LogsRef {
  clearLogs: () => void;
}

const Logs = forwardRef<LogsRef>((props, ref) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const logsContentRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const clearLogs = () => {
    setLogs([]);
  };

  const scrollToBottom = () => {
    if (logsContentRef.current) {
      setIsScrolling(true);
      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(() => {
        if (logsContentRef.current) {
          logsContentRef.current.scrollTo({
            top: logsContentRef.current.scrollHeight,
            behavior: "smooth",
          });
          setShowScrollIndicator(false);
          setShouldAutoScroll(true);

          // Set a timeout to mark scrolling as complete after animation
          // CSS scroll-behavior: smooth typically takes ~300-500ms
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          scrollTimeoutRef.current = window.setTimeout(() => {
            setIsScrolling(false);
          }, 600); // Slightly longer than typical smooth scroll duration
        }
      }, 10);
    }
  };

  const handleScroll = () => {
    if (logsContentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContentRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

      // Only update scroll indicator if not currently auto-scrolling
      if (!isScrolling) {
        setShowScrollIndicator(!isAtBottom);
        setShouldAutoScroll(isAtBottom);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    clearLogs,
  }));

  useEffect(() => {
    const token = localStorage.getItem("dream_job_search_token");
    if (!token) {
      console.error("No authentication token available for logs");
      return;
    }

    // EventSource doesn't support custom headers, so we pass the token as a query parameter
    // Note: This is less secure than headers but necessary for SSE
    const eventSource = new EventSource(
      `http://localhost:8000/logs?token=${encodeURIComponent(token)}`
    );

    eventSource.onmessage = (event) => {
      console.log("Received log message:", event.data);
      setLogs((prev) => [...prev, event.data]);
      // Only auto-scroll if user is already at the bottom
      if (shouldAutoScroll) {
        scrollToBottom();
      }
    };

    eventSource.onopen = () => {
      console.log("EventSource connection opened");
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    return () => eventSource.close();
  }, [shouldAutoScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h3 className="logs-title">Live Logs</h3>
        <div className="logs-controls">
          {showScrollIndicator && !isScrolling && (
            <button
              onClick={scrollToBottom}
              className="scroll-to-bottom-btn"
              title="Scroll to latest logs"
            >
              📍 Scroll to Bottom
            </button>
          )}
          {logs.length > 0 && (
            <span className="logs-count">{logs.length} messages</span>
          )}
          <button
            onClick={clearLogs}
            className="clear-logs-btn"
            title="Clear logs"
          >
            🗑️
          </button>
        </div>
      </div>
      <div
        className="logs-content"
        ref={logsContentRef}
        onScroll={handleScroll}
      >
        {logs.length === 0 ? (
          <div className="no-logs">
            No logs yet. Start updating the database to see live progress.
          </div>
        ) : (
          <pre className="logs-text">{logs.join("\n")}</pre>
        )}
      </div>
    </div>
  );
});

Logs.displayName = "Logs";

export default Logs;
