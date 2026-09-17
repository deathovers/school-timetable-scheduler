from contextlib import asynccontextmanager
import io
import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db
from .excel_generator import generate_timetable_excel_bytes
from .models import (
    Assignment,
    BellPeriod,
    Course,
    Room,
    School,
    StudentGroup,
    Teacher,
    Timetable,
)
from .schemas import (
    AssignmentSchema,
    BellItemSchema,
    BellScheduleUpdate,
    CourseSchema,
    CurriculumResponse,
    RoomSchema,
    SchoolSchema,
    SolveRequest,
    SolveResponse,
    StudentGroupSchema,
    TeacherSchema,
    TimeSlotSchema,
)
from .seed import SEED_BELL_PERIODS, init_and_seed_db
from .solver import (
    SolverCourse,
    SolverGroup,
    SolverRoom,
    SolverTeacher,
    execute_cpsat_solver,
    parse_unavailable_string,
)

logger = logging.getLogger("TimetableAPI")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed if database is empty
    logger.info("[STARTUP] Checking and initializing database schema...")
    try:
        init_and_seed_db(force=False)
    except Exception as e:
        logger.error("[STARTUP ERROR] Database initialization error: %s", e)
    yield


app = FastAPI(
    title="School Timetable Scheduler API",
    description="Production-grade timetable optimizer powered by PostgreSQL and Google OR-Tools CP-SAT",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# 1. Health Endpoint
# -----------------------------------------------------------------------------
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        school = db.query(School).first()
        inst_name = school.name if school else "School Timetable Scheduler"
        assignment_count = db.query(Assignment).count()
        return {
            "status": "ok",
            "app": "School Timetable Scheduler",
            "database": "PostgreSQL",
            "engine": "Google OR-Tools CP-SAT",
            "institution": inst_name,
            "scheduled_sessions": assignment_count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connectivity check failed: {e}",
        )


# -----------------------------------------------------------------------------
# 2. School Info
# -----------------------------------------------------------------------------
@app.get("/api/school", response_model=SchoolSchema)
def get_school(db: Session = Depends(get_db)):
    school = db.query(School).first()
    if not school:
        return SchoolSchema()
    return SchoolSchema(
        name=school.name,
        academic_year=school.academic_year,
        term=school.term,
    )


# -----------------------------------------------------------------------------
# 3. Curriculum & Staff Directory
# -----------------------------------------------------------------------------
@app.get("/api/curriculum", response_model=CurriculumResponse)
def get_curriculum(db: Session = Depends(get_db)):
    school = db.query(School).first()
    school_data = (
        SchoolSchema(name=school.name, academic_year=school.academic_year, term=school.term)
        if school
        else SchoolSchema()
    )

    courses = [
        CourseSchema(
            course_id=c.course_id,
            course_name=c.course_name,
            weekly_periods=c.weekly_periods,
            teacher_id=c.teacher_id,
            lab_required=c.lab_required,
            department=c.department,
            color_code=c.color_code,
        )
        for c in db.query(Course).all()
    ]

    teachers = [
        TeacherSchema(
            teacher_id=t.teacher_id,
            teacher_name=t.teacher_name,
            max_hours_per_day=t.max_hours_per_day,
            unavailable_times=t.unavailable_times or "",
            department=t.department,
            email=t.email,
        )
        for t in db.query(Teacher).all()
    ]

    rooms = [
        RoomSchema(
            room_id=r.room_id,
            room_capacity=r.room_capacity,
            is_lab=r.is_lab,
            room_name=r.room_name,
            room_type=r.room_type,
        )
        for r in db.query(Room).all()
    ]

    groups = [
        StudentGroupSchema(
            group_id=g.group_id,
            group_name=g.group_name,
            student_count=g.student_count,
            enrolled_courses=[c.strip() for c in g.enrolled_courses.split(",") if c.strip()],
            grade_level=g.grade_level,
        )
        for g in db.query(StudentGroup).all()
    ]

    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    time_slots = [
        TimeSlotSchema(day=d, period=p)
        for d in days
        for p in range(1, 9)
    ]

    return CurriculumResponse(
        school=school_data,
        courses=courses,
        teachers=teachers,
        rooms=rooms,
        groups=groups,
        timeSlots=time_slots,
    )


# -----------------------------------------------------------------------------
# 4. Bell Schedule Persistence (PostgreSQL)
# -----------------------------------------------------------------------------
@app.get("/api/bell-schedule", response_model=List[BellItemSchema])
def get_bell_schedule(db: Session = Depends(get_db)):
    periods = db.query(BellPeriod).order_by(BellPeriod.order_index).all()
    if not periods:
        return [
            BellItemSchema(
                id=b["id"],
                period=b["period"],
                name=b["name"],
                startTime=b["start_time"],
                endTime=b["end_time"],
                type=b["period_type"],
                note=b["note"],
            )
            for b in SEED_BELL_PERIODS
        ]
    return [
        BellItemSchema(
            id=p.id,
            period=p.period,
            name=p.name,
            startTime=p.start_time,
            endTime=p.end_time,
            type=p.period_type,
            note=p.note or "",
        )
        for p in periods
    ]


@app.put("/api/bell-schedule", response_model=List[BellItemSchema])
def update_bell_schedule(payload: BellScheduleUpdate, db: Session = Depends(get_db)):
    try:
        db.query(BellPeriod).delete()
        for idx, item in enumerate(payload.schedule, start=1):
            bp = BellPeriod(
                id=item.id,
                period=item.period,
                name=item.name,
                start_time=item.startTime,
                end_time=item.endTime,
                period_type=item.type,
                note=item.note or "",
                order_index=idx,
            )
            db.add(bp)
        db.commit()
        return get_bell_schedule(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bell schedule in PostgreSQL: {e}",
        )


@app.post("/api/bell-schedule/reset", response_model=List[BellItemSchema])
def reset_bell_schedule(db: Session = Depends(get_db)):
    try:
        db.query(BellPeriod).delete()
        for b in SEED_BELL_PERIODS:
            db.add(BellPeriod(**b))
        db.commit()
        return get_bell_schedule(db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset bell schedule: {e}",
        )


# -----------------------------------------------------------------------------
# 5. Active Timetable
# -----------------------------------------------------------------------------
@app.get("/api/timetable")
def get_active_timetable(db: Session = Depends(get_db)):
    active_tt = db.query(Timetable).filter(Timetable.status == "ACTIVE").order_by(Timetable.id.desc()).first()
    if not active_tt:
        # Fallback to any recent timetable
        active_tt = db.query(Timetable).order_by(Timetable.id.desc()).first()

    if not active_tt:
        return {"assignments": [], "metrics": None}

    # Fetch assignments and join with course, teacher, group details
    assignments_query = (
        db.query(
            Assignment.day,
            Assignment.period,
            Assignment.is_lab,
            Assignment.course_id,
            Course.course_name,
            Course.department,
            Assignment.teacher_id,
            Teacher.teacher_name,
            Assignment.group_id,
            StudentGroup.group_name,
            Assignment.room_id,
        )
        .join(Course, Assignment.course_id == Course.course_id)
        .join(Teacher, Assignment.teacher_id == Teacher.teacher_id)
        .join(StudentGroup, Assignment.group_id == StudentGroup.group_id)
        .filter(Assignment.timetable_id == active_tt.id)
        .all()
    )

    days_order = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4}
    results = [
        {
            "day": a.day,
            "period": a.period,
            "is_lab": a.is_lab,
            "course_id": a.course_id,
            "course_name": a.course_name,
            "department": a.department,
            "teacher_id": a.teacher_id,
            "teacher_name": a.teacher_name,
            "group_id": a.group_id,
            "group_name": a.group_name,
            "room_id": a.room_id,
        }
        for a in assignments_query
    ]
    results.sort(key=lambda x: (days_order.get(x["day"], 99), x["period"], x["group_id"]))

    logs = []
    try:
        if active_tt.logs:
            logs = json.loads(active_tt.logs)
    except Exception:
        pass

    return {
        "id": active_tt.id,
        "name": active_tt.name,
        "status": active_tt.solver_status,
        "solve_time_seconds": active_tt.solve_time_seconds,
        "branches": active_tt.branches,
        "conflicts": active_tt.conflicts,
        "objective_value": active_tt.objective_value,
        "assignments": results,
        "logs": logs,
    }


