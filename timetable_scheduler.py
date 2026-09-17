#!/usr/bin/env python3
"""
===============================================================================
Timetable Scheduler with Google OR-Tools CP-SAT Solver
===============================================================================
A production-grade constraint programming scheduler for academic institutions
(schools, universities, colleges). Models all hard constraints (zero-conflict,
room matching, room capacity, course requirements, teacher availability/limits)
and soft optimization constraints (uniform distribution, idle gap minimization,
and consecutive lab slot maximization).

Outputs formatted multi-sheet Excel workbooks and CSV files.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
import json
import logging
import os
from pathlib import Path
import re
import sys
import time
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

# Openpyxl for styled Excel generation
try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

# Google OR-Tools CP-SAT Solver
try:
    from ortools.sat.python import cp_model
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False


# -----------------------------------------------------------------------------
# Logging Setup
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("TimetableScheduler")


# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------
@dataclass
class Course:
    course_id: str
    course_name: str
    weekly_periods: int
    teacher_id: str
    lab_required: bool

    def __post_init__(self):
        self.course_id = str(self.course_id).strip()
        self.course_name = str(self.course_name).strip()
        self.weekly_periods = int(self.weekly_periods)
        self.teacher_id = str(self.teacher_id).strip()
        self.lab_required = bool(self.lab_required)


@dataclass
class Teacher:
    teacher_id: str
    teacher_name: str
    max_hours_per_day: int
    unavailable_times: Set[Tuple[str, int]] = field(default_factory=set)

    def __post_init__(self):
        self.teacher_id = str(self.teacher_id).strip()
        self.teacher_name = str(self.teacher_name).strip()
        self.max_hours_per_day = int(self.max_hours_per_day)


@dataclass
class Room:
    room_id: str
    room_capacity: int
    is_lab: bool

    def __post_init__(self):
        self.room_id = str(self.room_id).strip()
        self.room_capacity = int(self.room_capacity)
        self.is_lab = bool(self.is_lab)


@dataclass
class StudentGroup:
    group_id: str
    group_name: str
    student_count: int
    enrolled_courses: List[str] = field(default_factory=list)

    def __post_init__(self):
        self.group_id = str(self.group_id).strip()
        self.group_name = str(self.group_name).strip()
        self.student_count = int(self.student_count)
        self.enrolled_courses = [str(c).strip() for c in self.enrolled_courses if str(c).strip()]


@dataclass
class TimeSlot:
    day: str
    period: int

    def __post_init__(self):
        self.day = str(self.day).strip()
        self.period = int(self.period)


@dataclass
class ScheduleAssignment:
    course_id: str
    course_name: str
    teacher_id: str
    teacher_name: str
    group_id: str
    group_name: str
    room_id: str
    day: str
    period: int
    is_lab: bool


@dataclass
class SolverConfig:
    """Hyperparameters and weights for CP-SAT objective function."""
    time_limit_seconds: float = 60.0
    num_search_workers: int = 8
    weight_uniform_distribution: int = 20    # Penalty per excess period per day for a course
    weight_student_gap: int = 15             # Penalty per idle gap period for student groups
    weight_teacher_gap: int = 10             # Penalty per idle gap period for teachers
    weight_consecutive_lab: int = 30         # Reward per consecutive 2-period lab block
    log_search_progress: bool = True


# -----------------------------------------------------------------------------
# Data Loader and Validator
# -----------------------------------------------------------------------------
class TimetableDataLoader:
    """
    Loads and validates timetable data from Excel or directory of CSV files.
    Ensures referential integrity and schema compliance before solving.
    """

    EXPECTED_TABLES = ["courses", "teachers", "rooms", "groups", "time_slots"]

    @staticmethod
    def parse_boolean(val: Any) -> bool:
        if isinstance(val, bool):
            return val
        if pd.isna(val):
            return False
        val_str = str(val).strip().lower()
        return val_str in ("true", "1", "yes", "t", "y")

    @classmethod
    def parse_enrolled_courses(cls, val: Any) -> List[str]:
        if pd.isna(val):
            return []
        if isinstance(val, (list, tuple)):
            return [str(x).strip() for x in val if str(x).strip()]
        val_str = str(val).strip()
        if not val_str:
            return []
        # Try JSON list format
        if val_str.startswith("[") and val_str.endswith("]"):
            try:
                parsed = json.loads(val_str)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
            except Exception:
                pass
        # Split by comma or semicolon
        items = re.split(r"[,;]+", val_str)
        return [x.strip() for x in items if x.strip()]

    @classmethod
    def parse_unavailable_times(cls, val: Any) -> Set[Tuple[str, int]]:
        """
        Parses unavailable times in formats:
        - "Mon:1, Mon:2, Tue:4"
        - "Mon-1; Tue-2"
        - [("Mon", 1), ("Tue", 2)]
        - '[["Mon", 1], ["Tue", 2]]'
        """
        result: Set[Tuple[str, int]] = set()
        if pd.isna(val):
            return result
        if isinstance(val, (list, tuple, set)):
            for item in val:
                if isinstance(item, (list, tuple)) and len(item) >= 2:
                    result.add((str(item[0]).strip(), int(item[1])))
            return result

        val_str = str(val).strip()
        if not val_str:
            return result

        # Check JSON format
        if val_str.startswith("[") and val_str.endswith("]"):
            try:
                parsed = json.loads(val_str)
                if isinstance(parsed, list):
                    for item in parsed:
                        if isinstance(item, (list, tuple)) and len(item) >= 2:
                            result.add((str(item[0]).strip(), int(item[1])))
                    return result
            except Exception:
                pass

        # Delimited string tokens
        tokens = re.split(r"[,;]+", val_str)
        for token in tokens:
            token = token.strip()
            if not token:
                continue
            # Matches "Mon:1" or "Mon-1" or "Mon_1" or "Mon 1"
            m = re.match(r"([A-Za-z]+)[:\-_ ]+(\d+)", token)
            if m:
                day = m.group(1).capitalize()
                period = int(m.group(2))
                result.add((day, period))
            else:
                logger.warning(f"Could not parse unavailable time token: '{token}'")

        return result

    @classmethod
    def load_from_excel(cls, excel_path: str | Path) -> Tuple[
        Dict[str, Course],
        Dict[str, Teacher],
        Dict[str, Room],
        Dict[str, StudentGroup],
        List[TimeSlot],
    ]:
        path = Path(excel_path)
        if not path.exists():
            raise FileNotFoundError(f"Excel file not found at: {path}")

        logger.info(f"Loading scheduling data from Excel workbook: {path.name}")
        excel = pd.ExcelFile(path)
        sheet_names_lower = {s.lower().replace(" ", "_"): s for s in excel.sheet_names}

        # Resolve sheet names flexibly
        courses_sheet = sheet_names_lower.get("courses") or sheet_names_lower.get("subjects")
        teachers_sheet = sheet_names_lower.get("teachers") or sheet_names_lower.get("faculty")
        rooms_sheet = sheet_names_lower.get("rooms") or sheet_names_lower.get("classrooms")
        groups_sheet = (
            sheet_names_lower.get("student_groups")
            or sheet_names_lower.get("groups")
            or sheet_names_lower.get("classes")
        )
        slots_sheet = (
            sheet_names_lower.get("time_slots")
            or sheet_names_lower.get("timeslots")
            or sheet_names_lower.get("slots")
        )

        missing = []
        if not courses_sheet: missing.append("Courses")
        if not teachers_sheet: missing.append("Teachers")
        if not rooms_sheet: missing.append("Rooms")
        if not groups_sheet: missing.append("Student Groups")
        if not slots_sheet: missing.append("Time Slots")

        if missing:
            raise ValueError(
                f"Missing required sheet(s) in {path.name}: {', '.join(missing)}. "
                f"Available sheets: {excel.sheet_names}"
            )

        df_courses = pd.read_excel(path, sheet_name=courses_sheet)
        df_teachers = pd.read_excel(path, sheet_name=teachers_sheet)
        df_rooms = pd.read_excel(path, sheet_name=rooms_sheet)
        df_groups = pd.read_excel(path, sheet_name=groups_sheet)
        df_slots = pd.read_excel(path, sheet_name=slots_sheet)

        return cls.parse_and_validate(df_courses, df_teachers, df_rooms, df_groups, df_slots)

    @classmethod
    def load_from_csv_dir(cls, directory: str | Path) -> Tuple[
        Dict[str, Course],
        Dict[str, Teacher],
        Dict[str, Room],
        Dict[str, StudentGroup],
        List[TimeSlot],
    ]:
        dir_path = Path(directory)
        if not dir_path.is_dir():
            raise NotADirectoryError(f"Directory not found: {dir_path}")

        logger.info(f"Loading scheduling data from CSV directory: {dir_path}")
        files = {p.stem.lower(): p for p in dir_path.glob("*.csv")}

        courses_file = files.get("courses") or files.get("subjects")
        teachers_file = files.get("teachers") or files.get("faculty")
        rooms_file = files.get("rooms") or files.get("classrooms")
        groups_file = files.get("groups") or files.get("student_groups") or files.get("classes")
        slots_file = files.get("time_slots") or files.get("timeslots") or files.get("slots")

        missing = []
        if not courses_file: missing.append("courses.csv")
        if not teachers_file: missing.append("teachers.csv")
        if not rooms_file: missing.append("rooms.csv")
        if not groups_file: missing.append("groups.csv / student_groups.csv")
        if not slots_file: missing.append("time_slots.csv")

        if missing:
            raise FileNotFoundError(
                f"Missing required CSV files in {dir_path}: {', '.join(missing)}"
            )

        df_courses = pd.read_csv(courses_file)
        df_teachers = pd.read_csv(teachers_file)
        df_rooms = pd.read_csv(rooms_file)
        df_groups = pd.read_csv(groups_file)
        df_slots = pd.read_csv(slots_file)

        return cls.parse_and_validate(df_courses, df_teachers, df_rooms, df_groups, df_slots)

    @classmethod
    def parse_and_validate(
        cls,
        df_courses: pd.DataFrame,
        df_teachers: pd.DataFrame,
        df_rooms: pd.DataFrame,
        df_groups: pd.DataFrame,
        df_slots: pd.DataFrame,
    ) -> Tuple[
        Dict[str, Course],
        Dict[str, Teacher],
        Dict[str, Room],
        Dict[str, StudentGroup],
        List[TimeSlot],
    ]:
        # Clean column names (strip whitespace and lowercase)
        for df in (df_courses, df_teachers, df_rooms, df_groups, df_slots):
            df.columns = [str(col).strip().lower() for col in df.columns]

        # 1. Validate Courses
        required_course_cols = {"course_id", "course_name", "weekly_periods", "teacher_id", "lab_required"}
        diff = required_course_cols - set(df_courses.columns)
        if diff:
            raise ValueError(f"Courses table missing required columns: {diff}")

        courses: Dict[str, Course] = {}
        for _, row in df_courses.iterrows():
            c_id = str(row["course_id"]).strip()
            if not c_id:
                continue
            courses[c_id] = Course(
                course_id=c_id,
                course_name=str(row["course_name"]).strip(),
                weekly_periods=int(row["weekly_periods"]),
                teacher_id=str(row["teacher_id"]).strip(),
                lab_required=cls.parse_boolean(row["lab_required"]),
            )

        # 2. Validate Teachers
        required_teacher_cols = {"teacher_id", "teacher_name", "max_hours_per_day"}
        diff = required_teacher_cols - set(df_teachers.columns)
        if diff:
            raise ValueError(f"Teachers table missing required columns: {diff}")

        teachers: Dict[str, Teacher] = {}
        has_unavail = "unavailable_times" in df_teachers.columns
        for _, row in df_teachers.iterrows():
            t_id = str(row["teacher_id"]).strip()
            if not t_id:
                continue
            unavail = cls.parse_unavailable_times(row["unavailable_times"]) if has_unavail else set()
            teachers[t_id] = Teacher(
                teacher_id=t_id,
                teacher_name=str(row["teacher_name"]).strip(),
                max_hours_per_day=int(row["max_hours_per_day"]),
                unavailable_times=unavail,
            )

        # 3. Validate Rooms
        required_room_cols = {"room_id", "room_capacity", "is_lab"}
        diff = required_room_cols - set(df_rooms.columns)
        if diff:
            raise ValueError(f"Rooms table missing required columns: {diff}")

        rooms: Dict[str, Room] = {}
        for _, row in df_rooms.iterrows():
            r_id = str(row["room_id"]).strip()
            if not r_id:
                continue
            rooms[r_id] = Room(
                room_id=r_id,
                room_capacity=int(row["room_capacity"]),
                is_lab=cls.parse_boolean(row["is_lab"]),
            )

        # 4. Validate Student Groups
        required_group_cols = {"group_id", "group_name", "student_count", "enrolled_courses"}
        diff = required_group_cols - set(df_groups.columns)
        if diff:
            raise ValueError(f"Student Groups table missing required columns: {diff}")

        groups: Dict[str, StudentGroup] = {}
        for _, row in df_groups.iterrows():
            g_id = str(row["group_id"]).strip()
            if not g_id:
                continue
            enrolled = cls.parse_enrolled_courses(row["enrolled_courses"])
            groups[g_id] = StudentGroup(
                group_id=g_id,
                group_name=str(row["group_name"]).strip(),
                student_count=int(row["student_count"]),
                enrolled_courses=enrolled,
            )

        # 5. Validate Time Slots
        required_slot_cols = {"day", "period"}
        diff = required_slot_cols - set(df_slots.columns)
        if diff:
            raise ValueError(f"Time Slots table missing required columns: {diff}")

        time_slots: List[TimeSlot] = []
        for _, row in df_slots.iterrows():
            d = str(row["day"]).strip().capitalize()
            p = int(row["period"])
            time_slots.append(TimeSlot(day=d, period=p))

        # Deduplicate & Sort Time Slots cleanly
        day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_rank = {d: i for i, d in enumerate(day_order)}
        day_rank.update({d[:3]: i for i, d in enumerate(day_order)})

        time_slots = sorted(
            list({(s.day, s.period): s for s in time_slots}.values()),
            key=lambda s: (day_rank.get(s.day, 99), s.period),
        )

        # ---------------------------------------------------------------------
        # Referential Integrity & Capacity Sanity Pre-checks
        # ---------------------------------------------------------------------
        # Verify teachers exist for courses
        for c_id, course in courses.items():
            if course.teacher_id not in teachers:
                raise ValueError(
                    f"Integrity Error: Course '{c_id}' references unknown teacher_id '{course.teacher_id}'."
                )

        # Verify enrolled courses exist
        for g_id, group in groups.items():
            for c_id in group.enrolled_courses:
                if c_id not in courses:
                    raise ValueError(
                        f"Integrity Error: Student Group '{g_id}' enrolled in unknown course_id '{c_id}'."
                    )

        # Feasibility check: Can each course be accommodated in at least one room?
        for g_id, group in groups.items():
            for c_id in group.enrolled_courses:
                course = courses[c_id]
                compatible_rooms = [
                    r for r in rooms.values()
                    if r.room_capacity >= group.student_count
                    and (not course.lab_required or r.is_lab)
                ]
                if not compatible_rooms:
                    raise ValueError(
                        f"Infeasibility Detected: No room can accommodate Course '{c_id}' for Group '{g_id}'! "
                        f"(Required Capacity: {group.student_count}, Lab Required: {course.lab_required}). "
                        f"Please add a larger room or lab room."
                    )

        # Feasibility check: Total weekly periods required by group vs available slots
        total_available_slots = len(time_slots)
        for g_id, group in groups.items():
            total_req = sum(courses[c_id].weekly_periods for c_id in group.enrolled_courses)
            if total_req > total_available_slots:
                raise ValueError(
                    f"Infeasibility Detected: Group '{g_id}' requires {total_req} weekly periods, "
                    f"but only {total_available_slots} time slots are defined in the timetable!"
                )

        logger.info(
            f"Successfully parsed and verified: {len(courses)} Courses, "
            f"{len(teachers)} Teachers, {len(rooms)} Rooms, "
            f"{len(groups)} Student Groups, {len(time_slots)} Time Slots."
        )

        return courses, teachers, rooms, groups, time_slots


# -----------------------------------------------------------------------------
# Google OR-Tools CP-SAT Scheduler Engine
# -----------------------------------------------------------------------------
class TimetableScheduler:
    """
    Formulates and solves the school/university timetable generation problem
    using Google OR-Tools CP-SAT Solver.
    """

    def __init__(
        self,
        courses: Dict[str, Course],
        teachers: Dict[str, Teacher],
        rooms: Dict[str, Room],
        groups: Dict[str, StudentGroup],
        time_slots: List[TimeSlot],
        config: Optional[SolverConfig] = None,
    ):
        if not ORTOOLS_AVAILABLE:
            raise ImportError(
                "Google OR-Tools is required for TimetableScheduler. "
                "Please run: pip install ortools"
            )

        self.courses = courses
        self.teachers = teachers
        self.rooms = rooms
        self.groups = groups
        self.time_slots = time_slots
        self.config = config or SolverConfig()

        # Precompute lookups
        self.days: List[str] = []
        seen_days = set()
        for s in self.time_slots:
            if s.day not in seen_days:
                self.days.append(s.day)
                seen_days.add(s.day)

        self.periods_by_day: Dict[str, List[int]] = {d: [] for d in self.days}
        for s in self.time_slots:
            self.periods_by_day[s.day].append(s.period)
        for d in self.days:
            self.periods_by_day[d] = sorted(list(set(self.periods_by_day[d])))

        self.all_periods: List[int] = sorted(list({s.period for s in self.time_slots}))

        # CP-SAT Model State
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        self.x: Dict[Tuple[str, str, str, str, str, int], cp_model.IntVar] = {}
        self.solver_status: Optional[str] = None
        self.assignments: List[ScheduleAssignment] = []
        self.solve_metrics: Dict[str, Any] = {}

    def build_model(self) -> None:
        """
        Creates all decision variables and applies Hard & Soft Constraints.
        """
        logger.info("Building CP-SAT decision variables and constraints...")
        start_time = time.time()

        # ---------------------------------------------------------------------
        # 1. Decision Variables with Domain Pruning
        # ---------------------------------------------------------------------
        # x[(c, t, g, r, d, p)] == 1 if course c is taught by teacher t to group g
        # in room r on day d during period p.
        #
        # Domain Pruning Strategy:
        # Instead of creating |C| x |T| x |G| x |R| x |D| x |P| variables (~100,000+),
        # we only instantiate variables for structurally valid combinations:
        # - t must be the instructor assigned to course c
        # - g must be enrolled in course c
        # - Room r must satisfy course.lab_required
        # - Room r must have room_capacity >= group.student_count
        # - Slot (d, p) must NOT be in teacher.unavailable_times
        # ---------------------------------------------------------------------
        var_count = 0
        for g_id, group in self.groups.items():
            for c_id in group.enrolled_courses:
                course = self.courses[c_id]
                t_id = course.teacher_id
                teacher = self.teachers[t_id]

                # Filter eligible rooms
                valid_rooms = [
                    r_id for r_id, room in self.rooms.items()
                    if room.room_capacity >= group.student_count
                    and (not course.lab_required or room.is_lab)
                ]

                for r_id in valid_rooms:
                    for slot in self.time_slots:
                        d, p = slot.day, slot.period

                        # Hard Constraint: Teacher Unavailability (Domain Pruning)
                        if (d, p) in teacher.unavailable_times:
                            continue

                        var_name = f"x_c{c_id}_g{g_id}_r{r_id}_{d}_{p}"
                        self.x[(c_id, t_id, g_id, r_id, d, p)] = self.model.NewBoolVar(var_name)
                        var_count += 1

        logger.info(f"Initialized {var_count} active decision variables after domain pruning.")

        # ---------------------------------------------------------------------
        # HARD CONSTRAINT 1: Course Requirement
        # Every enrolled course for a group must be scheduled exactly
        # `weekly_periods` times over the week.
        # ---------------------------------------------------------------------
        for g_id, group in self.groups.items():
            for c_id in group.enrolled_courses:
                course = self.courses[c_id]
                t_id = course.teacher_id
                assigned_vars = [
                    self.x[(c_id, t_id, g_id, r_id, slot.day, slot.period)]
                    for r_id in self.rooms
                    for slot in self.time_slots
                    if (c_id, t_id, g_id, r_id, slot.day, slot.period) in self.x
                ]
                self.model.Add(sum(assigned_vars) == course.weekly_periods)

        # ---------------------------------------------------------------------
        # HARD CONSTRAINT 2: No Teacher Conflicts
        # A teacher can teach at most ONE class per time slot (day, period).
        # ---------------------------------------------------------------------
        for t_id in self.teachers:
            for slot in self.time_slots:
                d, p = slot.day, slot.period
                teacher_slot_vars = [
                    var for key, var in self.x.items()
                    if key[1] == t_id and key[4] == d and key[5] == p
                ]
                if teacher_slot_vars:
                    self.model.Add(sum(teacher_slot_vars) <= 1)

        # ---------------------------------------------------------------------
        # HARD CONSTRAINT 3: No Student Group Conflicts
        # A student group can attend at most ONE class per time slot (day, period).
        # ---------------------------------------------------------------------
        for g_id in self.groups:
            for slot in self.time_slots:
                d, p = slot.day, slot.period
                group_slot_vars = [
                    var for key, var in self.x.items()
                    if key[2] == g_id and key[4] == d and key[5] == p
                ]
                if group_slot_vars:
                    self.model.Add(sum(group_slot_vars) <= 1)

        # ---------------------------------------------------------------------
        # HARD CONSTRAINT 4: No Room Conflicts
        # A room can host at most ONE class per time slot (day, period).
        # ---------------------------------------------------------------------
        for r_id in self.rooms:
            for slot in self.time_slots:
                d, p = slot.day, slot.period
                room_slot_vars = [
                    var for key, var in self.x.items()
                    if key[3] == r_id and key[4] == d and key[5] == p
                ]
                if room_slot_vars:
                    self.model.Add(sum(room_slot_vars) <= 1)

        # ---------------------------------------------------------------------
        # HARD CONSTRAINT 5: Teacher Max Hours Per Day
        # A teacher cannot exceed their maximum allowable teaching periods per day.
        # ---------------------------------------------------------------------
        for t_id, teacher in self.teachers.items():
            for d in self.days:
                teacher_day_vars = [
                    var for key, var in self.x.items()
                    if key[1] == t_id and key[4] == d
                ]
                if teacher_day_vars:
                    self.model.Add(sum(teacher_day_vars) <= teacher.max_hours_per_day)

        # ---------------------------------------------------------------------
        # SOFT CONSTRAINTS (Objective Function)
        # ---------------------------------------------------------------------
        objective_terms = []

        # SOFT CONSTRAINT 1: Uniform Distribution Across Days
        # Spreads course periods evenly across the week to avoid cramming.
        # Penalty applies if a course is taught more than the recommended daily cap.
        # ---------------------------------------------------------------------
        uniform_penalties = []
        for g_id, group in self.groups.items():
            for c_id in group.enrolled_courses:
                course = self.courses[c_id]
                t_id = course.teacher_id

                # Labs may naturally take 2 periods; non-labs ideally take at most 1 period per day
                target_daily_max = 2 if course.lab_required else 1
                if course.weekly_periods > len(self.days):
                    target_daily_max = (course.weekly_periods + len(self.days) - 1) // len(self.days)

                for d in self.days:
                    day_course_vars = [
                        self.x[(c_id, t_id, g_id, r_id, d, p)]
                        for r_id in self.rooms
                        for p in self.periods_by_day[d]
                        if (c_id, t_id, g_id, r_id, d, p) in self.x
                    ]
                    if not day_course_vars:
                        continue

                    # excess >= sum(day_course_vars) - target_daily_max
                    excess = self.model.NewIntVar(
                        0, len(day_course_vars), f"excess_{c_id}_{g_id}_{d}"
                    )
                    self.model.Add(excess >= sum(day_course_vars) - target_daily_max)
                    uniform_penalties.append(excess)

        if uniform_penalties:
            total_uniform_penalty = self.model.NewIntVar(
                0, len(uniform_penalties) * 10, "total_uniform_penalty"
            )
            self.model.Add(total_uniform_penalty == sum(uniform_penalties))
            objective_terms.append(
                -self.config.weight_uniform_distribution * total_uniform_penalty
            )

        # ---------------------------------------------------------------------
        # SOFT CONSTRAINT 2: Minimize Idle Gaps for Student Groups and Teachers
        # An idle gap occurs when an entity has a free period between two active
        # class periods on the same day.
        #
        # CP-SAT Linearization:
        # For period p on day d:
        # has_earlier[p] >= active[p'] for all p' < p
        # has_later[p]   >= active[p''] for all p'' > p
        # is_gap[p] >= has_earlier[p] + has_later[p] - active[p] - 1
        # ---------------------------------------------------------------------
        student_gap_vars = []
        for g_id in self.groups:
            for d in self.days:
                periods = self.periods_by_day[d]
                if len(periods) <= 2:
                    continue

                active_p: Dict[int, cp_model.IntVar] = {}
                for p in periods:
                    slot_vars = [
                        var for key, var in self.x.items()
                        if key[2] == g_id and key[4] == d and key[5] == p
                    ]
                    if slot_vars:
                        act = self.model.NewBoolVar(f"act_g{g_id}_{d}_{p}")
                        self.model.Add(act == sum(slot_vars))
                        active_p[p] = act

                for i in range(1, len(periods) - 1):
                    p = periods[i]
                    earlier_vars = [active_p[p_prev] for p_prev in periods[:i] if p_prev in active_p]
                    later_vars = [active_p[p_next] for p_next in periods[i+1:] if p_next in active_p]

                    if not earlier_vars or not later_vars or p not in active_p:
                        continue

                    has_earlier = self.model.NewBoolVar(f"has_early_g{g_id}_{d}_{p}")
                    has_later = self.model.NewBoolVar(f"has_late_g{g_id}_{d}_{p}")
                    is_gap = self.model.NewBoolVar(f"gap_g{g_id}_{d}_{p}")

                    # has_earlier == 1 iff any earlier period is active
                    self.model.AddMaxEquality(has_earlier, earlier_vars)
                    # has_later == 1 iff any later period is active
                    self.model.AddMaxEquality(has_later, later_vars)

                    # is_gap >= has_earlier + has_later - active[p] - 1
                    self.model.Add(is_gap >= has_earlier + has_later - active_p[p] - 1)
                    student_gap_vars.append(is_gap)

        if student_gap_vars:
            total_student_gaps = self.model.NewIntVar(
                0, len(student_gap_vars), "total_student_gaps"
            )
            self.model.Add(total_student_gaps == sum(student_gap_vars))
            objective_terms.append(-self.config.weight_student_gap * total_student_gaps)

        # Idle gaps for teachers
        teacher_gap_vars = []
        for t_id in self.teachers:
            for d in self.days:
                periods = self.periods_by_day[d]
                if len(periods) <= 2:
                    continue

                active_tp: Dict[int, cp_model.IntVar] = {}
                for p in periods:
                    t_slot_vars = [
                        var for key, var in self.x.items()
                        if key[1] == t_id and key[4] == d and key[5] == p
                    ]
                    if t_slot_vars:
                        act = self.model.NewBoolVar(f"act_t{t_id}_{d}_{p}")
                        self.model.Add(act == sum(t_slot_vars))
                        active_tp[p] = act

                for i in range(1, len(periods) - 1):
                    p = periods[i]
                    earlier_vars = [active_tp[p_prev] for p_prev in periods[:i] if p_prev in active_tp]
                    later_vars = [active_tp[p_next] for p_next in periods[i+1:] if p_next in active_tp]

                    if not earlier_vars or not later_vars or p not in active_tp:
                        continue

                    has_earlier = self.model.NewBoolVar(f"has_early_t{t_id}_{d}_{p}")
                    has_later = self.model.NewBoolVar(f"has_late_t{t_id}_{d}_{p}")
                    is_t_gap = self.model.NewBoolVar(f"gap_t{t_id}_{d}_{p}")

                    self.model.AddMaxEquality(has_earlier, earlier_vars)
                    self.model.AddMaxEquality(has_later, later_vars)
                    self.model.Add(is_t_gap >= has_earlier + has_later - active_tp[p] - 1)
                    teacher_gap_vars.append(is_t_gap)

        if teacher_gap_vars:
            total_teacher_gaps = self.model.NewIntVar(
                0, len(teacher_gap_vars), "total_teacher_gaps"
            )
            self.model.Add(total_teacher_gaps == sum(teacher_gap_vars))
            objective_terms.append(-self.config.weight_teacher_gap * total_teacher_gaps)

        # ---------------------------------------------------------------------
        # SOFT CONSTRAINT 3: Maximize Consecutive Lab Slots
        # When a course requires a lab and has >= 2 periods, reward scheduling
        # them in adjacent consecutive slots (e.g., period p and period p+1).
        # ---------------------------------------------------------------------
        consec_lab_rewards = []
        for g_id, group in self.groups.items():
            for c_id in group.enrolled_courses:
                course = self.courses[c_id]
                if not course.lab_required or course.weekly_periods < 2:
                    continue

                t_id = course.teacher_id
                for d in self.days:
                    periods = self.periods_by_day[d]
                    for i in range(len(periods) - 1):
                        p1, p2 = periods[i], periods[i + 1]
                        if p2 != p1 + 1:
                            continue  # Must be strictly adjacent numbers

                        p1_vars = [
                            self.x[(c_id, t_id, g_id, r_id, d, p1)]
                            for r_id in self.rooms
                            if (c_id, t_id, g_id, r_id, d, p1) in self.x
                        ]
                        p2_vars = [
                            self.x[(c_id, t_id, g_id, r_id, d, p2)]
                            for r_id in self.rooms
                            if (c_id, t_id, g_id, r_id, d, p2) in self.x
                        ]

                        if not p1_vars or not p2_vars:
                            continue

                        pair_var = self.model.NewBoolVar(f"consec_lab_{c_id}_{g_id}_{d}_{p1}")
                        # pair_var == 1 iff both slot 1 and slot 2 are active for this lab
                        self.model.Add(pair_var <= sum(p1_vars))
                        self.model.Add(pair_var <= sum(p2_vars))
                        consec_lab_rewards.append(pair_var)

        if consec_lab_rewards:
            total_consec_labs = self.model.NewIntVar(
                0, len(consec_lab_rewards), "total_consec_labs"
            )
            self.model.Add(total_consec_labs == sum(consec_lab_rewards))
            objective_terms.append(self.config.weight_consecutive_lab * total_consec_labs)

        # ---------------------------------------------------------------------
        # Final Objective Maximization
        # ---------------------------------------------------------------------
        if objective_terms:
            self.model.Maximize(sum(objective_terms))

        elapsed = time.time() - start_time
        logger.info(f"Model built in {elapsed:.2f}s with {len(objective_terms)} objective components.")

    def solve(self) -> Tuple[str, List[ScheduleAssignment]]:
        """
        Executes CP-SAT search with multi-threading and timeout limits.
        """
        self.build_model()

        # Configure CP-SAT solver parameters
        self.solver.parameters.max_time_in_seconds = float(self.config.time_limit_seconds)
        self.solver.parameters.num_search_workers = int(self.config.num_search_workers)
        self.solver.parameters.log_search_progress = bool(self.config.log_search_progress)

        logger.info(
            f"Invoking CP-SAT Solver (timeout: {self.config.time_limit_seconds}s, "
            f"workers: {self.config.num_search_workers})..."
        )
        solve_start = time.time()
        raw_status = self.solver.Solve(self.model)
        solve_time = time.time() - solve_start

        status_map = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN",
        }
        self.solver_status = status_map.get(raw_status, "UNKNOWN")
        logger.info(
            f"CP-SAT finished in {solve_time:.2f}s with status: {self.solver_status}"
        )

        self.solve_metrics = {
            "status": self.solver_status,
            "solve_time_seconds": round(solve_time, 3),
            "wall_time": self.solver.WallTime(),
            "user_time": self.solver.UserTime(),
            "branches": self.solver.NumBranches(),
            "conflicts": self.solver.NumConflicts(),
            "objective_value": self.solver.ObjectiveValue() if self.solver_status in ("OPTIMAL", "FEASIBLE") else None,
            "best_objective_bound": self.solver.BestObjectiveBound() if self.solver_status in ("OPTIMAL", "FEASIBLE") else None,
        }

        if self.solver_status not in ("OPTIMAL", "FEASIBLE"):
            logger.error(
                f"No solution found! Status: {self.solver_status}. "
                "Possible causes: over-constrained teacher hours, insufficient room capacities, "
                "or too many weekly periods for available time slots."
            )
            return self.solver_status, []

        # ---------------------------------------------------------------------
        # Extract Solution Assignments
        # ---------------------------------------------------------------------
        self.assignments.clear()
        for (c_id, t_id, g_id, r_id, d, p), var in self.x.items():
            if self.solver.Value(var) == 1:
                course = self.courses[c_id]
                teacher = self.teachers[t_id]
                group = self.groups[g_id]
                self.assignments.append(
                    ScheduleAssignment(
                        course_id=c_id,
                        course_name=course.course_name,
                        teacher_id=t_id,
                        teacher_name=teacher.teacher_name,
                        group_id=g_id,
                        group_name=group.group_name,
                        room_id=r_id,
                        day=d,
                        period=p,
                        is_lab=course.lab_required,
                    )
                )

        # Sort assignments chronologically
        day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_rank = {d: i for i, d in enumerate(day_order)}
        day_rank.update({d[:3]: i for i, d in enumerate(day_order)})

        self.assignments.sort(key=lambda a: (day_rank.get(a.day, 99), a.period, a.group_id))
        logger.info(f"Extracted {len(self.assignments)} scheduled timetable sessions.")
        return self.solver_status, self.assignments


# -----------------------------------------------------------------------------
# Timetable Exporter (Excel Workbook and CSVs)
# -----------------------------------------------------------------------------
class TimetableExporter:
    """
    Exports solved timetables into formatted, multi-sheet Excel workbooks
    and structured CSV files.
    """

    @staticmethod
    def to_dataframe(assignments: List[ScheduleAssignment]) -> pd.DataFrame:
        data = [
            {
                "Day": a.day,
                "Period": a.period,
                "Group ID": a.group_id,
                "Group Name": a.group_name,
                "Course ID": a.course_id,
                "Course Name": a.course_name,
                "Teacher ID": a.teacher_id,
                "Teacher Name": a.teacher_name,
                "Room ID": a.room_id,
                "Is Lab": "Yes" if a.is_lab else "No",
            }
            for a in assignments
        ]
        return pd.DataFrame(data)

    @classmethod
    def export_csv(cls, assignments: List[ScheduleAssignment], output_csv_path: str | Path) -> None:
        df = cls.to_dataframe(assignments)
        out_path = Path(output_csv_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_path, index=False)
        logger.info(f"Exported master schedule CSV: {out_path}")

    @classmethod
    def export_excel(
        cls,
        scheduler: TimetableScheduler,
        output_excel_path: str | Path,
    ) -> None:
        """
        Creates an executive multi-sheet Excel workbook with:
        1. "Executive Summary": Solver metrics, KPIs, and constraint status
        2. "Master Schedule": Complete tabular list of all assignments
        3. Separate grid sheets for each Student Group
        4. Separate grid sheets for each Teacher
        5. Separate grid sheets for each Room
        """
        if not OPENPYXL_AVAILABLE:
            logger.warning("openpyxl is not installed. Exporting CSV fallback instead.")
            csv_path = Path(output_excel_path).with_suffix(".csv")
            cls.export_csv(scheduler.assignments, csv_path)
            return

        out_path = Path(output_excel_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        wb = openpyxl.Workbook()
        # Remove default empty sheet
        wb.remove(wb.active)

        # Style Palettes
        font_title = Font(name="Calibri", size=15, bold=True, color="1E293B")
        font_subtitle = Font(name="Calibri", size=11, bold=True, color="475569")
        font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        font_subhead = Font(name="Calibri", size=10, bold=True, color="0F172A")
        font_cell = Font(name="Calibri", size=10, color="0F172A")
        font_cell_lab = Font(name="Calibri", size=10, bold=True, color="1E3A8A")
        font_muted = Font(name="Calibri", size=9, italic=True, color="64748B")

        fill_header = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        fill_subhead = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
        fill_slot_regular = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
        fill_slot_lab = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
        fill_empty = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
        fill_kpi = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )
        double_bottom = Border(
            bottom=Side(style="double", color="1E293B"),
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
        )

        align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
        align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

        days = scheduler.days
        periods = scheduler.all_periods

        # ---------------------------------------------------------------------
        # SHEET 1: Executive Summary & Metrics
        # ---------------------------------------------------------------------
        ws_summary = wb.create_sheet(title="Overview & Metrics")
        ws_summary.views.sheetView[0].showGridLines = True

        ws_summary["B2"] = "Academic Timetable Optimization - Solver Report"
        ws_summary["B2"].font = font_title
        ws_summary["B3"] = f"Generated by Google OR-Tools CP-SAT Solver | Status: {scheduler.solver_status}"
        ws_summary["B3"].font = font_subtitle

        summary_rows = [
            ("Solver Status", scheduler.solver_status),
            ("Solving Wall Time", f"{scheduler.solve_metrics.get('solve_time_seconds', 0)} seconds"),
            ("Search Branches", str(scheduler.solve_metrics.get("branches", "N/A"))),
            ("Conflicts Encountered", str(scheduler.solve_metrics.get("conflicts", "N/A"))),
            ("Objective Value", str(scheduler.solve_metrics.get("objective_value", "N/A"))),
            ("Total Sessions Scheduled", len(scheduler.assignments)),
            ("Total Student Groups", len(scheduler.groups)),
            ("Total Faculty Members", len(scheduler.teachers)),
            ("Total Available Rooms", len(scheduler.rooms)),
            ("Total Defined Time Slots", len(scheduler.time_slots)),
        ]

        row_idx = 5
        ws_summary.cell(row=row_idx, column=2, value="Optimization Parameter / Metric").font = font_header
        ws_summary.cell(row=row_idx, column=2).fill = fill_header
        ws_summary.cell(row=row_idx, column=3, value="Value").font = font_header
        ws_summary.cell(row=row_idx, column=3).fill = fill_header

        for metric, val in summary_rows:
            row_idx += 1
            c1 = ws_summary.cell(row=row_idx, column=2, value=metric)
            c2 = ws_summary.cell(row=row_idx, column=3, value=val)
            c1.font = font_cell
            c2.font = font_cell
            c1.border = thin_border
            c2.border = thin_border
            c1.fill = fill_kpi

        # ---------------------------------------------------------------------
        # SHEET 2: Master Schedule
        # ---------------------------------------------------------------------
        ws_master = wb.create_sheet(title="Master Schedule")
        ws_master.views.sheetView[0].showGridLines = True

        master_headers = [
            "Day", "Period", "Group ID", "Group Name", "Course ID",
            "Course Name", "Faculty ID", "Faculty Name", "Room ID", "Lab Session"
        ]
        for col_idx, h in enumerate(master_headers, 1):
            cell = ws_master.cell(row=1, column=col_idx, value=h)
            cell.font = font_header
            cell.fill = fill_header
            cell.alignment = align_center

        for r_idx, a in enumerate(scheduler.assignments, 2):
            vals = [
                a.day, a.period, a.group_id, a.group_name, a.course_id,
                a.course_name, a.teacher_id, a.teacher_name, a.room_id,
                "YES [Lab]" if a.is_lab else "No"
            ]
            for c_idx, v in enumerate(vals, 1):
                cell = ws_master.cell(row=r_idx, column=c_idx, value=v)
                cell.font = font_cell_lab if (c_idx == 10 and a.is_lab) else font_cell
                cell.border = thin_border
                cell.alignment = align_center if c_idx in (1, 2, 3, 5, 7, 9, 10) else align_left

        # Helper to render a 2D Day-by-Period Timetable Grid
        def create_grid_sheet(
            title: str,
            heading: str,
            filter_key: str,
            filter_val: str,
            cell_formatter,
        ):
            ws = wb.create_sheet(title=title[:31])  # Excel sheet title limit is 31 chars
            ws.views.sheetView[0].showGridLines = True

            ws["B2"] = heading
            ws["B2"].font = font_title

            # Table Headers: Periods
            ws.cell(row=4, column=2, value="Day / Period").font = font_header
            ws.cell(row=4, column=2).fill = fill_header
            ws.cell(row=4, column=2).alignment = align_center
            ws.cell(row=4, column=2).border = thin_border

            for col_idx, p in enumerate(periods, 3):
                cell = ws.cell(row=4, column=col_idx, value=f"Period {p}")
                cell.font = font_header
                cell.fill = fill_header
                cell.alignment = align_center
                cell.border = thin_border

            # Table Rows: Days
            for r_idx, d in enumerate(days, 5):
                day_cell = ws.cell(row=r_idx, column=2, value=d)
                day_cell.font = font_subhead
                day_cell.fill = fill_subhead
                day_cell.alignment = align_center
                day_cell.border = thin_border

                for col_idx, p in enumerate(periods, 3):
                    cell = ws.cell(row=r_idx, column=col_idx)
                    cell.border = thin_border
                    cell.alignment = align_center

                    # Find matching assignment
                    matching = [
                        a for a in scheduler.assignments
                        if a.day == d and a.period == p and getattr(a, filter_key) == filter_val
                    ]

                    if matching:
                        a = matching[0]
                        cell.value = cell_formatter(a)
                        if a.is_lab:
                            cell.fill = fill_slot_lab
                            cell.font = font_cell_lab
                        else:
                            cell.fill = fill_slot_regular
                            cell.font = font_cell
                    else:
                        cell.value = "—"
                        cell.font = font_muted
                        cell.fill = fill_empty

            # Format Column Widths and Row Heights
            ws.row_dimensions[4].height = 24
            for r in range(5, 5 + len(days)):
                ws.row_dimensions[r].height = 48

            ws.column_dimensions["B"].width = 16
            for col_idx in range(3, 3 + len(periods)):
                col_letter = get_column_letter(col_idx)
                ws.column_dimensions[col_letter].width = 22

        # ---------------------------------------------------------------------
        # SHEETS 3: Student Groups Grids
        # ---------------------------------------------------------------------
        for g_id, group in scheduler.groups.items():
            sheet_title = f"Group_{g_id}"
            heading = f"Timetable: {group.group_name} ({g_id}) | Students: {group.student_count}"
            formatter = lambda a: f"{a.course_name}\nRoom: {a.room_id}\nProf. {a.teacher_name}"
            create_grid_sheet(sheet_title, heading, "group_id", g_id, formatter)

        # ---------------------------------------------------------------------
        # SHEETS 4: Teacher Grids
        # ---------------------------------------------------------------------
        for t_id, teacher in scheduler.teachers.items():
            sheet_title = f"Faculty_{t_id}"
            heading = f"Teaching Schedule: {teacher.teacher_name} ({t_id}) | Max: {teacher.max_hours_per_day}h/day"
            formatter = lambda a: f"{a.course_name}\n{a.group_name}\nRoom: {a.room_id}"
            create_grid_sheet(sheet_title, heading, "teacher_id", t_id, formatter)

        # ---------------------------------------------------------------------
        # Auto-adjust column widths on summary and master sheets
        # ---------------------------------------------------------------------
        for ws in (ws_summary, ws_master):
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    if cell.value:
                        lines = str(cell.value).split("\n")
                        max_len = max(max_len, max(len(l) for l in lines))
                ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        wb.save(out_path)
        logger.info(f"Successfully generated formatted Excel timetable: {out_path}")


# -----------------------------------------------------------------------------
# Sample Data Generator Utility
# -----------------------------------------------------------------------------
def generate_sample_dataset() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Creates a realistic, complete engineering university dataset for demonstration.
    """
    courses_data = [
        {"course_id": "CS101", "course_name": "Intro to Programming", "weekly_periods": 3, "teacher_id": "T_ALAN", "lab_required": True},
        {"course_id": "CS102", "course_name": "Data Structures & Alg", "weekly_periods": 4, "teacher_id": "T_ADA", "lab_required": True},
        {"course_id": "MATH201", "course_name": "Linear Algebra", "weekly_periods": 3, "teacher_id": "T_EULER", "lab_required": False},
        {"course_id": "PHY101", "course_name": "Classical Mechanics", "weekly_periods": 3, "teacher_id": "T_NEWTON", "lab_required": False},
        {"course_id": "CS201", "course_name": "Database Systems", "weekly_periods": 3, "teacher_id": "T_CODD", "lab_required": True},
        {"course_id": "CS202", "course_name": "Operating Systems", "weekly_periods": 4, "teacher_id": "T_LINUS", "lab_required": True},
        {"course_id": "HUM101", "course_name": "Technical Communication", "weekly_periods": 2, "teacher_id": "T_SHAKE", "lab_required": False},
    ]

    teachers_data = [
        {"teacher_id": "T_ALAN", "teacher_name": "Dr. Alan Turing", "max_hours_per_day": 4, "unavailable_times": "Mon:1, Mon:2, Fri:6"},
        {"teacher_id": "T_ADA", "teacher_name": "Dr. Ada Lovelace", "max_hours_per_day": 4, "unavailable_times": "Wed:5, Wed:6"},
        {"teacher_id": "T_EULER", "teacher_name": "Dr. Leonhard Euler", "max_hours_per_day": 3, "unavailable_times": "Tue:1"},
        {"teacher_id": "T_NEWTON", "teacher_name": "Dr. Isaac Newton", "max_hours_per_day": 4, "unavailable_times": "Thu:1, Thu:2"},
        {"teacher_id": "T_CODD", "teacher_name": "Dr. Edgar F. Codd", "max_hours_per_day": 3, "unavailable_times": "Fri:5, Fri:6"},
        {"teacher_id": "T_LINUS", "teacher_name": "Prof. Linus Torvalds", "max_hours_per_day": 4, "unavailable_times": "Mon:6"},
        {"teacher_id": "T_SHAKE", "teacher_name": "Prof. William Shakespeare", "max_hours_per_day": 3, "unavailable_times": ""},
    ]

    rooms_data = [
        {"room_id": "LH-101", "room_capacity": 60, "is_lab": False},
        {"room_id": "LH-102", "room_capacity": 45, "is_lab": False},
        {"room_id": "LAB-CS1", "room_capacity": 40, "is_lab": True},
        {"room_id": "LAB-CS2", "room_capacity": 35, "is_lab": True},
        {"room_id": "CR-201", "room_capacity": 30, "is_lab": False},
    ]

    groups_data = [
        {"group_id": "CS_YR1", "group_name": "CS Year 1 (Freshmen)", "student_count": 35, "enrolled_courses": "CS101, MATH201, PHY101, HUM101"},
        {"group_id": "CS_YR2", "group_name": "CS Year 2 (Sophomores)", "student_count": 30, "enrolled_courses": "CS102, CS201, CS202, MATH201"},
    ]

    slots_data = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    for d in days:
        for p in range(1, 7):
            slots_data.append({"day": d, "period": p})

    return (
        pd.DataFrame(courses_data),
        pd.DataFrame(teachers_data),
        pd.DataFrame(rooms_data),
        pd.DataFrame(groups_data),
        pd.DataFrame(slots_data),
    )


