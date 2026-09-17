export interface Course {
  course_id: string;
  course_name: string;
  weekly_periods: number;
  teacher_id: string;
  lab_required: boolean;
  department?: string;
  color_code?: string;
}

export interface Teacher {
  teacher_id: string;
  teacher_name: string;
  max_hours_per_day: number;
  unavailable_times: string;
  department?: string;
  homeroom_class?: string;
  email?: string;
}

export interface Room {
  room_id: string;
  room_capacity: number;
  is_lab: boolean;
  room_name?: string;
  room_type?: "Classroom" | "Science Lab" | "Computer Lab" | "Art Studio" | "Sports Ground" | "Library";
}

export interface StudentGroup {
  group_id: string;
  group_name: string;
  student_count: number;
  enrolled_courses: string[];
  grade_level?: string;
  homeroom_teacher?: string;
  homeroom_room_id?: string;
}

export interface TimeSlot {
  day: string;
  period: number;
  time_range?: string;
  label?: string;
  is_break?: boolean;
}

export interface ScheduleAssignment {
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  group_id: string;
  group_name: string;
  room_id: string;
  day: string;
  period: number;
  is_lab: boolean;
  department?: string;
}

export interface SolverMetrics {
  status: "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "RUNNING" | "IDLE";
  solve_time_seconds: number;
  conflicts: number;
  branches: number;
  objective_value?: number;
  total_sessions: number;
  total_groups: number;
  total_teachers: number;
  total_rooms: number;
}
