import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface HeaderProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

const Header = ({ isLoggedIn, setIsLoggedIn }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/logout");
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if backend call fails
    } finally {
      setIsLoggedIn(false);
      navigate("/");
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>Dream Job Search</h1>
        </Link>
        <nav className="nav">
          {isLoggedIn && (
            <>
              <Link to="/search" className="nav-link">
                Search Jobs
              </Link>
              <Link to="/update-database" className="nav-link">
                Update Database
              </Link>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