def write_sample_files(target_dir: str | Path = "sample_data", excel_filename: str = "sample_timetable_data.xlsx") -> None:
    """
    Writes both CSV files and a consolidated Excel workbook with sample data.
    """
    df_courses, df_teachers, df_rooms, df_groups, df_slots = generate_sample_dataset()
    dir_path = Path(target_dir)
    dir_path.mkdir(parents=True, exist_ok=True)

    # Write CSVs
    df_courses.to_csv(dir_path / "courses.csv", index=False)
    df_teachers.to_csv(dir_path / "teachers.csv", index=False)
    df_rooms.to_csv(dir_path / "rooms.csv", index=False)
    df_groups.to_csv(dir_path / "groups.csv", index=False)
    df_slots.to_csv(dir_path / "time_slots.csv", index=False)
    logger.info(f"Wrote sample CSV files to directory: {dir_path.resolve()}")

    # Write Excel workbook
    excel_path = Path(excel_filename)
    with pd.ExcelWriter(excel_path, engine="openpyxl" if OPENPYXL_AVAILABLE else None) as writer:
        df_courses.to_excel(writer, sheet_name="Courses", index=False)
        df_teachers.to_excel(writer, sheet_name="Teachers", index=False)
        df_rooms.to_excel(writer, sheet_name="Rooms", index=False)
        df_groups.to_excel(writer, sheet_name="Student_Groups", index=False)
        df_slots.to_excel(writer, sheet_name="Time_Slots", index=False)
    logger.info(f"Wrote sample Excel workbook to: {excel_path.resolve()}")


