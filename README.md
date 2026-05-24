# PC Builder — Run Locally

This project has a backend (Express + Mongoose) and a frontend (Vite + React). These instructions show how to run both locally.

Prerequisites
- Node.js (>= 18 recommended)
- npm
- MongoDB (either local or Atlas)

1) Configure MongoDB
- Option A: Local MongoDB
  - Make sure MongoDB server is running locally.
  - The backend will automatically fallback to `mongodb://127.0.0.1:27017/sanpham` if `MONGODB_URI` is not set.

- Option B: Atlas (recommended for remote)
  - Create a cluster and whitelist your IP.
  - Create a user and note the connection string.
  - You can provide the URI via an environment variable or `.env` file.

2) Backend — install & run
```powershell
cd backend
npm install
# Optional: create backend/.env with MONGODB_URI=your_uri
# Run seed (optional, will populate sample products/users/rules):
npm run seed
# Start development server (nodemon):
npm run dev
```

Default backend URL: http://localhost:5000

3) Frontend — install & run
```powershell
cd frontend
npm install
npm run dev
```

Default frontend URL: http://localhost:3000 (Vite)

Notes
- Frontend proxy is configured (`vite.config.js`) so calls to `/api` forward to `http://localhost:5000`.
- If you seed data, the seed script will insert sample categories, products, users, needs, and recommendation rules.

- To run everything using Docker Compose (MongoDB + backend + frontend):
  ```powershell
  docker compose up --build
  # or
  docker-compose up --build
  ```
  - After containers start, open http://localhost:3000 for the frontend (Vite) and backend is at http://localhost:5000.
  - To run the seed script inside the running backend container:
    ```powershell
    docker compose exec backend node seedPC.js
    ```

Quick API test (PowerShell):
```powershell
curl -X POST http://localhost:5000/api/pc-builder/suggest `
  -H "Content-Type: application/json" `
  -d '{"budget":15000000, "need":"gaming", "count":3}'
```

If you want any additional automation (docker-compose, env examples), tell me and I will add it.

---
Updated to support running fully on localhost by falling back to local MongoDB when `MONGODB_URI` is not set.
