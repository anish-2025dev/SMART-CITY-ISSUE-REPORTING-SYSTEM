import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container narrow">
      <h1>Page not found</h1>
      <p className="muted">That address does not exist.</p>
      <Link to="/" className="btn">Go to the map</Link>
    </div>
  );
}