# -----------------------------------------------------------------------------
# 6. Live OR-Tools CP-SAT Solve
# -----------------------------------------------------------------------------
@app.post("/api/solve", response_model=SolveResponse)
def solve_timetable(req: SolveRequest, db: Session = Depends(get_db)):
    logger.info(
        "[API SOLVE] Request: timeLimit=%ds, workers=%d, balanceWorkload=%s, labRouting=%s, evenSpread=%s",
        req.timeLimit,
        req.workers,
        req.balanceWorkload,
        req.labRouting,
        req.evenSpread,
    )

    # 1. Read entities from PostgreSQL
    db_courses = db.query(Course).all()
    db_teachers = db.query(Teacher).all()
    db_rooms = db.query(Room).all()
    db_groups = db.query(StudentGroup).all()

    if not db_courses or not db_teachers or not db_rooms or not db_groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incomplete school curriculum data in PostgreSQL. Run seed first.",
        )

    solver_courses = {
        c.course_id: SolverCourse(
            course_id=c.course_id,
            course_name=c.course_name,
            weekly_periods=c.weekly_periods,
            teacher_id=c.teacher_id,
            lab_required=c.lab_required,
            department=c.department,
        )
        for c in db_courses
    }
    solver_teachers = {
        t.teacher_id: SolverTeacher(
            teacher_id=t.teacher_id,
            teacher_name=t.teacher_name,
            max_hours_per_day=t.max_hours_per_day,
            unavailable_times=parse_unavailable_string(t.unavailable_times),
            department=t.department,
        )
        for t in db_teachers
    }
    solver_rooms = {
        r.room_id: SolverRoom(
            room_id=r.room_id,
            room_capacity=r.room_capacity,
            is_lab=r.is_lab,
            room_name=r.room_name or r.room_id,
        )
        for r in db_rooms
    }
    solver_groups = {
        g.group_id: SolverGroup(
            group_id=g.group_id,
            group_name=g.group_name,
            student_count=g.student_count,
            enrolled_courses=[c.strip() for c in g.enrolled_courses.split(",") if c.strip()],
        )
        for g in db_groups
    }

    # 2. Execute OR-Tools CP-SAT
    solve_result = execute_cpsat_solver(
        courses=solver_courses,
        teachers=solver_teachers,
        rooms=solver_rooms,
        groups=solver_groups,
        time_limit_seconds=req.timeLimit,
        workers=req.workers,
        balance_workload=req.balanceWorkload,
        lab_routing=req.labRouting,
        even_spread=req.evenSpread,
    )

    if solve_result["status"] not in ("OPTIMAL", "FEASIBLE"):
        return SolveResponse(
            success=False,
            status=solve_result["status"],
            solve_time_seconds=solve_result["solve_time_seconds"],
            branches=solve_result["branches"],
            conflicts=solve_result["conflicts"],
            objective_value=0.0,
            assignments=[],
            logs=solve_result["logs"],
        )

    # 3. Persist new active timetable to PostgreSQL
    try:
        db.query(Timetable).update({"status": "ARCHIVED"})

        new_tt = Timetable(
            name=f"Generated Schedule ({solve_result['status']})",
            status="ACTIVE",
            solver_status=solve_result["status"],
            solve_time_seconds=solve_result["solve_time_seconds"],
            branches=solve_result["branches"],
            conflicts=solve_result["conflicts"],
            objective_value=float(solve_result["objective_value"] or 0.0),
            logs=json.dumps(solve_result["logs"]),
        )
        db.add(new_tt)
        db.flush()

        for a in solve_result["assignments"]:
            assign = Assignment(
                timetable_id=new_tt.id,
                day=a["day"],
                period=a["period"],
                group_id=a["group_id"],
                course_id=a["course_id"],
                teacher_id=a["teacher_id"],
                room_id=a["room_id"],
                is_lab=a["is_lab"],
            )
            db.add(assign)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Failed to persist solved timetable to database: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failed: {e}",
        )

    # 4. Generate CSV export string
    csv_lines = ["day,period,group_id,group_name,course_id,course_name,teacher_id,teacher_name,room_id,is_lab"]
    for a in solve_result["assignments"]:
        csv_lines.append(
            f"{a['day']},{a['period']},\"{a['group_id']}\",\"{a['group_name']}\",\"{a['course_id']}\",\"{a['course_name']}\",\"{a['teacher_id']}\",\"{a['teacher_name']}\",\"{a['room_id']}\",{'true' if a['is_lab'] else 'false'}"
        )
    csv_content = "\n".join(csv_lines)

    return SolveResponse(
        success=True,
        status=solve_result["status"],
        solve_time_seconds=solve_result["solve_time_seconds"],
        branches=solve_result["branches"],
        conflicts=solve_result["conflicts"],
        objective_value=solve_result["objective_value"],
        assignments=[AssignmentSchema(**a) for a in solve_result["assignments"]],
        logs=solve_result["logs"],
        csvContent=csv_content,
    )


