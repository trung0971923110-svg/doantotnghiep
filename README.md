# PC Builder — Run Locally

This project has a backend (Express + Mongoose) and a frontend (Vite + React). These instructions show how to run both locally.

Prerequisites
- Node.js (>= 18 recommended)
- npm
- MongoDB (either local or Atlas)
 - (Optional for Docker) Docker Desktop (Windows) or Docker Engine + Docker Compose


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
  - Or run the one-time seed job included in `docker-compose.yml` (recommended first-run):
    ```powershell
    docker compose up --build -d mongo
    docker compose run --rm seed
    # then start all services
    docker compose up -d backend frontend
    ```

Install Docker Desktop on Windows (WSL2 preferred)
1) Requirements
  - Windows 10 2004+ (Build 19041+) or Windows 11 (64-bit). WSL2 recommended.
2) Install WSL2 (if not already):
  - Open PowerShell as Administrator and run:
    ```powershell
    wsl --install
    ```
  - If `wsl --install` is not available, follow Microsoft docs to enable the Windows Subsystem for Linux and install a distro.
3) Install Docker Desktop
  - Download Docker Desktop from https://www.docker.com/get-started
  - Run the installer and enable "Use the WSL 2 based engine" when prompted.
  - After installation, open Docker Desktop and confirm status is "Running".
4) Verify installation in PowerShell:
  ```powershell
  docker --version
  docker compose version
  ```
5) Troubleshooting
  - If `docker` command not found: make sure Docker Desktop is started and you restarted your shell.
  - If you see permission or WSL errors, follow Docker Desktop UI prompts or re-run WSL install steps.

Quick API test (PowerShell):
```powershell
curl -X POST http://localhost:5000/api/pc-builder/suggest `
  -H "Content-Type: application/json" `
  -d '{"budget":15000000, "need":"gaming", "count":3}'
```

If you want any additional automation (docker-compose, env examples), tell me and I will add it.

---
Updated to support running fully on localhost by falling back to local MongoDB when `MONGODB_URI` is not set.
