import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="logo">Smart<span>City</span> Reporter</NavLink>
      <nav>
        <NavLink to="/" end>Map</NavLink>
        <NavLink to="/report">Report issue</NavLink>
        {user ? (
          <>
            <NavLink to="/admin">Dashboard</NavLink>
            <button className="nav-btn" onClick={onLogout}>Log out</button>
          </>
        ) : (
          <NavLink to="/login">Admin login</NavLink>
        )}
      </nav>
    </header>
  );
}
