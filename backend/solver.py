from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from ortools.sat.python import cp_model

logger = logging.getLogger("TimetableSolver")


@dataclass
class SolverCourse:
    course_id: str
    course_name: str
    weekly_periods: int
    teacher_id: str
    lab_required: bool
    department: str = "General"


@dataclass
class SolverTeacher:
    teacher_id: str
    teacher_name: str
    max_hours_per_day: int
    unavailable_times: Set[Tuple[str, int]] = field(default_factory=set)
    department: str = "General"


@dataclass
class SolverRoom:
    room_id: str
    room_capacity: int
    is_lab: bool
    room_name: str = ""


@dataclass
class SolverGroup:
    group_id: str
    group_name: str
    student_count: int
    enrolled_courses: List[str] = field(default_factory=list)


def parse_unavailable_string(val: str) -> Set[Tuple[str, int]]:
    unavail: Set[Tuple[str, int]] = set()
    if not val:
        return unavail
    tokens = [t.strip() for t in str(val).split(",") if t.strip()]
    day_map = {
        "MON": "Mon", "MONDAY": "Mon",
        "TUE": "Tue", "TUESDAY": "Tue",
        "WED": "Wed", "WEDNESDAY": "Wed",
        "THU": "Thu", "THURSDAY": "Thu",
        "FRI": "Fri", "FRIDAY": "Fri",
    }
    for token in tokens:
        match = re.match(r"^([A-Za-z]+)\s*[:\-_]\s*(\d+)$", token)
        if match:
            day_str = match.group(1).upper()
            day = day_map.get(day_str, match.group(1).capitalize()[:3])
            period = int(match.group(2))
            unavail.add((day, period))
    return unavail


