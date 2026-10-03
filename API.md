# API reference (Step 2)

## POST /api/reports
`multipart/form-data`

| Field | Required | Notes |
|---|---|---|
| photo | yes | JPG, PNG or WebP, max 5 MB |
| title | yes | max 120 chars |
| description | yes | max 1000 chars |
| lat, lng | yes | numbers |
| category | no | pothole, garbage, streetlight, water_leak, other (default other) |
| address, reporterName, reporterEmail | no | |

    curl -X POST http://localhost:5000/api/reports \
      -F "photo=@/path/to/pothole.jpg" \
      -F "title=Deep pothole near market" \
      -F "description=About 30cm wide, dangerous for bikes" \
      -F "category=pothole" \
      -F "lat=28.4595" -F "lng=77.0266"

## GET /api/reports
Query: `status`, `category`, `page`, `limit`. Returns `{ total, page, limit, reports }`.

## GET /api/reports/:id
Returns one report or 404.
