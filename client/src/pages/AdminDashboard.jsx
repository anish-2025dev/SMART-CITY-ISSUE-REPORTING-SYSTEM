import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import {
  fetchReports, fetchStats, updateReport, deleteReport, getErrorMessage, photoUrl,
} from "../services/api";
import { CATEGORIES, STATUSES, categoryLabel, formatDate } from "../constants";

const PAGE_SIZE = 10;

// Edit panel shown under a report row
function ManagePanel({ report, onSaved, onDeleted }) {
  const [status, setStatus] = useState(report.status);
  const [category, setCategory] = useState(report.category);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const updated = await updateReport(report._id, { status, category, note });
      setNote("");
      onSaved(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${report.title}" permanently? This also removes its photo.`)) return;
    setBusy(true);
    try {
      await deleteReport(report._id);
      onDeleted(report._id);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="manage">
      <div className="manage-info">
        <p>{report.description}</p>
        {report.address && <p className="muted">Near: {report.address}</p>}
        <p className="muted">
          Reporter: {report.reporterName || "Anonymous"}
          {report.reporterEmail ? ` (${report.reporterEmail})` : ""}
        </p>
        <Link to={`/reports/${report._id}`}>Open public page</Link>
      </div>

      <div className="manage-form">
        <div className="grid-2">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Update for the public timeline (optional)</span>
          <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Crew assigned, repair planned for Friday" />
        </label>
        {error && <div className="alert" role="alert">{error}</div>}
        <div className="row">
          <button className="btn" onClick={save} disabled={busy}>Save changes</button>
          <button className="btn btn-danger" onClick={remove} disabled={busy}>Delete report</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced search text
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(() => fetchStats().then(setStats).catch(() => {}), []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchReports({ status, category, search: query, page, limit: PAGE_SIZE });
      setReports(data.reports);
      setPages(data.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, category, query, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadReports(); }, [loadReports]);

  const onSaved = (updated) => {
    setReports((list) => list.map((r) => (r._id === updated._id ? updated : r)));
    loadStats();
  };
  const onDeleted = (id) => {
    setOpenId(null);
    loadReports();
    loadStats();
    setReports((list) => list.filter((r) => r._id !== id));
  };

  const maxCategory = stats ? Math.max(1, ...Object.values(stats.byCategory)) : 1;

  return (
    <div className="container wide">
      <h1>Admin dashboard</h1>
      <p className="muted">Review reports, update their progress and keep residents informed.</p>

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat"><b>{stats.total}</b><span>Total reports</span></div>
            {STATUSES.map((s) => (
              <div className="stat" key={s.value} style={{ borderTopColor: s.color }}>
                <b>{stats.byStatus[s.value]}</b><span>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="card bars">
            <strong>Reports by category</strong>
            {CATEGORIES.map((c) => (
              <div className="bar-row" key={c.value}>
                <span>{c.label}</span>
                <div className="bar"><i style={{ width: `${(stats.byCategory[c.value] / maxCategory) * 100}%` }} /></div>
                <b>{stats.byCategory[c.value]}</b>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="filters">
        <input className="search" placeholder="Search title, description or landmark"
               value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search reports" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Photo</th><th>Report</th><th>Category</th><th>Status</th><th>Date</th><th /></tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <FragmentRow key={r._id} report={r} open={openId === r._id}
                           onToggle={() => setOpenId(openId === r._id ? null : r._id)}
                           onSaved={onSaved} onDeleted={onDeleted} />
            ))}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={6} className="empty-cell">No reports match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {loading && <p className="muted">Loading…</p>}

      <div className="pager">
        <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function FragmentRow({ report, open, onToggle, onSaved, onDeleted }) {
  return (
    <>
      <tr>
        <td><img className="thumb" src={photoUrl(report.photo)} alt="" loading="lazy" /></td>
        <td><strong>{report.title}</strong></td>
        <td>
          {categoryLabel(report.category)}
          {report.categorySource === "auto" && <small className="muted"> (auto)</small>}
        </td>
        <td><StatusBadge status={report.status} /></td>
        <td className="nowrap">{formatDate(report.createdAt)}</td>
        <td><button className="btn btn-outline" onClick={onToggle}>{open ? "Close" : "Manage"}</button></td>
      </tr>
      {open && (
        <tr className="manage-row">
          <td colSpan={6}>
            <ManagePanel report={report} onSaved={onSaved} onDeleted={onDeleted} />
          </td>
        </tr>
      )}
    </>
  );
}