def execute_cpsat_solver(
    courses: Dict[str, SolverCourse],
    teachers: Dict[str, SolverTeacher],
    rooms: Dict[str, SolverRoom],
    groups: Dict[str, SolverGroup],
    days: Optional[List[str]] = None,
    periods_per_day: int = 8,
    time_limit_seconds: int = 15,
    workers: int = 4,
    balance_workload: bool = True,
    lab_routing: bool = True,
    even_spread: bool = True,
) -> Dict[str, Any]:
    """
    Solves school timetable scheduling using Google OR-Tools CP-SAT.
    """
    if days is None:
        days = ["Mon", "Tue", "Wed", "Thu", "Fri"]

    time_slots = [(d, p) for d in days for p in range(1, periods_per_day + 1)]
    periods_by_day = {d: list(range(1, periods_per_day + 1)) for d in days}

    logs: List[str] = []
    logs.append("[TIMETABLE OPTIMIZER] Initializing OR-Tools CP-SAT Solver...")
    logs.append(f"[CONFIG] Parallel Workers: {workers}, Search Walltime: {time_limit_seconds}s.")
    logs.append(f"[RULES] Workload Balancing: {balance_workload}, Lab Routing: {lab_routing}, Even Spread: {even_spread}")

    model = cp_model.CpModel()
    x: Dict[Tuple[str, str, str, str, str, int], cp_model.IntVar] = {}

    # Domain pruning
    var_count = 0
    for g_id, group in groups.items():
        for c_id in group.enrolled_courses:
            if c_id not in courses:
                continue
            course = courses[c_id]
            t_id = course.teacher_id
            if t_id not in teachers:
                continue
            teacher = teachers[t_id]

            # Filter valid rooms
            valid_rooms = [
                r_id for r_id, room in rooms.items()
                if room.room_capacity >= group.student_count
                and (not (lab_routing and course.lab_required) or room.is_lab)
            ]

            # Fallback if no specific lab matches
            if not valid_rooms:
                valid_rooms = [
                    r_id for r_id, room in rooms.items()
                    if room.room_capacity >= group.student_count
                ]

            for r_id in valid_rooms:
                for d, p in time_slots:
                    if (d, p) in teacher.unavailable_times:
                        continue

                    var_name = f"x_{c_id}_{g_id}_{r_id}_{d}_{p}"
                    x[(c_id, t_id, g_id, r_id, d, p)] = model.NewBoolVar(var_name)
                    var_count += 1

    logs.append(f"[VARIABLES] Instantiated {var_count} pruned decision variables.")

    # HARD CONSTRAINT 1: Exact weekly period quota per course
    for g_id, group in groups.items():
        for c_id in group.enrolled_courses:
            if c_id not in courses:
                continue
            course = courses[c_id]
            t_id = course.teacher_id
            assigned_vars = [
                x[(c_id, t_id, g_id, r_id, d, p)]
                for r_id in rooms
                for d, p in time_slots
                if (c_id, t_id, g_id, r_id, d, p) in x
            ]
            if assigned_vars:
                model.Add(sum(assigned_vars) == course.weekly_periods)

    # HARD CONSTRAINT 2: No Teacher Double-Booking
    for t_id in teachers:
        for d, p in time_slots:
            teacher_slot_vars = [
                var for key, var in x.items()
                if key[1] == t_id and key[4] == d and key[5] == p
            ]
            if teacher_slot_vars:
                model.Add(sum(teacher_slot_vars) <= 1)

    # HARD CONSTRAINT 3: No Student Group Double-Booking
    for g_id in groups:
        for d, p in time_slots:
            group_slot_vars = [
                var for key, var in x.items()
                if key[2] == g_id and key[4] == d and key[5] == p
            ]
            if group_slot_vars:
                model.Add(sum(group_slot_vars) <= 1)

    # HARD CONSTRAINT 4: No Room Double-Booking
    for r_id in rooms:
        for d, p in time_slots:
            room_slot_vars = [
                var for key, var in x.items()
                if key[3] == r_id and key[4] == d and key[5] == p
            ]
            if room_slot_vars:
                model.Add(sum(room_slot_vars) <= 1)

    # HARD CONSTRAINT 5: Teacher Max Hours Per Day
    if balance_workload:
        for t_id, teacher in teachers.items():
            for d in days:
                teacher_day_vars = [
                    var for key, var in x.items()
                    if key[1] == t_id and key[4] == d
                ]
                if teacher_day_vars:
                    model.Add(sum(teacher_day_vars) <= teacher.max_hours_per_day)

    # -------------------------------------------------------------------------
    # Soft Constraints / Objectives
    # -------------------------------------------------------------------------
    objective_terms = []

    # SC1: Uniform Course Distribution
    if even_spread:
        uniform_penalties = []
        for g_id, group in groups.items():
            for c_id in group.enrolled_courses:
                if c_id not in courses:
                    continue
                course = courses[c_id]
                t_id = course.teacher_id

                target_daily_max = 2 if course.lab_required else 1
                if course.weekly_periods > len(days):
                    target_daily_max = (course.weekly_periods + len(days) - 1) // len(days)

                for d in days:
                    day_vars = [
                        x[(c_id, t_id, g_id, r_id, d, p)]
                        for r_id in rooms
                        for p in periods_by_day[d]
                        if (c_id, t_id, g_id, r_id, d, p) in x
                    ]
                    if not day_vars:
                        continue
                    excess = model.NewIntVar(0, len(day_vars), f"excess_{c_id}_{g_id}_{d}")
                    model.Add(excess >= sum(day_vars) - target_daily_max)
                    uniform_penalties.append(excess)

        if uniform_penalties:
            tot_pen = model.NewIntVar(0, len(uniform_penalties) * 5, "tot_uniform_pen")
            model.Add(tot_pen == sum(uniform_penalties))
            objective_terms.append(-10 * tot_pen)

    # SC2: Minimize Teacher Gaps & Student Gaps
    if balance_workload:
        teacher_gaps = []
        for t_id in teachers:
            for d in days:
                p_list = periods_by_day[d]
                active_p = {}
                for p in p_list:
                    t_vars = [var for k, var in x.items() if k[1] == t_id and k[4] == d and k[5] == p]
                    if t_vars:
                        act = model.NewBoolVar(f"act_t_{t_id}_{d}_{p}")
                        model.Add(act == sum(t_vars))
                        active_p[p] = act

                for i in range(1, len(p_list) - 1):
                    p = p_list[i]
                    earlier = [active_p[prev] for prev in p_list[:i] if prev in active_p]
                    later = [active_p[nxt] for nxt in p_list[i+1:] if nxt in active_p]
                    if not earlier or not later or p not in active_p:
                        continue
                    has_early = model.NewBoolVar(f"early_t_{t_id}_{d}_{p}")
                    has_late = model.NewBoolVar(f"late_t_{t_id}_{d}_{p}")
                    gap = model.NewBoolVar(f"gap_t_{t_id}_{d}_{p}")
                    model.AddMaxEquality(has_early, earlier)
                    model.AddMaxEquality(has_late, later)
                    model.Add(gap >= has_early + has_late - active_p[p] - 1)
                    teacher_gaps.append(gap)

        if teacher_gaps:
            tot_tg = model.NewIntVar(0, len(teacher_gaps), "tot_tg")
            model.Add(tot_tg == sum(teacher_gaps))
            objective_terms.append(-3 * tot_tg)

    # SC3: Consecutive Lab Slots
    consec_labs = []
    for g_id, group in groups.items():
        for c_id in group.enrolled_courses:
            if c_id not in courses:
                continue
            course = courses[c_id]
            if not course.lab_required or course.weekly_periods < 2:
                continue
            t_id = course.teacher_id
            for d in days:
                p_list = periods_by_day[d]
                for i in range(len(p_list) - 1):
                    p1, p2 = p_list[i], p_list[i + 1]
                    if p2 != p1 + 1:
                        continue
                    p1_vars = [x[(c_id, t_id, g_id, r_id, d, p1)] for r_id in rooms if (c_id, t_id, g_id, r_id, d, p1) in x]
                    p2_vars = [x[(c_id, t_id, g_id, r_id, d, p2)] for r_id in rooms if (c_id, t_id, g_id, r_id, d, p2) in x]
                    if not p1_vars or not p2_vars:
                        continue
                    pair = model.NewBoolVar(f"consec_{c_id}_{g_id}_{d}_{p1}")
                    model.Add(pair <= sum(p1_vars))
                    model.Add(pair <= sum(p2_vars))
                    consec_labs.append(pair)

    if consec_labs:
        tot_cl = model.NewIntVar(0, len(consec_labs), "tot_cl")
        model.Add(tot_cl == sum(consec_labs))
        objective_terms.append(5 * tot_cl)

    if objective_terms:
        model.Maximize(sum(objective_terms))

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_seconds)
    solver.parameters.num_workers = int(workers)

    start_t = time.time()
    solve_status_code = solver.Solve(model)
    elapsed = round(time.time() - start_t, 3)

    status_name = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.MODEL_INVALID: "MODEL_INVALID",
        cp_model.UNKNOWN: "UNKNOWN",
    }.get(solve_status_code, "UNKNOWN")

    logs.append(f"[SOLVER STATUS] CP-SAT returned {status_name} in {elapsed}s.")
    logs.append(f"[METRICS] Branches: {solver.NumBranches()}, Conflicts: {solver.NumConflicts()}, Objective: {solver.ObjectiveValue() if status_name in ('OPTIMAL', 'FEASIBLE') else 0.0}")

    assignments: List[Dict[str, Any]] = []

    if status_name in ("OPTIMAL", "FEASIBLE"):
        for key, var in x.items():
            if solver.Value(var) == 1:
                c_id, t_id, g_id, r_id, d, p = key
                course = courses[c_id]
                teacher = teachers[t_id]
                group = groups[g_id]
                room = rooms[r_id]

                assignments.append({
                    "course_id": c_id,
                    "course_name": course.course_name,
                    "teacher_id": t_id,
                    "teacher_name": teacher.teacher_name,
                    "group_id": g_id,
                    "group_name": group.group_name,
                    "room_id": r_id,
                    "day": d,
                    "period": p,
                    "is_lab": room.is_lab,
                    "department": course.department,
                })

        # Order logically by day then period then group
        day_order = {d: idx for idx, d in enumerate(days)}
        assignments.sort(key=lambda a: (day_order.get(a["day"], 99), a["period"], a["group_id"]))

    return {
        "status": status_name,
        "solve_time_seconds": elapsed,
        "branches": solver.NumBranches(),
        "conflicts": solver.NumConflicts(),
        "objective_value": solver.ObjectiveValue() if status_name in ("OPTIMAL", "FEASIBLE") else 0.0,
        "assignments": assignments,
        "logs": logs,
    }

