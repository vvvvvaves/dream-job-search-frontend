import { useState } from "react";
import axios from "axios";
import TagInput from "./TagInput";

interface JobPosting {
  score: number;
  matched_keywords: string;
  link: string;
  job_title: string;
  job_company: string;
  job_location: string;
}

interface JobSearchProps {
  setIsLoggedIn?: (value: boolean) => void;
}

const JobSearch = ({ setIsLoggedIn }: JobSearchProps) => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>("");

  const jobsPerPage = 20;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (keywords.length === 0) {
        setError("Please enter at least one keyword");
        setIsLoading(false);
        return;
      }

      const response = await axios.post("http://localhost:8000/job-postings", {
        keywords: keywords,
        location: location.trim() || null,
      });

      setJobPostings(response.data.job_postings);
      setTotalPages(Math.ceil(response.data.job_postings.length / jobsPerPage));
      setCurrentPage(1);
    } catch (error: any) {
      console.error("Error searching jobs:", error);
      if (error.response?.status === 401) {
        setError("You are not logged in. Please login first.");
        if (setIsLoggedIn) {
          setIsLoggedIn(false);
        }
      } else if (error.response?.status === 500) {
        setError("Job search failed. Please try again later.");
      } else {
        setError("Error searching jobs. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPageJobs = () => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return jobPostings.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="job-search-container">
      <div className="job-search-card">
        <h2>Search Jobs</h2>
        <p>
          Find your dream job by entering keywords and optionally a location
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <TagInput
            tags={keywords}
            setTags={setKeywords}
            placeholder="e.g., React"
            label="Keywords"
            maxTags={20}
          />

          <div className="form-group">
            <label htmlFor="location">Location (optional)</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, Remote"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search Jobs"}
          </button>
        </form>

        {error && <div className="message error">{error}</div>}

        {jobPostings.length > 0 && (
          <div className="results-section">
            <h3>Found {jobPostings.length} jobs</h3>

            <div className="jobs-list">
              {getCurrentPageJobs().map((job, index) => (
                <div key={index} className="job-card">
                  <div className="job-header">
                    <h4 className="job-title">{job.job_title}</h4>
                    <span className="job-score">Score: {job.score}</span>
                  </div>
                  <div className="job-company">{job.job_company}</div>
                  <div className="job-location">{job.job_location}</div>
                  <div className="job-keywords">
                    <strong>Matched keywords:</strong> {job.matched_keywords}
                  </div>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="job-link"
                  >
                    View Job
                  </a>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-outline"
                >
                  Previous
                </button>

                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;
