import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="logo">Smart<span>City</span> Reporter</NavLink>
      <nav>
        <NavLink to="/" end>Map</NavLink>
        <NavLink to="/report">Report Issue</NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
    </header>
  );
}
