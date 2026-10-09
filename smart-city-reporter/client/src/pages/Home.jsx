import { useEffect, useMemo, useState } from "react";
import ReportsMap from "../components/ReportsMap";
import { fetchReports, getErrorMessage } from "../services/api";
import { CATEGORIES, STATUSES } from "../constants";
import { Link } from "react-router-dom";

export default function Home() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchReports({ status, category, limit: 500 })
      .then((data) => !cancelled && setReports(data.reports))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [status, category]);

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s.value, reports.filter((r) => r.status === s.value).length])),
    [reports]
  );

  return (
    <div className="container wide">
      <div className="page-head">
        <div>
          <h1>City issues map</h1>
          <p className="muted">Every pin is a report from a resident. Click one to see its photo and progress.</p>
        </div>
        <Link to="/report" className="btn btn-accent">Report an issue</Link>
      </div>

      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div className="legend">
          {STATUSES.map((s) => (
            <span key={s.value}><i style={{ background: s.color }} />{s.label} ({counts[s.value]})</span>
          ))}
        </div>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}
      {loading && <p className="muted">Loading reports…</p>}
      {!loading && !error && reports.length === 0 && (
        <div className="empty">
          No reports match these filters yet. <Link to="/report">Be the first to report an issue.</Link>
        </div>
      )}

      <ReportsMap reports={reports} />
    </div>
  );
}