# -----------------------------------------------------------------------------
# 7. Dynamic File Exports (Excel & CSV)
# -----------------------------------------------------------------------------
@app.get("/api/download/excel")
def download_excel(db: Session = Depends(get_db)):
    active_tt = db.query(Timetable).filter(Timetable.status == "ACTIVE").order_by(Timetable.id.desc()).first()
    if not active_tt:
        active_tt = db.query(Timetable).order_by(Timetable.id.desc()).first()

    if not active_tt:
        raise HTTPException(status_code=404, detail="No timetable generated yet.")

    assignments_query = (
        db.query(
            Assignment.day,
            Assignment.period,
            Assignment.is_lab,
            Assignment.course_id,
            Course.course_name,
            Course.department,
            Assignment.teacher_id,
            Teacher.teacher_name,
            Assignment.group_id,
            StudentGroup.group_name,
            Assignment.room_id,
        )
        .join(Course, Assignment.course_id == Course.course_id)
        .join(Teacher, Assignment.teacher_id == Teacher.teacher_id)
        .join(StudentGroup, Assignment.group_id == StudentGroup.group_id)
        .filter(Assignment.timetable_id == active_tt.id)
        .all()
    )

    assignments = [
        {
            "day": a.day,
            "period": a.period,
            "is_lab": a.is_lab,
            "course_id": a.course_id,
            "course_name": a.course_name,
            "department": a.department,
            "teacher_id": a.teacher_id,
            "teacher_name": a.teacher_name,
            "group_id": a.group_id,
            "group_name": a.group_name,
            "room_id": a.room_id,
        }
        for a in assignments_query
    ]

    school = db.query(School).first()
    teachers = [
        {"teacher_id": t.teacher_id, "teacher_name": t.teacher_name, "department": t.department, "max_hours_per_day": t.max_hours_per_day}
        for t in db.query(Teacher).all()
    ]
    bell_periods = [
        {"period": b.period, "startTime": b.start_time, "endTime": b.end_time}
        for b in db.query(BellPeriod).all()
    ]

    excel_stream = generate_timetable_excel_bytes(
        assignments=assignments,
        school_name=school.name if school else "Oakridge International High School",
        academic_year=school.academic_year if school else "2025 - 2026",
        term=school.term if school else "Term 1 (Fall Semester)",
        teachers=teachers,
        bell_schedule=bell_periods,
    )

    return Response(
        content=excel_stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=school_timetable_master.xlsx"},
    )


