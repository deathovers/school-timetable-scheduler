import json
import logging
from sqlalchemy.orm import Session
from .database import Base, SessionLocal, engine
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
from .solver import (
    SolverCourse,
    SolverGroup,
    SolverRoom,
    SolverTeacher,
    execute_cpsat_solver,
    parse_unavailable_string,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SeedDatabase")

SEED_COURSES = [
    # Grade 9-A
    {"course_id": "MATH09_A", "course_name": "Mathematics", "weekly_periods": 7, "teacher_id": "T_AMIT_SHARMA", "lab_required": False, "department": "Mathematics"},
    {"course_id": "SCI09_A", "course_name": "Science", "weekly_periods": 6, "teacher_id": "T_RAJESH_KUMAR", "lab_required": True, "department": "Science"},
    {"course_id": "BIO09_A", "course_name": "Hindi Course A", "weekly_periods": 5, "teacher_id": "T_PRIYA_SINGH", "lab_required": False, "department": "Hindi"},
    {"course_id": "ENG09_A", "course_name": "English Language & Literature", "weekly_periods": 6, "teacher_id": "T_ANJALI_GUPTA", "lab_required": False, "department": "English"},
    {"course_id": "SOC09_A", "course_name": "Social Science", "weekly_periods": 6, "teacher_id": "T_SURESH_VERMA", "lab_required": False, "department": "Social Science"},
    {"course_id": "CS09_A", "course_name": "Information Technology", "weekly_periods": 4, "teacher_id": "T_POOJA_MEHTA", "lab_required": True, "department": "Technology"},
    {"course_id": "PE09_A", "course_name": "Physical Education", "weekly_periods": 2, "teacher_id": "T_VIKRAM_YADAV", "lab_required": False, "department": "Athletics"},
    {"course_id": "ART09_A", "course_name": "Art Education", "weekly_periods": 2, "teacher_id": "T_KAVITA_JOSHI", "lab_required": False, "department": "Fine Arts"},
    {"course_id": "LIB09_A", "course_name": "Library & Reading", "weekly_periods": 2, "teacher_id": "T_SANDEEP_PATEL", "lab_required": False, "department": "Resource"},

    # Grade 9-B
    {"course_id": "MATH09_B", "course_name": "Mathematics", "weekly_periods": 7, "teacher_id": "T_AMIT_SHARMA", "lab_required": False, "department": "Mathematics"},
    {"course_id": "SCI09_B", "course_name": "Science", "weekly_periods": 6, "teacher_id": "T_RAJESH_KUMAR", "lab_required": True, "department": "Science"},
    {"course_id": "BIO09_B", "course_name": "Hindi Course A", "weekly_periods": 5, "teacher_id": "T_PRIYA_SINGH", "lab_required": False, "department": "Hindi"},
    {"course_id": "ENG09_B", "course_name": "English Language & Literature", "weekly_periods": 6, "teacher_id": "T_ANJALI_GUPTA", "lab_required": False, "department": "English"},
    {"course_id": "SOC09_B", "course_name": "Social Science", "weekly_periods": 6, "teacher_id": "T_SURESH_VERMA", "lab_required": False, "department": "Social Science"},
    {"course_id": "CS09_B", "course_name": "Information Technology", "weekly_periods": 4, "teacher_id": "T_POOJA_MEHTA", "lab_required": True, "department": "Technology"},
    {"course_id": "PE09_B", "course_name": "Physical Education", "weekly_periods": 2, "teacher_id": "T_VIKRAM_YADAV", "lab_required": False, "department": "Athletics"},
    {"course_id": "ART09_B", "course_name": "Art Education", "weekly_periods": 2, "teacher_id": "T_KAVITA_JOSHI", "lab_required": False, "department": "Fine Arts"},
    {"course_id": "LIB09_B", "course_name": "Library & Reading", "weekly_periods": 2, "teacher_id": "T_SANDEEP_PATEL", "lab_required": False, "department": "Resource"},

    # Grade 10-A
    {"course_id": "MATH10_A", "course_name": "Mathematics", "weekly_periods": 7, "teacher_id": "T_AMIT_SHARMA", "lab_required": False, "department": "Mathematics"},
    {"course_id": "SCI10_A", "course_name": "Science", "weekly_periods": 6, "teacher_id": "T_RAJESH_KUMAR", "lab_required": True, "department": "Science"},
    {"course_id": "BIO10_A", "course_name": "Hindi Course A", "weekly_periods": 5, "teacher_id": "T_PRIYA_SINGH", "lab_required": False, "department": "Hindi"},
    {"course_id": "ENG10_A", "course_name": "English Language & Literature", "weekly_periods": 6, "teacher_id": "T_ANJALI_GUPTA", "lab_required": False, "department": "English"},
    {"course_id": "SOC10_A", "course_name": "Social Science", "weekly_periods": 6, "teacher_id": "T_SURESH_VERMA", "lab_required": False, "department": "Social Science"},
    {"course_id": "CS10_A", "course_name": "Information Technology", "weekly_periods": 4, "teacher_id": "T_POOJA_MEHTA", "lab_required": True, "department": "Technology"},
    {"course_id": "PE10_A", "course_name": "Physical Education", "weekly_periods": 2, "teacher_id": "T_VIKRAM_YADAV", "lab_required": False, "department": "Athletics"},
    {"course_id": "ART10_A", "course_name": "Art Education", "weekly_periods": 2, "teacher_id": "T_KAVITA_JOSHI", "lab_required": False, "department": "Fine Arts"},
    {"course_id": "LIB10_A", "course_name": "Library & Reading", "weekly_periods": 2, "teacher_id": "T_SANDEEP_PATEL", "lab_required": False, "department": "Resource"},
]

SEED_TEACHERS = [
    {"teacher_id": "T_AMIT_SHARMA", "teacher_name": "Mr. Amit Sharma", "max_hours_per_day": 5, "unavailable_times": "Fri:8", "department": "Mathematics"},
    {"teacher_id": "T_RAJESH_KUMAR", "teacher_name": "Mr. Rajesh Kumar", "max_hours_per_day": 5, "unavailable_times": "Wed:5, Wed:6", "department": "Science"},
    {"teacher_id": "T_PRIYA_SINGH", "teacher_name": "Ms. Priya Singh", "max_hours_per_day": 4, "unavailable_times": "Tue:1", "department": "Hindi"},
    {"teacher_id": "T_ANJALI_GUPTA", "teacher_name": "Ms. Anjali Gupta", "max_hours_per_day": 5, "unavailable_times": "Mon:1", "department": "English"},
    {"teacher_id": "T_SURESH_VERMA", "teacher_name": "Mr. Suresh Verma", "max_hours_per_day": 5, "unavailable_times": "Thu:1", "department": "Social Science"},
    {"teacher_id": "T_POOJA_MEHTA", "teacher_name": "Ms. Pooja Mehta", "max_hours_per_day": 4, "unavailable_times": "Fri:7, Fri:8", "department": "Information Technology"},
    {"teacher_id": "T_VIKRAM_YADAV", "teacher_name": "Mr. Vikram Yadav", "max_hours_per_day": 3, "unavailable_times": "Mon:8", "department": "Physical Education"},
    {"teacher_id": "T_KAVITA_JOSHI", "teacher_name": "Mrs. Kavita Joshi", "max_hours_per_day": 3, "unavailable_times": "", "department": "Art Education"},
    {"teacher_id": "T_SANDEEP_PATEL", "teacher_name": "Mr. Sandeep Patel", "max_hours_per_day": 3, "unavailable_times": "", "department": "Library & Reading"},
]

SEED_ROOMS = [
    {"room_id": "RM-101", "room_name": "Class 9-A Homeroom", "room_capacity": 35, "is_lab": False, "room_type": "Classroom"},
    {"room_id": "RM-102", "room_name": "Class 9-B Homeroom", "room_capacity": 35, "is_lab": False, "room_type": "Classroom"},
    {"room_id": "RM-201", "room_name": "Class 10-A Homeroom", "room_capacity": 35, "is_lab": False, "room_type": "Classroom"},
    {"room_id": "SCI-LAB", "room_name": "Composite Science & Physics Lab", "room_capacity": 36, "is_lab": True, "room_type": "Science Lab"},
    {"room_id": "COMP-LAB", "room_name": "Computer & Robotics Lab", "room_capacity": 32, "is_lab": True, "room_type": "Computer Lab"},
    {"room_id": "ART-STUDIO", "room_name": "Visual Arts Workshop", "room_capacity": 32, "is_lab": False, "room_type": "Art Studio"},
    {"room_id": "GYM-FIELD", "room_name": "Sports Complex & Field", "room_capacity": 65, "is_lab": False, "room_type": "Sports Ground"},
    {"room_id": "LIBRARY", "room_name": "Central School Library", "room_capacity": 45, "is_lab": False, "room_type": "Library"},
]

SEED_GROUPS = [
    {"group_id": "G9-A", "group_name": "Grade 9 - Section A", "student_count": 32, "enrolled_courses": "MATH09_A, SCI09_A, BIO09_A, ENG09_A, SOC09_A, CS09_A, PE09_A, ART09_A, LIB09_A", "grade_level": "9"},
    {"group_id": "G9-B", "group_name": "Grade 9 - Section B", "student_count": 30, "enrolled_courses": "MATH09_B, SCI09_B, BIO09_B, ENG09_B, SOC09_B, CS09_B, PE09_B, ART09_B, LIB09_B", "grade_level": "9"},
    {"group_id": "G10-A", "group_name": "Grade 10 - Section A", "student_count": 28, "enrolled_courses": "MATH10_A, SCI10_A, BIO10_A, ENG10_A, SOC10_A, CS10_A, PE10_A, ART10_A, LIB10_A", "grade_level": "10"},
]

SEED_BELL_PERIODS = [
    {"id": "p1", "period": 1, "name": "Period 1", "start_time": "08:00", "end_time": "08:45", "period_type": "academic", "note": "Morning Academic Session", "order_index": 1},
    {"id": "p2", "period": 2, "name": "Period 2", "start_time": "08:45", "end_time": "09:30", "period_type": "academic", "note": "Core Academic Block", "order_index": 2},
    {"id": "p3", "period": 3, "name": "Period 3", "start_time": "09:30", "end_time": "10:15", "period_type": "academic", "note": "Mid-Morning Session", "order_index": 3},
    {"id": "p4", "period": 4, "name": "Period 4", "start_time": "10:15", "end_time": "11:00", "period_type": "academic", "note": "Pre-Lunch Block", "order_index": 4},
    {"id": "b1", "period": 0, "name": "Lunch Break", "start_time": "11:00", "end_time": "11:45", "period_type": "break", "note": "Lunch & Recreation (45 mins)", "order_index": 5},
    {"id": "p5", "period": 5, "name": "Period 5", "start_time": "11:45", "end_time": "12:30", "period_type": "academic", "note": "Post-Lunch Session", "order_index": 6},
    {"id": "p6", "period": 6, "name": "Period 6", "start_time": "12:30", "end_time": "13:15", "period_type": "academic", "note": "Afternoon Academic Block", "order_index": 7},
    {"id": "p7", "period": 7, "name": "Period 7", "start_time": "13:15", "end_time": "14:00", "period_type": "academic", "note": "Practical / Core", "order_index": 8},
    {"id": "p8", "period": 8, "name": "Period 8", "start_time": "14:00", "end_time": "14:45", "period_type": "academic", "note": "Co-Curricular / Activity / Dismissal", "order_index": 9},
]


def init_and_seed_db(force: bool = False):
    """
    Initializes PostgreSQL tables and seeds data if empty or forced.
    """
    logger.info("Ensuring PostgreSQL tables exist...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        teacher_count = db.query(Teacher).count()
        if teacher_count > 0 and not force:
            logger.info("Database already contains data (%d teachers). Skipping initial seed.", teacher_count)
            return

        logger.info("Seeding school curriculum, faculty, rooms, groups, and bell timings...")
        if force:
            db.query(Assignment).delete()
            db.query(Timetable).delete()
            db.query(Course).delete()
            db.query(Teacher).delete()
            db.query(Room).delete()
            db.query(StudentGroup).delete()
            db.query(BellPeriod).delete()
            db.query(School).delete()
            db.commit()

        # Seed School
        school = School(
            name="Oakridge International High School",
            academic_year="2025 - 2026",
            term="Term 1 (Fall Semester)",
        )
        db.add(school)

        # Seed Teachers
        for t in SEED_TEACHERS:
            db.add(Teacher(**t))
        db.commit()

        # Seed Rooms
        for r in SEED_ROOMS:
            db.add(Room(**r))
        db.commit()

        # Seed Groups
        for g in SEED_GROUPS:
            db.add(StudentGroup(**g))
        db.commit()

        # Seed Courses
        for c in SEED_COURSES:
            db.add(Course(**c))
        db.commit()

        # Seed Bell Periods
        for b in SEED_BELL_PERIODS:
            db.add(BellPeriod(**b))
        db.commit()

        logger.info("Curriculum data successfully seeded into PostgreSQL!")

        # Now run initial CP-SAT solve and save active timetable
        logger.info("Executing initial OR-Tools CP-SAT solve to establish baseline timetable...")
        solver_courses = {
            c.course_id: SolverCourse(
                course_id=c.course_id,
                course_name=c.course_name,
                weekly_periods=c.weekly_periods,
                teacher_id=c.teacher_id,
                lab_required=c.lab_required,
                department=c.department,
            )
            for c in db.query(Course).all()
        }
        solver_teachers = {
            t.teacher_id: SolverTeacher(
                teacher_id=t.teacher_id,
                teacher_name=t.teacher_name,
                max_hours_per_day=t.max_hours_per_day,
                unavailable_times=parse_unavailable_string(t.unavailable_times),
                department=t.department,
            )
            for t in db.query(Teacher).all()
        }
        solver_rooms = {
            r.room_id: SolverRoom(
                room_id=r.room_id,
                room_capacity=r.room_capacity,
                is_lab=r.is_lab,
                room_name=r.room_name or r.room_id,
            )
            for r in db.query(Room).all()
        }
        solver_groups = {
            g.group_id: SolverGroup(
                group_id=g.group_id,
                group_name=g.group_name,
                student_count=g.student_count,
                enrolled_courses=[c.strip() for c in g.enrolled_courses.split(",") if c.strip()],
            )
            for g in db.query(StudentGroup).all()
        }

        solve_result = execute_cpsat_solver(
            courses=solver_courses,
            teachers=solver_teachers,
            rooms=solver_rooms,
            groups=solver_groups,
            time_limit_seconds=15,
            workers=4,
            balance_workload=True,
            lab_routing=True,
            even_spread=True,
        )

        if solve_result["status"] in ("OPTIMAL", "FEASIBLE"):
            # Deactivate previous
            db.query(Timetable).update({"status": "ARCHIVED"})

            timetable = Timetable(
                name="Oakridge Fall 2025 Master Schedule",
                status="ACTIVE",
                solver_status=solve_result["status"],
                solve_time_seconds=solve_result["solve_time_seconds"],
                branches=solve_result["branches"],
                conflicts=solve_result["conflicts"],
                objective_value=float(solve_result["objective_value"] or 0.0),
                logs=json.dumps(solve_result["logs"]),
            )
            db.add(timetable)
            db.flush()

            for a in solve_result["assignments"]:
                assignment = Assignment(
                    timetable_id=timetable.id,
                    day=a["day"],
                    period=a["period"],
                    group_id=a["group_id"],
                    course_id=a["course_id"],
                    teacher_id=a["teacher_id"],
                    room_id=a["room_id"],
                    is_lab=a["is_lab"],
                )
                db.add(assignment)

            db.commit()
            logger.info("Successfully established active timetable with %d scheduled sessions in PostgreSQL!", len(solve_result["assignments"]))
        else:
            logger.warning("Initial solve returned status %s: no active timetable saved.", solve_result["status"])

    except Exception as e:
        logger.error("Error during database seed: %s", e)
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    force_seed = "--force" in sys.argv
    init_and_seed_db(force=force_seed)

