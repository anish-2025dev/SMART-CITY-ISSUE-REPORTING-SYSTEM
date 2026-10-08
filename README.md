# Smart City Issue Reporting System

Residents report city problems (potholes, garbage, broken streetlights, water leaks) with a photo and an exact location. Staff manage the reports from an admin dashboard, and everyone can follow progress on a live map.

**Stack:** React 18 (Vite), Node.js + Express, MongoDB (Mongoose), Leaflet maps.

## Features

- **Report an issue** with a photo, GPS or map-picked location, and optional landmark and contact details.
- **Categorization**: automatic (keyword matching on the title and description, including some Hindi words) or manual. The form suggests a category while the user types and never overrides their choice.
- **Interactive map** with pins colored by status, photo popups, and status and category filters.
- **Progress tracking**: Reported, In progress, Resolved, with a public timeline and admin notes on every report.
- **Admin dashboard**: login, statistics, search and filters, status and category editing, delete.
- **Safety basics**: hashed passwords, JWT login, rate limiting, Helmet headers, upload type and size checks, reporter contact details hidden from the public.

## Project structure

```
smart-city-reporter/
├── package.json            root scripts (install:all, dev, seed, build)
├── docker-compose.yml      optional local MongoDB
├── API.md                  API reference
├── server/
│   ├── .env.example        copy to .env
│   ├── uploads/            uploaded photos (git-ignored)
│   ├── test/               categorizer unit tests
│   └── src/
│       ├── server.js, app.js
│       ├── config/         db.js, env.js
│       ├── models/         Report.js, User.js
│       ├── controllers/    reportController.js, authController.js
│       ├── routes/         reportRoutes.js, authRoutes.js
│       ├── middleware/     auth, upload, rateLimit, errorHandler
│       ├── utils/          categorizer.js
│       └── scripts/        seedAdmin.js
└── client/
    ├── .env.example        copy to .env
    └── src/
        ├── pages/          Home, ReportIssue, ReportDetail, Login, AdminDashboard
        ├── components/     Navbar, ReportsMap, LocationPicker, StatusBadge, ProtectedRoute
        ├── context/        AuthContext.jsx
        ├── services/       api.js
        └── constants.js, index.css
```

## Run it locally

### 1. Prerequisites

- **Node.js 18 or newer** (`node -v`). An `.nvmrc` is included for Node 20.
- **MongoDB**, either way:
  - *Docker (easiest):* `docker compose up -d` in the project root starts MongoDB on port 27017.
  - *Installed locally:* follow the MongoDB Community Server install guide, then make sure `mongod` is running.
  - *Cloud:* a free MongoDB Atlas cluster. Put its connection string in `MONGO_URI`.

### 2. Get the code

If the project is on GitHub:

```bash
git clone https://github.com/<your-username>/smart-city-reporter.git
cd smart-city-reporter
```

If you only have the zip, unzip it and open a terminal in the `smart-city-reporter` folder. To put it on GitHub so you can pull it anywhere:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/smart-city-reporter.git
git push -u origin main
```

`.gitignore` keeps your `.env` files and uploaded photos out of the repository.

### 3. Install dependencies

```bash
npm run install:all
```

This installs the root tools, the server and the client in one go.

### 4. Configure environment variables

If you got the zip, `.env` files already exist with working local defaults. If you cloned from GitHub, create them:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

| Variable | Required | What to put |
|---|---|---|
| `PORT` | no | API port. Default `5000`. |
| `NODE_ENV` | no | `development` locally, `production` when deployed. |
| `MONGO_URI` | **yes** | Local: `mongodb://127.0.0.1:27017/smart_city`. Atlas: the `mongodb+srv://...` string. |
| `JWT_SECRET` | **yes** | A long random string. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | Login lifetime. Default `12h`. |
| `CLIENT_URL` | **yes** | Address of the React app, `http://localhost:5173` locally. Separate several with commas. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for seeding | The first admin account. **Change the password** (8+ characters). |