@app.get("/api/download/csv")
def download_csv(db: Session = Depends(get_db)):
    active_tt = db.query(Timetable).filter(Timetable.status == "ACTIVE").order_by(Timetable.id.desc()).first()
    if not active_tt:
        active_tt = db.query(Timetable).order_by(Timetable.id.desc()).first()

    if not active_tt:
        raise HTTPException(status_code=404, detail="No timetable generated yet.")

    assignments_query = (
        db.query(
            Assignment.day,
            Assignment.period,
            Assignment.is_lab,
            Assignment.course_id,
            Course.course_name,
            Assignment.teacher_id,
            Teacher.teacher_name,
            Assignment.group_id,
            StudentGroup.group_name,
            Assignment.room_id,
        )
        .join(Course, Assignment.course_id == Course.course_id)
        .join(Teacher, Assignment.teacher_id == Teacher.teacher_id)
        .join(StudentGroup, Assignment.group_id == StudentGroup.group_id)
        .filter(Assignment.timetable_id == active_tt.id)
        .all()
    )

    csv_lines = ["day,period,group_id,group_name,course_id,course_name,teacher_id,teacher_name,room_id,is_lab"]
    for a in assignments_query:
        csv_lines.append(
            f"{a.day},{a.period},\"{a.group_id}\",\"{a.group_name}\",\"{a.course_id}\",\"{a.course_name}\",\"{a.teacher_id}\",\"{a.teacher_name}\",\"{a.room_id}\",{'true' if a.is_lab else 'false'}"
        )

    return Response(
        content="\n".join(csv_lines),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=timetable_output.csv"},
    )


# -----------------------------------------------------------------------------
# 8. Static File Hosting (Production Bundle)
# -----------------------------------------------------------------------------
import os
from fastapi.staticfiles import StaticFiles

dist_dir = os.path.join(os.getcwd(), "dist")
if os.path.isdir(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

