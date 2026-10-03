import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import { createReport, suggestCategory, getErrorMessage } from "../services/api";

const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage" },
  { value: "streetlight", label: "Broken streetlight" },
  { value: "water_leak", label: "Water leak" },
  { value: "other", label: "Other" },
];

const labelOf = (value) => CATEGORIES.find((c) => c.value === value)?.label || "Other";

const MAX_PHOTO_MB = 5;
const EMPTY_FORM = {
  title: "", description: "", category: "auto",
  address: "", reporterName: "", reporterEmail: "",
};

export default function ReportIssue() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [position, setPosition] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [suggestion, setSuggestion] = useState(null); // { category, confidence }

  // Free the preview URL when it changes or the page closes
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  // Ask the server for a category while the user types (waits 500 ms after the last keystroke)
  useEffect(() => {
    if ((form.title + form.description).trim().length < 5) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await suggestCategory(form.title, form.description);
        if (!cancelled) setSuggestion(result);
      } catch {
        if (!cancelled) setSuggestion(null); // suggestions are optional, never block the form
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.title, form.description]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Photo must be a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`Photo must be ${MAX_PHOTO_MB} MB or smaller.`);
      return;
    }
    setError("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location. Click the map to set the spot.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === 1
            ? "Location permission was denied. Click the map to set the spot instead."
            : "Could not get your location. Click the map to set the spot instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!photo) return setError("Add a photo of the issue.");
    if (!position) return setError("Choose the location on the map or use your current location.");

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append("lat", position.lat);
    data.append("lng", position.lng);
    data.append("photo", photo);

    setSubmitting(true);
    try {
      setCreated(await createReport(data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setPhoto(null);
    setPreview("");
    setPosition(null);
    setCreated(null);
    setSuggestion(null);
  };

  if (created) {
    return (
      <div className="container narrow">
        <div className="card success-card">
          <span className="badge resolved">Submitted</span>
          <h1>Report received</h1>
          <p className="muted">
            Thanks. “{created.title}” was filed under <strong>{labelOf(created.category)}</strong>
            {created.categorySource === "auto" ? " (detected automatically)" : ""} with status{" "}
            <span className="badge reported">{created.status}</span>
          </p>
          <div className="row">
            <Link to="/" className="btn">View map</Link>
            <button className="btn btn-accent" onClick={reset}>Report another issue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <h1>Report an issue</h1>
      <p className="muted">A clear photo and an exact spot help the city fix it faster.</p>

      <form className="card form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Title</span>
          <input name="title" value={form.title} onChange={update} maxLength={120}
                 placeholder="Deep pothole near the market" required />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea name="description" value={form.description} onChange={update}
                    maxLength={1000} rows={4} required
                    placeholder="What is wrong, how big is it, is it dangerous?" />
        </label>

        <label className="field">
          <span>Category</span>
          <select name="category" value={form.category} onChange={update}>
            <option value="auto">Auto-detect (recommended)</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {form.category === "auto" && suggestion && (
            <small className="hint">
              {suggestion.category === "other"
                ? "Couldn't tell the category from your text. It will be filed as Other, or pick one above."
                : `We'll file this as ${labelOf(suggestion.category)}.`}
            </small>
          )}
          {form.category !== "auto" && suggestion && suggestion.category !== "other"
            && suggestion.category !== form.category && (
            <small className="hint">
              Your text sounds like {labelOf(suggestion.category)}.{" "}
              <button type="button" className="link-btn"
                      onClick={() => setForm({ ...form, category: suggestion.category })}>
                Use {labelOf(suggestion.category)}
              </button>
            </small>
          )}
        </label>

        <div className="field">
          <span>Photo</span>
          <label className="dropzone">
            {preview ? (
              <img src={preview} alt="Selected issue" className="preview" />
            ) : (
              <strong>Tap to take or choose a photo</strong>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp"
                   onChange={onPhoto} hidden />
          </label>
          {preview && <small className="muted">Click the photo to replace it.</small>}
        </div>

        <div className="field">
          <span>Location</span>
          <div className="row">
            <button type="button" className="btn" onClick={useMyLocation} disabled={locating}>
              {locating ? "Finding you…" : "Use my current location"}
            </button>
            <small className="muted">or click the map. Drag the pin to adjust.</small>
          </div>
          <LocationPicker position={position} onChange={setPosition} />
          {position && (
            <small className="muted">
              Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </small>
          )}
        </div>

        <label className="field">
          <span>Landmark or address (optional)</span>
          <input name="address" value={form.address} onChange={update}
                 placeholder="Opposite the bus stop" />
        </label>

        <div className="grid-2">
          <label className="field">
            <span>Your name (optional)</span>
            <input name="reporterName" value={form.reporterName} onChange={update} />
          </label>
          <label className="field">
            <span>Email for updates (optional)</span>
            <input type="email" name="reporterEmail" value={form.reporterEmail} onChange={update} />
          </label>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}

        <button className="btn btn-accent submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
