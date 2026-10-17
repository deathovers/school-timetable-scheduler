# School Timetable Scheduler

School Timetable Scheduler is a full-stack application for maintaining school scheduling data and generating a weekly timetable with constraint optimisation. Administrators can manage courses, teachers, rooms, class groups, school details, and bell periods; generate a conflict-free timetable; inspect it by class, teacher, room, or in a master view; and export the result.

The current application is configured for a five-day week (Monday–Friday) with eight academic periods per day. Its included seed dataset represents three groups—Grade 9-A, Grade 9-B, and Grade 10-A—but the maintained data is database-backed and can be changed from the UI.

## Architecture

```text
React 19 + TypeScript single-page application
  ├─ Timetable, bell schedule, curriculum/staff management, PDF export
  └─ /api/* HTTP requests (Vite proxies to port 8000 in development)
                         │
                         ▼
FastAPI application
  ├─ Pydantic request validation and CRUD endpoints
  ├─ SQLAlchemy persistence and Excel/CSV generation
  └─ Google OR-Tools CP-SAT solve service
             │                              │
             ▼                              ▼
      PostgreSQL database             Constraint model
      school curriculum and            weekly sessions,
      timetable history                resources, capacity,
                                       availability, objectives
```

In production, FastAPI mounts the built `dist/` directory at `/` if it exists. The API is therefore served by the same process as the built frontend.

## Technology stack

| Area | Technology | Role |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite 6 | Single-page user interface and development tooling |
| Styling and UI | Tailwind CSS 4, Lucide React, Motion | Utility styling, icons, and animations |
| Frontend export | jsPDF, jsPDF-AutoTable, html2canvas | Browser-side PDF timetable output |
| Backend API | Python, FastAPI, Uvicorn, Pydantic 2 | REST API, validation, application runtime |
| Persistence | PostgreSQL, SQLAlchemy 2, psycopg 3 | Relational data storage and ORM access |
| Optimisation | Google OR-Tools CP-SAT | Constraint-based timetable generation |
| Server-side export | OpenPyXL | In-memory multi-sheet Excel workbook generation |
| Legacy/prototype tooling | Express, SheetJS (`xlsx`), `server.ts` | Older Node implementation retained in the repository; not used by the current npm scripts |

`@google/genai`, `dotenv`, Express, SheetJS, and related packages remain declared in `package.json`, but the active React/FastAPI path does not call Gemini or start the Express server.

## Main capabilities

- View the weekly timetable by class, teacher, room, or a school-wide master grid.
- Create, edit, bulk-create, search, and delete courses; create, edit, and delete teachers, rooms, and student groups.
- Store teacher daily availability, daily maximum teaching periods, student counts, room capacity, room/lab type, course load, and lab requirements.
- Edit school profile information and the bell schedule, including breaks.
- Generate a new timetable with configurable workload balancing, lab routing, and subject-distribution objectives.
- Preserve each generated timetable as a database record: a new solve archives earlier active schedules and writes a new active one.
- Export the active timetable as an Excel workbook or CSV from the API, or as a PDF from the browser.
- Continue to display bundled sample data when the frontend cannot reach the API during initial load.

## Repository layout

```text
.
├── src/                         # React UI
│   ├── App.tsx                  # Application state and API integration
│   ├── components/
│   │   ├── TimetableGrid.tsx    # Class/teacher/room/master timetable views
│   │   ├── AutoScheduleModal.tsx
│   │   ├── BellScheduleEditor.tsx
│   │   ├── InputDataViewer.tsx  # Curriculum and directory screens
│   │   └── crud/                # Create/update/delete dialogs and feedback
│   ├── data/sampleData.ts       # Offline/initial display data
│   ├── types.ts                 # Frontend domain types
│   └── utils/exportPdf.ts       # Client-side PDF generator
├── backend/                     # Active Python backend
│   ├── main.py                  # FastAPI routes and static hosting
│   ├── models.py                # SQLAlchemy tables
│   ├── schemas.py               # Pydantic API models
│   ├── database.py              # Database engine/session configuration
│   ├── seed.py                  # Schema setup, initial data, baseline solve
│   ├── solver.py                # OR-Tools CP-SAT model
│   └── excel_generator.py       # Excel export generator
├── server.ts, server/           # Legacy Express/TypeScript prototype
├── sample_data/                 # Legacy CSV input examples
├── timetable_scheduler.py       # Standalone/legacy Python script
├── requirements.txt             # Python dependencies
├── package.json                 # JavaScript dependencies and scripts
└── vite.config.ts               # Vite configuration and API proxy
```

