import { useState, useRef } from "react";
import axios from "axios";
import TagInput from "./TagInput";
import Logs, { type LogsRef } from "./Logs";

interface UpdateDatabaseProps {
  setIsLoggedIn?: (value: boolean) => void;
}

const UpdateDatabase = ({ setIsLoggedIn }: UpdateDatabaseProps) => {
  const [locations, setLocations] = useState<string[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const logsRef = useRef<{ clearLogs: () => void }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setShowLogs(true);

    // Clear logs at the start of each new execution
    if (logsRef.current) {
      logsRef.current.clearLogs();
    }

    try {
      if (locations.length === 0 || queries.length === 0) {
        setMessage("Please enter at least one location and one query");
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("dream_job_search_token");
      if (!token) {
        setMessage("You are not logged in. Please login first.");
        if (setIsLoggedIn) {
          setIsLoggedIn(false);
        }
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/update-database",
        {
          locations: locations,
          queries: queries,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        setMessage("Database updated successfully!");
        setLocations([]);
        setQueries([]);
      } else {
        setMessage("Database update completed but with warnings.");
      }
    } catch (error: any) {
      console.error("Error updating database:", error);
      if (error.response?.status === 401) {
        setMessage("You are not logged in. Please login first.");
        if (setIsLoggedIn) {
          setIsLoggedIn(false);
        }
      } else if (error.response?.status === 500) {
        setMessage("Database update failed. Please try again later.");
      } else {
        setMessage("Error updating database. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="update-database-container">
      <div className="update-database-card">
        <h2>Update Database</h2>
        <p>Add new locations and search queries to expand the job database</p>

        <form onSubmit={handleSubmit} className="update-form">
          <TagInput
            tags={locations}
            setTags={setLocations}
            placeholder="e.g., New York"
            label="Locations"
            maxTags={10}
          />

          <TagInput
            tags={queries}
            setTags={setQueries}
            placeholder="e.g., Software Engineer"
            label="Search Queries"
            maxTags={15}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Database"}
          </button>
        </form>

        {message && (
          <div
            className={`message ${
              message.includes("Error") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}

        {/* Live Logs Section */}
        {showLogs && (
          <div className="logs-section">
            <Logs ref={logsRef} />
          </div>
        )}

        <div className="info-box">
          <h4>How it works:</h4>
          <ul>
            <li>Enter locations where you want to search for jobs</li>
            <li>Enter job titles or keywords to search for</li>
            <li>The system will scrape LinkedIn for matching job postings</li>
            <li>Results are stored in the database for future searches</li>
            <li>Live logs show real-time progress during the update process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdateDatabase;
