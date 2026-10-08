import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReportsMap from "../components/ReportsMap";
import StatusBadge from "../components/StatusBadge";
import { fetchReport, getErrorMessage, photoUrl } from "../services/api";
import { categoryLabel, formatDate, statusColor } from "../constants";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport(id).then(setReport).catch((err) =>
      setError(err.response?.status === 404 ? "This report does not exist or was removed." : getErrorMessage(err))
    );
  }, [id]);

  if (error) return <div className="container narrow"><div className="alert">{error}</div><p><Link to="/">Back to the map</Link></p></div>;
  if (!report) return <div className="container narrow"><p className="muted">Loading…</p></div>;

  return (
    <div className="container narrow">
      <p><Link to="/">&larr; Back to the map</Link></p>
      <div className="card detail">
        <img className="detail-photo" src={photoUrl(report.photo)} alt={report.title} />
        <div className="row"><StatusBadge status={report.status} /><strong>{categoryLabel(report.category)}</strong></div>
        <h1>{report.title}</h1>
        <p>{report.description}</p>
        {report.address && <p className="muted">Near: {report.address}</p>}
        <p className="muted">Reported {formatDate(report.createdAt)}</p>

        <h2>Progress</h2>
        <ol className="timeline">
          {report.statusHistory.map((h, i) => (
            <li key={i} style={{ "--dot": statusColor(h.status) }}>
              <div className="row"><StatusBadge status={h.status} /><small className="muted">{formatDate(h.changedAt)}</small></div>
              {h.note && <p>{h.note}</p>}
            </li>
          ))}
        </ol>

        <h2>Location</h2>
        <ReportsMap reports={[report]} height={260} popups={false} />
        <small className="muted">Report ID: {report._id}</small>
      </div>
    </div>
  );
}
