# StockFlow CMC

StockFlow CMC is a web application for managing stock, requests and delivery slips (Bons de Sortie) for CMC Casablanca-Settat. It includes an admin panel and a user portal. The stack is an Express.js backend (PostgreSQL) and a React frontend (Vite). The project features a full request approval workflow, notifications, PDF Bon de Sortie generation (pdfmake), image uploads, and audit logging.

Repository: https://github.com/SalmaOUCHNE/stockflow-cmc.git

---

## Table of contents

- Features
- Requirements
- Quick start
- Environment variables
- Database setup & migrations
- Running locally (development)
- Building for production
- Backend API endpoints (summary)
- Frontend routes (summary)
- PDF Bon de Sortie
- Tests
- Troubleshooting
- Contributing
- License

---

## Features

- Create product requests from user portal
- Admin approval / rejection workflow
  - Approve: decrements stock, generates Bon de Sortie (BSC-YYYY-XXXXX), creates stock movement, notifies requestor
  - Reject: records reason, notifies requestor
- Notifications for admin and users (persisted in PostgreSQL)
- Bons de Sortie (delivery slips) stored in DB and downloadable as professional PDFs (pdfmake)
- Image uploads for products (multipart/form-data, stored under `uploads/` served statically)
- Audit logs for create/update actions
- PostgreSQL-backed persistence for all entities

---

## Requirements

- Node.js 18+ (LTS recommended)
- npm
- PostgreSQL 12+
- Git

---

## Quick start

1. Clone the repository:

```bash
git clone https://github.com/Salma-OUCHNE/stockflow-cmc.git
cd stockflow-cmc
```

2. Install dependencies (root scripts manage frontend):

```bash
npm install
cd frontend
npm install
cd ..
```

3. Create a `.env` in the project root (see Environment variables below)
4. Ensure PostgreSQL is running and the database is created
5. Run migrations / seed data (see Database setup)
6. Start the server (development):

```bash
npm run dev
```

7. Open the frontend in your browser (default: http://localhost:5173) and the API at http://localhost:3000/api/health

---

## Environment variables

Create a `.env` file in the repository root with at least the following keys (example values):

```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/stockflow
VITE_API_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
UPLOADS_DIR=public/uploads
```

Adjust values for your environment. The frontend uses `VITE_API_URL` to build absolute URLs for uploaded images.

---

## Database setup & migrations

This project uses PostgreSQL. The `backend/schema.sql` contains the schema used by the app. To initialize the DB:

1. Create a database in PostgreSQL (example):

```sql
CREATE DATABASE stockflow;
```

2. Run the schema SQL (from project root):

```bash
psql -d stockflow -f backend/schema.sql
```

3. (Optional) Run seed scripts located in `backend/` (e.g., run_seed_demo_products.js) or use provided seed tools.

The server's `server.js` also contains safeguards that add missing columns if needed when the server starts.

---

## Running locally (development)

From project root you can run both frontend and backend concurrently.

- Start backend only:

```bash
npm run start:backend
# or
node backend/server.js
```

- Start frontend only (from `frontend/`):

```bash
cd frontend
npm run dev
```

- Full project (root `package.json` provides scripts):

```bash
npm run dev:all
```

(If `dev:all` isn't available, use separate terminals for backend and frontend.)

---

## Building for production

From project root:

```bash
npm run build
```

This runs the frontend build (Vite) and returns a `dist/` folder under `frontend/dist/`. Backend requires no build (Node.js server runs as-is). For production, configure environment variables appropriately and serve built frontend assets from a static server or via the backend.

---

## Backend API endpoints (summary)

Base URL: `http://localhost:${process.env.PORT || 3000}/api`

- Authentication: `/auth/*` (login/register)
- Users: `/users` (CRUD)
- Products / Stock: `/stock/*`
- Requests: `/requests`
  - POST `/requests` — create request
  - GET `/requests` — list requests (admins see all)
  - GET `/requests/:id` — request detail
  - PATCH `/requests/:id/approve` — approve (admin) — decrements stock, creates Bon de Sortie
  - PATCH `/requests/:id/reject` — reject (admin)
- Bons (delivery slips): `/bons` — list and retrieve bons
- Notifications: `/notifications` — list, unread-count, mark-read
- Audit log: `/audit`

All routes require authentication (except auth routes). Check `backend/routes/` for full list and controller behavior.

---

## Frontend routes (summary)

- `/` — Landing
- `/login`, `/signup` — Auth
- `/dashboard`, `/stock`, `/bons`, `/requests` — Admin area (protected)
- `/portal` — User portal
  - `/portal/mes-demandes` — My requests
  - `/portal/demande/:id` — Request detail and Bon download

---

## Bon de Sortie PDF

- The project uses `pdfmake` to create a professional A4 PDF for Bons de Sortie.
- Bon numbering: `BSC-YYYY-XXXXX` (sequential per year). Numbers are generated server-side and stored in `bons_sortie.numero`.
- The PDF is generated client-side via the `frontend/src/lib/bonPdf.ts` helper using `pdfmake` and downloaded directly by the user. The bon metadata and PDF URL are stored in the backend (`bons_sortie.pdf_url` can be used if server-side generation is added).

Important: The PDF generator is NOT a screenshot; it uses pdfmake primitives and produces vector-based PDF suitable for printing.

---

## Image uploads

- Frontend sends images as `multipart/form-data` to backend endpoints (see products routes).
- Backend stores files under `backend/public/uploads` and serves them statically at `/uploads/*`.
- Product `photo_url` / `image_url` fields store the path to the file and are persisted in PostgreSQL.

---

## Tests

There are helper scripts and basic tests in the repo (see `test-*.js` files). For manual verification, follow the E2E scenario:

1. Create user and login
2. From user portal create a request for a product with quantity <= current stock
3. As admin, open `Requests` and approve the request
4. Verify:
   - Stock decreased in `products.stock_actuel`
   - `bons_sortie` row created with `numero` and `request_id`
   - `stock_movements` row created
   - Notification created for requestor and visible in portal
   - User can download the Bon PDF
   - Request status changed to `validee`

Run build to verify frontend compiles:

```bash
npm run build
```

---

## Troubleshooting

- If `npm run build` fails, run frontend build manually:
  - `cd frontend && npm run build`
- If images do not show, ensure `UPLOADS_DIR` is set and that `server.js` serves `/uploads` (it does by default from `backend/public/uploads`).
- If the Bon number shows `UNKNOWN`, confirm DB has `bons_sortie` entries and check server logs when approving a request (bon numbering runs at approval time).

---

## Contributing

Contributions are welcome. Typical workflow:

1. Fork the repo on GitHub
2. Create a feature branch
3. Implement changes and add tests if applicable
4. Run `npm run build` and ensure no errors
5. Submit a PR with a clear description of changes

Please follow existing code style and do not add unnecessary components; reuse services and API routes.

---

## Useful scripts (from root package.json)

- `npm run dev` — start dev servers (backend + frontend) (check scripts in package.json)
- `npm run build` — build frontend
- `npm run start:backend` — run backend server