**`client/.env`**

| Variable | What to put |
|---|---|
| `VITE_API_URL` | Leave empty locally (Vite proxies to the API). In production, your API address without a trailing slash. |

### 5. Create the admin account

```bash
npm run seed
```

Use `cd server && npm run seed -- --reset` later to reset an admin's password from `.env`.

### 6. Start everything

```bash
npm run dev
```

This runs the API and the React app together. Or use two terminals: `npm run dev` inside `server/` and inside `client/`.

| Service | Address |
|---|---|
| React app | http://localhost:5173 |
| API health check | http://localhost:5000/api/health |

### 7. Try it

1. Open http://localhost:5173/report, add a photo, set the location and submit.
2. The report appears on the map at http://localhost:5173.
3. Go to http://localhost:5173/login, sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, open a report with **Manage**, change its status and add a note.
4. Open the report's public page to see the progress timeline.

## Scripts

| Command | Where | Does |
|---|---|---|
| `npm run install:all` | root | Installs all dependencies |
| `npm run dev` | root | API + client with auto-reload |
| `npm run seed` | root | Creates the admin from `.env` |
| `npm test` | root | Runs the categorizer unit tests |
| `npm run build` | root | Builds the client into `client/dist` |
| `npm start` | root | Starts the API without auto-reload |

## Deploying

A typical free setup: **MongoDB Atlas** (database), **Render or Railway** (API), **Vercel or Netlify** (React app).

1. **Database:** create an Atlas cluster, add a database user, allow your host's IP (or `0.0.0.0/0` for a quick start) and copy the connection string.
2. **API** (root directory `server`, build `npm install`, start `npm start`): set `NODE_ENV=production`, `MONGO_URI`, a strong `JWT_SECRET` (32+ characters, enforced in production), `CLIENT_URL` (your frontend address), and the `ADMIN_*` values. Run `npm run seed` once from the host's shell.
3. **Client** (root directory `client`, build `npm run build`, output `dist`): set `VITE_API_URL` to the API address. `vercel.json` and `public/_redirects` already handle page refreshes on client-side routes.
4. **HTTPS is required** for the browser's "Use my current location" button to work. Vercel, Netlify and Render provide it automatically.

**Important: photo storage.** Photos are saved on the API server's disk. Most free hosts wipe that disk on every deploy or restart, so uploaded photos would disappear while the reports remain. Before real use, either attach a persistent disk or move uploads to object storage such as Cloudinary or S3 (the change is isolated in `server/src/middleware/upload.js`).

## Known limits

- **Auto-categorization reads text only.** It does not look at the photo. If the text is vague the report is filed as Other and an admin can recategorize it. Photo classification would need a vision model.
- **Reporter email is collected but nothing is sent.** There are no email or SMS notifications yet.
- **One role.** Admins can do everything. There is no separate staff or read-only role and no way to create more admins other than seeding.
- **Map tiles** come from the public OpenStreetMap servers, which is fine for development and small projects. Use a tile provider for heavy traffic.
- **Automated tests cover the categorizer.** The API and UI were checked manually and with stubbed-database scripts, not with a full test suite.

## Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | MongoDB isn't running or `MONGO_URI` is wrong. Run `docker compose up -d`, or check Atlas IP access and credentials. |
| `Missing required environment variables` | `server/.env` is missing. Copy it from `.env.example`. |
| Login says wrong email or password | Run `npm run seed`, and check you use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `server/.env`. |
| Photos or API calls fail in production | `CLIENT_URL` on the API must exactly match the frontend address, and `VITE_API_URL` must point at the API. |
| "Use my current location" does nothing | Browsers only allow GPS on `localhost` or HTTPS. Click the map instead. |
| Port already in use | Change `PORT` in `server/.env` (and the proxy target in `client/vite.config.js`). |

## License

MIT, see [LICENSE](LICENSE).
