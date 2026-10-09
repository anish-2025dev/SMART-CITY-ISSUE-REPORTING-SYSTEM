import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { categoryLabel, statusColor } from "../constants";
import { photoUrl } from "../services/api";

const DEFAULT_CENTER = [20.5937, 78.9629];
const iconCache = {};

// One colored pin per status
const iconFor = (status) => {
  if (!iconCache[status]) {
    iconCache[status] = L.divIcon({
      className: "pin",
      html: `<span class="pin-dot" style="background:${statusColor(status)}"></span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -26],
    });
  }
  return iconCache[status];
};

const toLatLng = (r) => [r.location.coordinates[1], r.location.coordinates[0]]; // GeoJSON is [lng, lat]

function FitToReports({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (!reports.length) return;
    if (reports.length === 1) return map.setView(toLatLng(reports[0]), 16);
    map.fitBounds(L.latLngBounds(reports.map(toLatLng)), { padding: [40, 40], maxZoom: 16 });
  }, [reports, map]);
  return null;
}

export default function ReportsMap({ reports, height = 520, popups = true }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={5} className="map-main" style={{ height }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToReports reports={reports} />
      {reports.map((r) => (
        <Marker key={r._id} position={toLatLng(r)} icon={iconFor(r.status)}>
          {popups && (
            <Popup minWidth={220}>
              <div className="popup">
                <img src={photoUrl(r.photo)} alt={r.title} loading="lazy" />
                <strong>{r.title}</strong>
                <div className="popup-row">
                  <StatusBadge status={r.status} />
                  <span>{categoryLabel(r.category)}</span>
                </div>
                <Link to={`/reports/${r._id}`}>View details and progress</Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
