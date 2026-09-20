from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, default="Oakridge International High School")
    academic_year = Column(String(50), default="2025 - 2026")
    term = Column(String(50), default="Term 1 (Fall Semester)")
    principal_name = Column(String(255), default="")
    coordinator_name = Column(String(255), default="")
    address = Column(Text, default="")
    phone = Column(String(50), default="")
    email = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(String(100), primary_key=True)
    teacher_name = Column(String(255), nullable=False)
    max_hours_per_day = Column(Integer, default=5)
    unavailable_times = Column(Text, default="")  # e.g., "Mon:1, Fri:6"
    department = Column(String(100), default="General")
    homeroom_class = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)

    courses = relationship("Course", back_populates="teacher", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(String(100), primary_key=True)
    room_name = Column(String(255), nullable=True)
    room_capacity = Column(Integer, default=35)
    is_lab = Column(Boolean, default=False)
    room_type = Column(String(100), default="Classroom")


class StudentGroup(Base):
    __tablename__ = "student_groups"

    group_id = Column(String(100), primary_key=True)
    group_name = Column(String(255), nullable=False)
    student_count = Column(Integer, default=30)
    enrolled_courses = Column(Text, default="")  # Comma-separated course IDs
    grade_level = Column(String(50), default="9")
    homeroom_teacher = Column(String(100), nullable=True)
    homeroom_room_id = Column(String(100), nullable=True)


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(String(100), primary_key=True)
    course_name = Column(String(255), nullable=False)
    weekly_periods = Column(Integer, default=5)
    teacher_id = Column(String(100), ForeignKey("teachers.teacher_id", ondelete="CASCADE"), nullable=False)
    lab_required = Column(Boolean, default=False)
    department = Column(String(100), default="General")
    color_code = Column(String(50), nullable=True)

    teacher = relationship("Teacher", back_populates="courses")


class BellPeriod(Base):
    __tablename__ = "bell_periods"

    id = Column(String(50), primary_key=True)  # e.g. "p1", "b1"
    period = Column(Integer, default=1)        # 0 for breaks
    name = Column(String(100), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    period_type = Column(String(50), default="academic")  # "academic" | "break"
    note = Column(Text, default="")
    order_index = Column(Integer, default=0)


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), default="Academic Timetable")
    status = Column(String(50), default="ACTIVE")  # "ACTIVE", "ARCHIVED", "DRAFT"
    solver_status = Column(String(50), default="OPTIMAL")
    solve_time_seconds = Column(Float, default=0.0)
    branches = Column(Integer, default=0)
    conflicts = Column(Integer, default=0)
    objective_value = Column(Float, default=0.0)
    logs = Column(Text, default="[]")  # JSON string
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    assignments = relationship("Assignment", back_populates="timetable", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    day = Column(String(10), nullable=False)  # "Mon", "Tue", "Wed", "Thu", "Fri"
    period = Column(Integer, nullable=False)   # 1 to 8
    group_id = Column(String(100), ForeignKey("student_groups.group_id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(100), ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(String(100), ForeignKey("teachers.teacher_id", ondelete="CASCADE"), nullable=False)
    room_id = Column(String(100), ForeignKey("rooms.room_id", ondelete="CASCADE"), nullable=False)
    is_lab = Column(Boolean, default=False)

    timetable = relationship("Timetable", back_populates="assignments")
