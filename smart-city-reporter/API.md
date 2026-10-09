# API reference

Base URL in development: `http://localhost:5000/api` (the React dev server also proxies it at `http://localhost:5173/api`).
Admin routes need the header `Authorization: Bearer <token>` from `POST /auth/login`.
Errors always look like `{ "message": "What went wrong" }`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | public | Health check |
| POST | `/reports` | public, 20/hour/IP | Create a report (multipart form) |
| GET | `/reports` | public | List reports (filters, paging) |
| GET | `/reports/:id` | public | One report with its progress timeline |
| POST | `/reports/categorize` | public | Suggest a category from text |
| GET | `/reports/stats` | admin | Counts by status and category |
| PATCH | `/reports/:id` | admin | Change status, category, add a timeline note |
| DELETE | `/reports/:id` | admin | Delete a report and its photo |
| POST | `/auth/login` | public, 10/15 min/IP | Get an admin token |
| GET | `/auth/me` | admin | Current admin |

Public responses leave out `reporterName` and `reporterEmail`. Admin responses include them.

## POST /reports
`multipart/form-data`

| Field | Required | Notes |
|---|---|---|
| photo | yes | JPG, PNG or WebP, max 5 MB |
| title | yes | max 120 characters |
| description | yes | max 1000 characters |
| lat, lng | yes | numbers |
| category | no | `auto` (default), `pothole`, `garbage`, `streetlight`, `water_leak`, `other`. With `auto` the server detects it from the text and stores `categorySource: "auto"` |
| address, reporterName, reporterEmail | no | |

```bash
curl -X POST http://localhost:5000/api/reports \
  -F "photo=@/path/to/pothole.jpg" \
  -F "title=Deep pothole near market" \
  -F "description=About 30cm wide, dangerous for bikes" \
  -F "lat=28.4595" -F "lng=77.0266"
```

## GET /reports
Query: `status` (`reported`, `in-progress`, `resolved`), `category`, `search`, `page`, `limit` (max 500).
Returns `{ total, page, pages, limit, reports }`.

## PATCH /reports/:id (admin)
JSON body, all fields optional: `{ "status": "in-progress", "category": "pothole", "note": "Crew assigned" }`.
A timeline entry is added when the status changes or a note is sent.

## POST /reports/categorize
Body `{ "title": "...", "description": "..." }` returns `{ "category", "confidence", "matches" }`.
Returns `category: "other"` with confidence 0 when nothing clear is found.

## POST /auth/login
Body `{ "email": "...", "password": "..." }` returns `{ token, user }`.