## Prerequisites

- Node.js 20 or later and npm
- Python 3.10 or later
- A running PostgreSQL instance and permission to create/use a database

## Local setup

1. Create a PostgreSQL database. For example, using a local PostgreSQL installation:

   ```bash
   createdb school
   ```

2. Install frontend dependencies and create a Python virtual environment:

   ```bash
   npm install
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Set the database connection string. `backend/database.py` uses the following development default when `DATABASE_URL` is unset:

   ```text
   postgresql+psycopg://jitendra@localhost:5432/school
   ```

   Override it for your environment before running the backend:

   ```bash
   export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:5432/DB_NAME'
   ```

   `postgres://...` and `postgresql://...` URLs are normalised to SQLAlchemy's `postgresql+psycopg://` form by the application.

4. Initialise tables, seed the baseline school data, and generate its first feasible timetable:

   ```bash
   npm run db:seed
   ```

   Seeding does nothing when at least one teacher already exists. To deliberately replace existing data, run the Python seed module with `--force`; this deletes timetable, curriculum, room, bell schedule, and school records before reseeding.

   ```bash
   .venv/bin/python -m backend.seed --force
   ```

5. Start the API and frontend in separate terminals:

   ```bash
   # Terminal 1
   npm run dev:api

   # Terminal 2
   npm run dev
   ```

   Open `http://localhost:5173`. Vite forwards `/api/*` to `http://127.0.0.1:8000`.

### Production-style run

Build the SPA first, then launch FastAPI. When `dist/` is present at application startup, FastAPI serves it alongside the API on port 8000.

```bash
npm run build
npm start
```

## Environment configuration

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Active Python backend | PostgreSQL SQLAlchemy URL. This is the only runtime environment variable consumed by the current FastAPI application. |
| `DISABLE_HMR` | Vite config | Disables HMR/file watching when set to `true`. |
| `GEMINI_API_KEY` | `.env.example` only | Documented from the original AI Studio template; it is not used by the active source path. |
| `APP_URL` | `.env.example` only | Template value; it is not read by the active source path. |

Do not commit real database passwords or API keys. The supplied `.env.example` is template metadata, not the database configuration contract.

## Frontend documentation

The application does not use a client router. `App.tsx` switches among three tabs and holds the loaded application state.

| Area | Components and behaviour |
| --- | --- |
| Timetable | `TimetableGrid` renders weekly schedules in class, teacher, room, and master modes. It reads dynamic bell times, shows session details, and initiates PDF export. |
| Schedule generation | `AutoScheduleModal` posts a solve request with a 15-second limit and four workers by default, then displays solver metrics and replaces the in-memory assignments. |
| Curriculum & directory | `InputDataViewer` provides search and CRUD modals for courses, teachers, rooms, and groups. Courses also support validated bulk creation. |
| Bell schedule | `BellScheduleEditor` edits academic periods and breaks, saves them to the API, and can restore defaults. |
| School profile | `SchoolProfileModal` updates institutional and contact metadata. |
| Feedback | Toast and confirmation components give success/error feedback and protect destructive UI actions. |

On first render, the UI requests `/api/curriculum`, `/api/bell-schedule`, and `/api/timetable` concurrently. The bundled values in `src/data/sampleData.ts` let the screens render if these requests fail; changes made while the API is unavailable are not persisted.

## Backend documentation

FastAPI starts with a lifespan hook that calls `init_and_seed_db(force=False)`. This creates missing tables and seeds only an empty database. API input/output contracts are defined in `backend/schemas.py`; SQLAlchemy mappings are in `backend/models.py`.

