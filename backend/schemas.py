from typing import List, Optional
from pydantic import BaseModel, Field


class SchoolSchema(BaseModel):
    name: str = "Oakridge International High School"
    academic_year: str = "2025 - 2026"
    term: str = "Term 1 (Fall Semester)"


class TeacherSchema(BaseModel):
    teacher_id: str
    teacher_name: str
    max_hours_per_day: int
    unavailable_times: str = ""
    department: Optional[str] = "General"
    email: Optional[str] = None


class RoomSchema(BaseModel):
    room_id: str
    room_capacity: int
    is_lab: bool
    room_name: Optional[str] = None
    room_type: Optional[str] = "Classroom"


class StudentGroupSchema(BaseModel):
    group_id: str
    group_name: str
    student_count: int
    enrolled_courses: List[str]
    grade_level: Optional[str] = "9"


class CourseSchema(BaseModel):
    course_id: str
    course_name: str
    weekly_periods: int
    teacher_id: str
    lab_required: bool
    department: Optional[str] = "General"
    color_code: Optional[str] = None


class TimeSlotSchema(BaseModel):
    day: str
    period: int
    time_range: Optional[str] = None
    label: Optional[str] = None
    is_break: Optional[bool] = False


class BellItemSchema(BaseModel):
    id: str
    period: int
    name: str
    startTime: str
    endTime: str
    type: str  # "academic" | "break"
    note: Optional[str] = ""


class BellScheduleUpdate(BaseModel):
    schedule: List[BellItemSchema]


class AssignmentSchema(BaseModel):
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
    department: Optional[str] = None


class SolveRequest(BaseModel):
    timeLimit: int = Field(default=15, ge=3, le=120)
    workers: int = Field(default=4, ge=1, le=16)
    balanceWorkload: bool = True
    labRouting: bool = True
    evenSpread: bool = True


class SolveResponse(BaseModel):
    success: bool
    status: str
    solve_time_seconds: float
    branches: int
    conflicts: int
    objective_value: Optional[float] = 0.0
    assignments: List[AssignmentSchema]
    logs: List[str]
    csvContent: Optional[str] = None


class CurriculumResponse(BaseModel):
    school: SchoolSchema
    courses: List[CourseSchema]
    teachers: List[TeacherSchema]
    rooms: List[RoomSchema]
    groups: List[StudentGroupSchema]
    timeSlots: List[TimeSlotSchema]