# -----------------------------------------------------------------------------
# Main CLI Interface
# -----------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Academic Timetable Optimizer using Google OR-Tools CP-SAT.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  1. Generate sample CSV and Excel datasets:
     python timetable_scheduler.py --generate-samples

  2. Solve from an Excel workbook:
     python timetable_scheduler.py --excel sample_timetable_data.xlsx --output timetable_output.xlsx

  3. Solve from CSV directory with custom time limit:
     python timetable_scheduler.py --csv-dir sample_data --time-limit 30 --output timetable_output.xlsx
        """,
    )

    input_group = parser.add_mutually_exclusive_group()
    input_group.add_argument(
        "--excel", "-e",
        type=str,
        help="Path to input Excel workbook containing Courses, Teachers, Rooms, Groups, TimeSlots.",
    )
    input_group.add_argument(
        "--csv-dir", "-c",
        type=str,
        help="Path to directory containing courses.csv, teachers.csv, rooms.csv, groups.csv, time_slots.csv.",
    )
    input_group.add_argument(
        "--generate-samples", "-g",
        action="store_true",
        help="Generate realistic sample CSVs in 'sample_data/' and sample Excel 'sample_timetable_data.xlsx'.",
    )

    parser.add_argument(
        "--output", "-o",
        type=str,
        default="timetable_output.xlsx",
        help="Path for output schedule (defaults to timetable_output.xlsx).",
    )
    parser.add_argument(
        "--time-limit", "-t",
        type=float,
        default=60.0,
        help="Maximum solver time limit in seconds (default: 60s).",
    )
    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=8,
        help="Number of CP-SAT parallel search workers (default: 8).",
    )

    args = parser.parse_args()

    if args.generate_samples:
        write_sample_files()
        print("\n[OK] Sample datasets created successfully!")
        print("  - Excel: sample_timetable_data.xlsx")
        print("  - CSVs:  sample_data/ (courses.csv, teachers.csv, rooms.csv, groups.csv, time_slots.csv)")
        print("\nYou can now run:")
        print("  python timetable_scheduler.py --excel sample_timetable_data.xlsx\n")
        return

    # Default to sample Excel or CSV if no argument is given
    excel_path = args.excel
    csv_dir = args.csv_dir

    if not excel_path and not csv_dir:
        # Check if sample files exist; if not, create them
        if Path("sample_timetable_data.xlsx").exists():
            excel_path = "sample_timetable_data.xlsx"
            logger.info("No input provided. Defaulting to existing 'sample_timetable_data.xlsx'.")
        elif Path("sample_data").exists():
            csv_dir = "sample_data"
            logger.info("No input provided. Defaulting to existing 'sample_data' directory.")
        else:
            logger.info("No input file found. Automatically bootstrapping sample dataset...")
            write_sample_files()
            excel_path = "sample_timetable_data.xlsx"

    try:
        # 1. Load Data
        if excel_path:
            courses, teachers, rooms, groups, slots = TimetableDataLoader.load_from_excel(excel_path)
        else:
            courses, teachers, rooms, groups, slots = TimetableDataLoader.load_from_csv_dir(csv_dir)

        # 2. Configure & Solve
        config = SolverConfig(
            time_limit_seconds=args.time_limit,
            num_search_workers=args.workers,
        )
        scheduler = TimetableScheduler(courses, teachers, rooms, groups, slots, config=config)
        status, assignments = scheduler.solve()

        if status not in ("OPTIMAL", "FEASIBLE"):
            print(f"\n[FAIL] Timetable generation failed: {status}")
            sys.exit(1)

        # 3. Export Output
        out_file = Path(args.output)
        if out_file.suffix.lower() == ".csv":
            TimetableExporter.export_csv(assignments, out_file)
        else:
            TimetableExporter.export_excel(scheduler, out_file)

        print(f"\n[SUCCESS] Timetable generation succeeded with status: {status}")
        print(f"Total sessions scheduled: {len(assignments)}")
        print(f"Results exported to: {out_file.resolve()}\n")

    except Exception as exc:
        logger.error(f"Fatal error during timetable scheduling: {exc}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