The service enables permissive CORS (`allow_origins=["*"]`) and does not implement authentication or authorisation. It should therefore be put behind appropriate access control before exposure outside a trusted environment.

### API reference

FastAPI also exposes its generated interactive API documentation at `/docs` while the backend is running.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Application status, database connectivity check, engine name, school, and scheduled-session count. |
| `GET` | `/api/school` | Current school profile. |
| `PUT` | `/api/school` | Update school profile. |
| `GET` | `/api/curriculum` | School, courses, teachers, rooms, groups, and the generated 5 × 8 time-slot list. |
| `POST` | `/api/courses` | Create one course. |
| `POST` | `/api/courses/bulk` | Atomically validate and create 1–100 courses. |
| `PUT` / `DELETE` | `/api/courses/{course_id}` | Update or delete a course. |
| `POST` | `/api/teachers` | Create a teacher. |
| `PUT` / `DELETE` | `/api/teachers/{teacher_id}` | Update or delete a teacher and related data as implemented. |
| `POST` | `/api/rooms` | Create a room. |
| `PUT` / `DELETE` | `/api/rooms/{room_id}` | Update or delete a room. |
| `POST` | `/api/groups` | Create a student group. |
| `PUT` / `DELETE` | `/api/groups/{group_id}` | Update or delete a student group. |
| `GET` | `/api/bell-schedule` | Read ordered academic periods and breaks. |
| `PUT` | `/api/bell-schedule` | Replace the stored bell schedule. |
| `POST` | `/api/bell-schedule/reset` | Restore the seeded bell schedule. |
| `GET` | `/api/timetable` | Latest active timetable (or most recent one), its assignments, metrics, and logs. |
| `POST` | `/api/solve` | Run CP-SAT against live database data, archive prior active schedules, store a new successful result, and return it. |
| `GET` | `/api/download/excel` | Download the active timetable as an Excel workbook. |
| `GET` | `/api/download/csv` | Download the active timetable as a flat CSV file. |

Example solve request:

```bash
curl -X POST http://localhost:8000/api/solve \
  -H 'Content-Type: application/json' \
  -d '{
    "timeLimit": 15,
    "workers": 4,
    "balanceWorkload": true,
    "labRouting": true,
    "evenSpread": true
  }'
```

`timeLimit` accepts 3–120 seconds and `workers` accepts 1–16. A response includes `status`, elapsed solve time, branch/conflict counts, objective value, assignments, solver logs, and a flat CSV string for successful solves.

## Data model

| Table | Key fields | Purpose and relationships |
| --- | --- | --- |
| `schools` | `id`, name, academic year, term, principal/coordinator, contact fields | Holds the institution profile. The API reads/updates the first school record. |
| `teachers` | `teacher_id`, name, `max_hours_per_day`, `unavailable_times`, department, homeroom, email | Staff availability and capacity. One teacher can own many courses. |
| `courses` | `course_id`, name, `weekly_periods`, `teacher_id`, `lab_required`, department, colour | A subject offering. Its teacher is a foreign key to `teachers`. |
| `rooms` | `room_id`, name, capacity, `is_lab`, room type | Physical resources used during assignment. |
| `student_groups` | `group_id`, name, student count, enrolled course IDs, grade, homeroom fields | A class/section. Enrolled course IDs are stored as a comma-separated string and returned as an array by the API. |
| `bell_periods` | ID, period number, name, start/end, type, note, order | Ordered academic periods and breaks. Breaks use period `0`. |
| `timetables` | ID, name, status, solver metrics/logs, created time | A solve result revision. New successful results become `ACTIVE`; older active results are marked `ARCHIVED`. |
| `assignments` | timetable ID, day, period, group, course, teacher, room, lab flag | One scheduled session. It references its timetable, group, course, teacher, and room. |

### Seed data

`backend/seed.py` seeds the following baseline data:

