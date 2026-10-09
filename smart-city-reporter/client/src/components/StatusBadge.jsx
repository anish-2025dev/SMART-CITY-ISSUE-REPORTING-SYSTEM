import { statusLabel } from "../constants";

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{statusLabel(status)}</span>;
}
