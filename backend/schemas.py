from typing import List, Optional
from pydantic import BaseModel, Field


class SchoolSchema(BaseModel):
    name: str = "Oakridge International High School"
    academic_year: str = "2025 - 2026"
    term: str = "Term 1 (Fall Semester)"
    principal_name: str = ""
    coordinator_name: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""


class SchoolUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    academic_year: str = Field(min_length=1, max_length=50)
    term: str = Field(default="", max_length=50)
    principal_name: str = Field(default="", max_length=255)
    coordinator_name: str = Field(default="", max_length=255)
    address: str = Field(default="", max_length=2000)
    phone: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=255)


class TeacherSchema(BaseModel):
    teacher_id: str
    teacher_name: str
    max_hours_per_day: int
    unavailable_times: str = ""
    department: Optional[str] = "General"
    homeroom_class: Optional[str] = None
    email: Optional[str] = None


class TeacherCreate(BaseModel):
    teacher_id: str = Field(min_length=1)
    teacher_name: str = Field(min_length=1)
    max_hours_per_day: int = Field(default=5, ge=1, le=8)
    unavailable_times: Optional[str] = ""
    department: Optional[str] = "General"
    homeroom_class: Optional[str] = None
    email: Optional[str] = None


class TeacherUpdate(BaseModel):
    teacher_name: str = Field(min_length=1)
    max_hours_per_day: int = Field(default=5, ge=1, le=8)
    unavailable_times: Optional[str] = ""
    department: Optional[str] = "General"
    homeroom_class: Optional[str] = None
    email: Optional[str] = None


class RoomSchema(BaseModel):
    room_id: str
    room_capacity: int
    is_lab: bool
    room_name: Optional[str] = None
    room_type: Optional[str] = "Classroom"


class RoomCreate(BaseModel):
    room_id: str = Field(min_length=1)
    room_capacity: int = Field(default=35, ge=1, le=500)
    is_lab: bool = False
    room_name: Optional[str] = None
    room_type: Optional[str] = "Classroom"


class RoomUpdate(BaseModel):
    room_capacity: int = Field(default=35, ge=1, le=500)
    is_lab: bool = False
    room_name: Optional[str] = None
    room_type: Optional[str] = "Classroom"


class StudentGroupSchema(BaseModel):
    group_id: str
    group_name: str
    student_count: int
    enrolled_courses: List[str] = []
    grade_level: Optional[str] = "9"
    homeroom_teacher: Optional[str] = None
    homeroom_room_id: Optional[str] = None


class StudentGroupCreate(BaseModel):
    group_id: str = Field(min_length=1)
    group_name: str = Field(min_length=1)
    student_count: int = Field(default=30, ge=1, le=200)
    enrolled_courses: List[str] = []
    grade_level: Optional[str] = "9"
    homeroom_teacher: Optional[str] = None
    homeroom_room_id: Optional[str] = None


class StudentGroupUpdate(BaseModel):
    group_name: str = Field(min_length=1)
    student_count: int = Field(default=30, ge=1, le=200)
    enrolled_courses: List[str] = []
    grade_level: Optional[str] = "9"
    homeroom_teacher: Optional[str] = None
    homeroom_room_id: Optional[str] = None


class CourseSchema(BaseModel):
    course_id: str
    course_name: str
    weekly_periods: int
    teacher_id: str
    lab_required: bool
    department: Optional[str] = "General"
    color_code: Optional[str] = None


class CourseCreate(BaseModel):
    course_id: str = Field(min_length=1)
    course_name: str = Field(min_length=1)
    weekly_periods: int = Field(default=5, ge=1, le=20)
    teacher_id: str = Field(min_length=1)
    lab_required: bool = False
    department: Optional[str] = "General"
    color_code: Optional[str] = None


class CourseBulkCreate(BaseModel):
    courses: List[CourseCreate] = Field(min_length=1, max_length=100)


class CourseUpdate(BaseModel):
    course_name: str = Field(min_length=1)
    weekly_periods: int = Field(default=5, ge=1, le=20)
    teacher_id: str = Field(min_length=1)
    lab_required: bool = False
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