- 1 school profile: Oakridge International High School, academic year 2025–2026, Term 1.
- 9 teachers with daily caps and unavailability values such as `Mon:1` or `Wed:5, Wed:6`.
- 8 rooms: 3 homerooms, science/computer labs, an art studio, sports field, and library.
- 3 student groups with 28–32 students.
- 27 course offerings: nine subjects for each group, with weekly requirements totalling 40 sessions per group and 120 sessions per week overall.
- 8 academic periods (08:00–14:45) plus a 45-minute lunch break after period 4.

Teacher unavailability is stored as comma-separated `Day:Period` tokens, for example `Mon:1, Fri:6`. The solver accepts common weekday abbreviations and full weekday names when parsing them.

## Scheduling engine

The CP-SAT model creates Boolean decision variables for valid `(course, teacher, group, room, day, period)` combinations. Before doing so it prunes a course's room domain by student capacity and, when lab routing is enabled, by lab suitability.

### Enforced constraints

1. Each group-course combination receives its exact `weekly_periods` quota.
2. A teacher cannot teach more than one assignment in the same time slot.
3. A student group cannot have more than one assignment in the same time slot.
4. A room cannot have more than one assignment in the same time slot.
5. When workload balancing is enabled, each teacher's scheduled periods per day cannot exceed `max_hours_per_day`.
6. Variables are not created for a teacher's unavailable time slots.

### Objectives

When enabled, the model maximises a weighted objective that:

- penalises assigning a normal subject more than once in the same day (labs may have a higher daily allowance);
- penalises internal teacher idle gaps;
- rewards consecutive periods for multi-period lab courses.

Two implementation details are important when interpreting a result:

- `labRouting` is a preference exposed in the request. If no capacity-suitable lab exists for a lab-required course, the solver falls back to any capacity-suitable room instead of making the model impossible.
- The current code only applies the teacher daily-cap constraint and teacher-gap objective when `balanceWorkload` is true. It does not currently implement a separate student-gap objective despite the broader product description sometimes referring to one.

## Exports

| Output | Source | Contents |
| --- | --- | --- |
| PDF | Browser (`exportPdf.ts`) | Filtered timetable or one class page per group in master mode, rendered with current bell times. |
| Excel (`.xlsx`) | `GET /api/download/excel` | An OpenPyXL-generated workbook containing overview, master matrix, class grids, and teacher workload sheets. |
| CSV | `GET /api/download/csv` or solve response | A flat list of day, period, group, course, teacher, room, and lab flag. |

## Available npm scripts

| Command | Description |
| --- | --- |
| `npm run dev` / `npm run dev:ui` | Start Vite development server (normally port 5173). |
| `npm run dev:api` | Start Uvicorn with FastAPI reload on port 8000. Requires `.venv` created in the repository. |
| `npm run db:seed` | Initialise and seed the PostgreSQL database. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm start` | Run FastAPI on port 8000; serves `dist/` when it exists at startup. |
| `npm run preview` | Preview the Vite production build. |
| `npm run lint` | Run TypeScript type checking with `tsc --noEmit`. |
| `npm run clean` | Remove `dist/` and `server.js`. |

## Development notes and limitations

- The active backend expects PostgreSQL; SQLite is not configured or tested here.
- The weekly solve domain is fixed in code to Monday–Friday and periods 1–8. Editing bell times changes display and export timings, but does not change the solver's weekday/period count.
- Database schema evolution is deliberately lightweight: startup adds missing school-contact columns, but broader model migrations are not managed with Alembic.
- Destructive CRUD actions can remove related assignments. Regenerate a timetable after substantive curriculum, room, group, or teacher changes.
- The older Express implementation, standalone Python scheduler, CSV examples, and generated workbook files are retained for reference. Use the React + FastAPI path described above for the maintained application.
- There are no automated test scripts in `package.json` or `requirements.txt`; `npm run lint` is the available frontend verification command.

## Suggested operating workflow

1. Update school profile and bell timings.
2. Add or adjust teachers, rooms, subjects, and student-group enrolments.
3. Confirm each course has a valid teacher and sufficient capacity/resources exist for all groups.
4. Generate the timetable and review its status and metrics.
5. Inspect the result in class, teacher, room, and master views.
6. Export the approved timetable, noting that later solves archive the prior active schedule.
