# School Timetable Scheduler

A production-ready school timetable management and constraint optimization platform. Powered by **React 19** on the front end, **Python FastAPI** and **PostgreSQL** on the backend, and the **Google OR-Tools CP-SAT** constraint satisfaction engine.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               React 19 Frontend (Vite)                 │
│  - Weekly class, teacher, room & master grid views     │
│  - Dynamic curriculum & staff directory viewer         │
│  - Editable bell schedule with PostgreSQL persistence  │
│  - Generation modal with live CP-SAT telemetry         │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST (/api/*)
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Python FastAPI Backend                 │
│  - Health, School & Curriculum API                     │
│  - Database-backed Bell Schedule persistence           │
│  - Live OR-Tools CP-SAT Optimizer Bridge               │
│  - Streaming multi-sheet Excel & CSV exports           │
│  - Production static bundle serving                    │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ PostgreSQL ("school" DB) │   │ Google OR-Tools (CP-SAT) │
│  - schools               │   │  - Domain Pruning        │
│  - teachers              │   │  - Hard Constraints HC1-5│
│  - rooms                 │   │  - Soft Constraints SC1-3│
│  - student_groups        │   │  - Objective Optimizer   │
│  - courses               │   └──────────────────────────┘
│  - bell_periods          │
│  - timetables            │
│  - assignments           │
└──────────────────────────┘
```

---

## What the System Does

- **Interactive Timetables**: Visualizes weekly schedules filtered by class section, teacher, room, or school master view.
- **Relational PostgreSQL Storage**: Persists all faculty workloads, classrooms, student groups, curriculum quotas, bell periods, and generated timetable revisions.
- **Google OR-Tools CP-SAT Optimizer**: Solves NP-hard scheduling constraints on live database data with domain pruning:
  - **HC-01**: Exact weekly course session quotas met.
  - **HC-02**: Zero teacher double-booking.
  - **HC-03**: Zero student group double-booking.
  - **HC-04**: Zero classroom or specialized lab double-booking.
  - **HC-05**: Faculty daily period caps strictly honored.
  - **SC-01–03**: Uniform core subject distribution, teacher/student idle gap minimization, and consecutive lab slot grouping.
- **Database-Backed Bell Schedule Editor**: Edit period times and lunch breaks directly in the UI; changes persist to PostgreSQL.
- **Dynamic Excel & CSV Downloads**: Streams multi-sheet styled `.xlsx` workbooks (Overview, Master Matrix, Class Grids, Teacher Workloads) generated in-memory using `openpyxl`.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion
- **Backend API**: Python FastAPI, Uvicorn, Pydantic v2
- **Database & ORM**: PostgreSQL, SQLAlchemy 2.0, `psycopg` (v3 binary driver)
- **Constraint Solver**: Google OR-Tools CP-SAT
- **Export Formats**: OpenPyXL (Excel workbooks), CSV

---

## Quick Start

### 1. Prerequisites
- **Node.js** 20+ and npm
- **Python** 3.10+
- **PostgreSQL** running locally (e.g. via Homebrew or service)

### 2. Environment Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Set up Python virtual environment and install requirements
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Database Configuration & Seeding

By default, the application connects to:
```
DATABASE_URL=postgresql+psycopg://jitendra@localhost:5432/school
```
*(You can override `DATABASE_URL` in an environment variable or `.env` file).*

To initialize the schema and populate the initial curriculum:
```bash
npm run db:seed
```

### 4. Running in Development

Run both the FastAPI backend and Vite frontend concurrently:

```bash
# Terminal 1: Start FastAPI Backend (Port 8000)
npm run dev:api

# Terminal 2: Start Vite Frontend (Port 5173 with proxy to 8000)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Requests to `/api/*` are proxied to `http://localhost:8000`.

### 5. Running in Production

Build the frontend bundle and start the unified server:

```bash
npm run build
npm start
```

Uvicorn starts on `http://localhost:8000`, serving both the FastAPI REST API and the React single-page application from `dist/`.

---

## Available NPM Scripts

| Command | Description |
| --- | --- |
| `npm run dev:api` | Starts the FastAPI backend on port 8000 with auto-reload. |
| `npm run dev` / `npm run dev:ui` | Starts the Vite frontend development server. |
| `npm run db:seed` | Creates PostgreSQL tables and seeds baseline school data. |
| `npm run build` | Compiles TypeScript and builds the production React assets into `dist/`. |
| `npm start` | Starts the production FastAPI server on port 8000 (serves API & static UI). |
| `npm run lint` | Runs TypeScript type check (`tsc --noEmit`). |
| `npm run clean` | Cleans `dist` output. |

---

## REST API Reference

| Method & Route | Description |
| --- | --- |
| `GET /api/health` | Health status, PostgreSQL connectivity, and solver engine info. |
| `GET /api/school` | Returns current school metadata (name, academic year, term). |
| `GET /api/curriculum` | Fetches all courses, teachers, rooms, and groups from PostgreSQL. |
| `GET /api/bell-schedule` | Retrieves current bell schedule from PostgreSQL. |
| `PUT /api/bell-schedule` | Updates bell timings and persists them to PostgreSQL. |
| `POST /api/bell-schedule/reset` | Resets bell periods to standard school defaults. |
| `GET /api/timetable` | Returns the active timetable assignments and solver metrics from PostgreSQL. |
| `POST /api/solve` | Solves the schedule via Google OR-Tools CP-SAT, archives old timetable, stores new active timetable in PostgreSQL, and returns assignments. |
| `GET /api/download/excel` | Streams formatted multi-tab `.xlsx` workbook from active timetable. |
| `GET /api/download/csv` | Streams flat schedule `.csv` export. |

---

## Example API Usage

```bash
# Health check
curl http://localhost:8000/api/health

# Trigger live CP-SAT solve with custom constraints
curl -X POST http://localhost:8000/api/solve \
  -H "Content-Type: application/json" \
  -d '{
    "timeLimit": 15,
    "workers": 4,
    "balanceWorkload": true,
    "labRouting": true,
    "evenSpread": true
  }'

# Download active Excel workbook
curl -O http://localhost:8000/api/download/excel
```
