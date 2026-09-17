import { Course, Teacher, Room, StudentGroup, TimeSlot, ScheduleAssignment } from "../types";

export const SCHOOL_INFO = {
  name: "Oakridge International High School",
  academicYear: "2025 – 2026 Academic Session",
  term: "Term 1 (Fall Semester)",
  principal: "Dr. Arthur Pendelton, Ph.D.",
  coordinator: "Ms. Margaret Thatcher, M.Ed.",
  bellTimings: "08:00 AM – 02:45 PM (Monday – Friday)",
};

export const SAMPLE_COURSES: Course[] = [
  // Grade 9-A Subjects (Total: 40 periods/week)
  { course_id: "MATH09_A", course_name: "Mathematics", weekly_periods: 7, teacher_id: "T_AMIT_SHARMA", lab_required: false, department: "Mathematics" },
  { course_id: "SCI09_A", course_name: "Science", weekly_periods: 6, teacher_id: "T_RAJESH_KUMAR", lab_required: true, department: "Science" },
  { course_id: "BIO09_A", course_name: "Hindi Course A", weekly_periods: 5, teacher_id: "T_PRIYA_SINGH", lab_required: false, department: "Hindi" },
  { course_id: "ENG09_A", course_name: "English Language & Literature", weekly_periods: 6, teacher_id: "T_ANJALI_GUPTA", lab_required: false, department: "English" },
  { course_id: "SOC09_A", course_name: "Social Science", weekly_periods: 6, teacher_id: "T_SURESH_VERMA", lab_required: false, department: "Social Science" },
  { course_id: "CS09_A", course_name: "Information Technology", weekly_periods: 4, teacher_id: "T_POOJA_MEHTA", lab_required: true, department: "Technology" },
  { course_id: "PE09_A", course_name: "Physical Education", weekly_periods: 2, teacher_id: "T_VIKRAM_YADAV", lab_required: false, department: "Athletics" },
  { course_id: "ART09_A", course_name: "Art Education", weekly_periods: 2, teacher_id: "T_KAVITA_JOSHI", lab_required: false, department: "Fine Arts" },
  { course_id: "LIB09_A", course_name: "Library & Reading", weekly_periods: 2, teacher_id: "T_SANDEEP_PATEL", lab_required: false, department: "Resource" },

  // Grade 9-B Subjects (Total: 40 periods/week)
  { course_id: "MATH09_B", course_name: "Mathematics", weekly_periods: 7, teacher_id: "T_AMIT_SHARMA", lab_required: false, department: "Mathematics" },
  { course_id: "SCI09_B", course_name: "Science", weekly_periods: 6, teacher_id: "T_RAJESH_KUMAR", lab_required: true, department: "Science" },
  { course_id: "BIO09_B", course_name: "Hindi Course A", weekly_periods: 5, teacher_id: "T_PRIYA_SINGH", lab_required: false, department: "Hindi" },
  { course_id: "ENG09_B", course_name: "English Language & Literature", weekly_periods: 6, teacher_id: "T_ANJALI_GUPTA", lab_required: false, department: "English" },
  { course_id: "SOC09_B", course_name: "Social Science", weekly_periods: 6, teacher_id: "T_SURESH_VERMA", lab_required: false, department: "Social Science" },
  { course_id: "CS09_B", course_name: "Information Technology", weekly_periods: 4, teacher_id: "T_POOJA_MEHTA", lab_required: true, department: "Technology" },
  { course_id: "PE09_B", course_name: "Physical Education", weekly_periods: 2, teacher_id: "T_VIKRAM_YADAV", lab_required: false, department: "Athletics" },
  { course_id: "ART09_B", course_name: "Art Education", weekly_periods: 2, teacher_id: "T_KAVITA_JOSHI", lab_required: false, department: "Fine Arts" },
  { course_id: "LIB09_B", course_name: "Library & Reading", weekly_periods: 2, teacher_id: "T_SANDEEP_PATEL", lab_required: false, department: "Resource" },

  // Grade 10-A Subjects (Total: 40 periods/week)
  { course_id: "MATH10_A", course_name: "Mathematics", weekly_periods: 7, teacher_id: "T_AMIT_SHARMA", lab_required: false, department: "Mathematics" },
  { course_id: "SCI10_A", course_name: "Science", weekly_periods: 6, teacher_id: "T_RAJESH_KUMAR", lab_required: true, department: "Science" },
  { course_id: "BIO10_A", course_name: "Hindi Course A", weekly_periods: 5, teacher_id: "T_PRIYA_SINGH", lab_required: false, department: "Hindi" },
  { course_id: "ENG10_A", course_name: "English Language & Literature", weekly_periods: 6, teacher_id: "T_ANJALI_GUPTA", lab_required: false, department: "English" },
  { course_id: "SOC10_A", course_name: "Social Science", weekly_periods: 6, teacher_id: "T_SURESH_VERMA", lab_required: false, department: "Social Science" },
  { course_id: "CS10_A", course_name: "Information Technology", weekly_periods: 4, teacher_id: "T_POOJA_MEHTA", lab_required: true, department: "Technology" },
  { course_id: "PE10_A", course_name: "Physical Education", weekly_periods: 2, teacher_id: "T_VIKRAM_YADAV", lab_required: false, department: "Athletics" },
  { course_id: "ART10_A", course_name: "Art Education", weekly_periods: 2, teacher_id: "T_KAVITA_JOSHI", lab_required: false, department: "Fine Arts" },
  { course_id: "LIB10_A", course_name: "Library & Reading", weekly_periods: 2, teacher_id: "T_SANDEEP_PATEL", lab_required: false, department: "Resource" },
];

export const SAMPLE_TEACHERS: Teacher[] = [
  { teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", max_hours_per_day: 5, unavailable_times: "Fri:8", department: "Mathematics", homeroom_class: "Grade 9-A" },
  { teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", max_hours_per_day: 5, unavailable_times: "Wed:5, Wed:6", department: "Science", homeroom_class: "Grade 10-A" },
  { teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", max_hours_per_day: 4, unavailable_times: "Tue:1", department: "Hindi", homeroom_class: "Grade 9-A" },
  { teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", max_hours_per_day: 5, unavailable_times: "Mon:1", department: "English", homeroom_class: "None" },
  { teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", max_hours_per_day: 5, unavailable_times: "Thu:1", department: "Social Science", homeroom_class: "Grade 9-B" },
  { teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", max_hours_per_day: 4, unavailable_times: "Fri:7, Fri:8", department: "Information Technology", homeroom_class: "None" },
  { teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", max_hours_per_day: 3, unavailable_times: "Mon:8", department: "Physical Education", homeroom_class: "None" },
  { teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", max_hours_per_day: 3, unavailable_times: "None", department: "Art Education", homeroom_class: "None" },
  { teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", max_hours_per_day: 3, unavailable_times: "None", department: "Library & Reading", homeroom_class: "None" },
];

export const SUBJECT_TEACHER_TABLE = [
  { subject: "Mathematics", teacher: "Mr. Amit Sharma", grades: "IX–X" },
  { subject: "Science", teacher: "Mr. Rajesh Kumar", grades: "IX–X" },
  { subject: "Hindi Course A", teacher: "Ms. Priya Singh", grades: "IX–X" },
  { subject: "English Language & Literature", teacher: "Ms. Anjali Gupta", grades: "IX–X" },
  { subject: "Social Science", teacher: "Mr. Suresh Verma", grades: "IX–X" },
  { subject: "Information Technology", teacher: "Ms. Pooja Mehta", grades: "IX–X" },
  { subject: "Physical Education", teacher: "Mr. Vikram Yadav", grades: "IX–X" },
  { subject: "Art Education", teacher: "Mrs. Kavita Joshi", grades: "IX–X" },
  { subject: "Library & Reading", teacher: "Mr. Sandeep Patel", grades: "IX–X" },
];

export const TEACHER_ID_NAME_MAP: Record<string, string> = {
  T_AMIT_SHARMA: "Mr. Amit Sharma",
  T_RAJESH_KUMAR: "Mr. Rajesh Kumar",
  T_PRIYA_SINGH: "Ms. Priya Singh",
  T_ANJALI_GUPTA: "Ms. Anjali Gupta",
  T_SURESH_VERMA: "Mr. Suresh Verma",
  T_POOJA_MEHTA: "Ms. Pooja Mehta",
  T_VIKRAM_YADAV: "Mr. Vikram Yadav",
  T_KAVITA_JOSHI: "Mrs. Kavita Joshi",
  T_SANDEEP_PATEL: "Mr. Sandeep Patel",
};

export const SAMPLE_ROOMS: Room[] = [
  { room_id: "RM-101", room_capacity: 35, is_lab: false, room_name: "Class 9-A Homeroom", room_type: "Classroom" },
  { room_id: "RM-102", room_capacity: 35, is_lab: false, room_name: "Class 9-B Homeroom", room_type: "Classroom" },
  { room_id: "RM-201", room_capacity: 35, is_lab: false, room_name: "Class 10-A Homeroom", room_type: "Classroom" },
  { room_id: "SCI-LAB", room_capacity: 36, is_lab: true, room_name: "Composite Science & Physics Lab", room_type: "Science Lab" },
  { room_id: "COMP-LAB", room_capacity: 32, is_lab: true, room_name: "Computer & Robotics Lab", room_type: "Computer Lab" },
  { room_id: "ART-STUDIO", room_capacity: 32, is_lab: false, room_name: "Visual Arts Workshop", room_type: "Art Studio" },
  { room_id: "GYM-FIELD", room_capacity: 65, is_lab: false, room_name: "Sports Complex & Field", room_type: "Sports Ground" },
  { room_id: "LIBRARY", room_capacity: 45, is_lab: false, room_name: "Central School Library", room_type: "Library" },
];

export const SAMPLE_GROUPS: StudentGroup[] = [
  {
    group_id: "G9-A",
    group_name: "Grade 9 - Section A",
    student_count: 32,
    grade_level: "High School Freshman",
    homeroom_teacher: "Ms. Priya Singh",
    homeroom_room_id: "RM-101",
    enrolled_courses: ["MATH09_A", "SCI09_A", "BIO09_A", "ENG09_A", "SOC09_A", "CS09_A", "PE09_A", "ART09_A", "LIB09_A"],
  },
  {
    group_id: "G9-B",
    group_name: "Grade 9 - Section B",
    student_count: 30,
    grade_level: "High School Freshman",
    homeroom_teacher: "Mr. Suresh Verma",
    homeroom_room_id: "RM-102",
    enrolled_courses: ["MATH09_B", "SCI09_B", "BIO09_B", "ENG09_B", "SOC09_B", "CS09_B", "PE09_B", "ART09_B", "LIB09_B"],
  },
  {
    group_id: "G10-A",
    group_name: "Grade 10 - Section A",
    student_count: 28,
    grade_level: "High School Sophomore",
    homeroom_teacher: "Mr. Rajesh Kumar",
    homeroom_room_id: "RM-201",
    enrolled_courses: ["MATH10_A", "SCI10_A", "BIO10_A", "ENG10_A", "SOC10_A", "CS10_A", "PE10_A", "ART10_A", "LIB10_A"],
  },
];

// 8 Periods per day starting at 08:00 AM with exactly 1 Lunch Break after the 4th Period
export const BELL_SCHEDULE = [
  { period: 1, time: "08:00 – 08:45", name: "Period 1", type: "academic", note: "Morning Academic Session" },
  { period: 2, time: "08:45 – 09:30", name: "Period 2", type: "academic", note: "Core Academic Block" },
  { period: 3, time: "09:30 – 10:15", name: "Period 3", type: "academic", note: "Mid-Morning Session" },
  { period: 4, time: "10:15 – 11:00", name: "Period 4", type: "academic", note: "Pre-Lunch Block" },
  { period: 0, time: "11:00 – 11:45", name: "Lunch Break", type: "break", note: "Lunch & Recreation (45 mins)" },
  { period: 5, time: "11:45 – 12:30", name: "Period 5", type: "academic", note: "Post-Lunch Session" },
  { period: 6, time: "12:30 – 13:15", name: "Period 6", type: "academic", note: "Afternoon Academic Block" },
  { period: 7, time: "13:15 – 14:00", name: "Period 7", type: "academic", note: "Practical / Core" },
  { period: 8, time: "14:00 – 14:45", name: "Period 8", type: "academic", note: "Co-Curricular / Activity / Dismissal" },
];

export const SAMPLE_TIME_SLOTS: TimeSlot[] = [
  { day: "Mon", period: 1, time_range: "08:00 – 08:45", label: "Period 1" },
  { day: "Mon", period: 2, time_range: "08:45 – 09:30", label: "Period 2" },
  { day: "Mon", period: 3, time_range: "09:30 – 10:15", label: "Period 3" },
  { day: "Mon", period: 4, time_range: "10:15 – 11:00", label: "Period 4" },
  { day: "Mon", period: 5, time_range: "11:45 – 12:30", label: "Period 5" },
  { day: "Mon", period: 6, time_range: "12:30 – 13:15", label: "Period 6" },
  { day: "Mon", period: 7, time_range: "13:15 – 14:00", label: "Period 7" },
  { day: "Mon", period: 8, time_range: "14:00 – 14:45", label: "Period 8" },
  { day: "Tue", period: 1, time_range: "08:00 – 08:45", label: "Period 1" },
  { day: "Tue", period: 2, time_range: "08:45 – 09:30", label: "Period 2" },
  { day: "Tue", period: 3, time_range: "09:30 – 10:15", label: "Period 3" },
  { day: "Tue", period: 4, time_range: "10:15 – 11:00", label: "Period 4" },
  { day: "Tue", period: 5, time_range: "11:45 – 12:30", label: "Period 5" },
  { day: "Tue", period: 6, time_range: "12:30 – 13:15", label: "Period 6" },
  { day: "Tue", period: 7, time_range: "13:15 – 14:00", label: "Period 7" },
  { day: "Tue", period: 8, time_range: "14:00 – 14:45", label: "Period 8" },
  { day: "Wed", period: 1, time_range: "08:00 – 08:45", label: "Period 1" },
  { day: "Wed", period: 2, time_range: "08:45 – 09:30", label: "Period 2" },
  { day: "Wed", period: 3, time_range: "09:30 – 10:15", label: "Period 3" },
  { day: "Wed", period: 4, time_range: "10:15 – 11:00", label: "Period 4" },
  { day: "Wed", period: 5, time_range: "11:45 – 12:30", label: "Period 5" },
  { day: "Wed", period: 6, time_range: "12:30 – 13:15", label: "Period 6" },
  { day: "Wed", period: 7, time_range: "13:15 – 14:00", label: "Period 7" },
  { day: "Wed", period: 8, time_range: "14:00 – 14:45", label: "Period 8" },
  { day: "Thu", period: 1, time_range: "08:00 – 08:45", label: "Period 1" },
  { day: "Thu", period: 2, time_range: "08:45 – 09:30", label: "Period 2" },
  { day: "Thu", period: 3, time_range: "09:30 – 10:15", label: "Period 3" },
  { day: "Thu", period: 4, time_range: "10:15 – 11:00", label: "Period 4" },
  { day: "Thu", period: 5, time_range: "11:45 – 12:30", label: "Period 5" },
  { day: "Thu", period: 6, time_range: "12:30 – 13:15", label: "Period 6" },
  { day: "Thu", period: 7, time_range: "13:15 – 14:00", label: "Period 7" },
  { day: "Thu", period: 8, time_range: "14:00 – 14:45", label: "Period 8" },
  { day: "Fri", period: 1, time_range: "08:00 – 08:45", label: "Period 1" },
  { day: "Fri", period: 2, time_range: "08:45 – 09:30", label: "Period 2" },
  { day: "Fri", period: 3, time_range: "09:30 – 10:15", label: "Period 3" },
  { day: "Fri", period: 4, time_range: "10:15 – 11:00", label: "Period 4" },
  { day: "Fri", period: 5, time_range: "11:45 – 12:30", label: "Period 5" },
  { day: "Fri", period: 6, time_range: "12:30 – 13:15", label: "Period 6" },
  { day: "Fri", period: 7, time_range: "13:15 – 14:00", label: "Period 7" },
  { day: "Fri", period: 8, time_range: "14:00 – 14:45", label: "Period 8" },
];

export const INITIAL_SOLVED_ASSIGNMENTS: ScheduleAssignment[] = [
  // -------------------------------------------------------------------------
  // MONDAY
  // -------------------------------------------------------------------------
  // Period 1
  { day: "Mon", period: 1, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SCI10_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Mon", period: 1, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Mon", period: 1, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SOC09_B", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-102", is_lab: false, department: "Social Science" },

  // Period 2
  { day: "Mon", period: 2, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SOC10_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-201", is_lab: false, department: "Social Science" },
  { day: "Mon", period: 2, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ENG09_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-101", is_lab: false, department: "English" },
  { day: "Mon", period: 2, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 3
  { day: "Mon", period: 3, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Mon", period: 3, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SCI09_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Mon", period: 3, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ENG09_B", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-102", is_lab: false, department: "English" },

  // Period 4 (Pre-Lunch)
  { day: "Mon", period: 4, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ENG10_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-201", is_lab: false, department: "English" },
  { day: "Mon", period: 4, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SOC09_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-101", is_lab: false, department: "Social Science" },
  { day: "Mon", period: 4, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SCI09_B", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },

  // Period 5 (Post-Lunch)
  { day: "Mon", period: 5, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "BIO10_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-201", is_lab: false, department: "Hindi" },
  { day: "Mon", period: 5, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Mon", period: 5, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SOC09_B", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-102", is_lab: false, department: "Social Science" },

  // Period 6
  { day: "Mon", period: 6, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SOC10_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-201", is_lab: false, department: "Social Science" },
  { day: "Mon", period: 6, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SCI09_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Mon", period: 6, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 7
  { day: "Mon", period: 7, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Mon", period: 7, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SOC09_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-101", is_lab: false, department: "Social Science" },
  { day: "Mon", period: 7, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ENG09_B", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-102", is_lab: false, department: "English" },

  // Period 8
  { day: "Mon", period: 8, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SCI10_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Mon", period: 8, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ENG09_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-101", is_lab: false, department: "English" },
  { day: "Mon", period: 8, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "BIO09_B", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-102", is_lab: false, department: "Hindi" },

  // -------------------------------------------------------------------------
  // TUESDAY
  // -------------------------------------------------------------------------
  // Period 1
  { day: "Tue", period: 1, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ENG10_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-201", is_lab: false, department: "English" },
  { day: "Tue", period: 1, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Tue", period: 1, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SCI09_B", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },

  // Period 2
  { day: "Tue", period: 2, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SCI10_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Tue", period: 2, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "BIO09_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-101", is_lab: false, department: "Hindi" },
  { day: "Tue", period: 2, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 3
  { day: "Tue", period: 3, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Tue", period: 3, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "BIO09_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-101", is_lab: false, department: "Hindi" },
  { day: "Tue", period: 3, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SCI09_B", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },

  // Period 4 (Pre-Lunch)
  { day: "Tue", period: 4, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "CS10_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Tue", period: 4, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SOC09_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-101", is_lab: false, department: "Social Science" },
  { day: "Tue", period: 4, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "BIO09_B", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-102", is_lab: false, department: "Hindi" },

  // Period 5 (Post-Lunch)
  { day: "Tue", period: 5, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "BIO10_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-201", is_lab: false, department: "Hindi" },
  { day: "Tue", period: 5, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SCI09_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Tue", period: 5, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 6
  { day: "Tue", period: 6, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Tue", period: 6, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ENG09_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-101", is_lab: false, department: "English" },
  { day: "Tue", period: 6, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "CS09_B", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },

  // Period 7
  { day: "Tue", period: 7, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SOC10_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-201", is_lab: false, department: "Social Science" },
  { day: "Tue", period: 7, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "CS09_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Tue", period: 7, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ENG09_B", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-102", is_lab: false, department: "English" },

  // Period 8
  { day: "Tue", period: 8, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ENG10_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-201", is_lab: false, department: "English" },
  { day: "Tue", period: 8, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Tue", period: 8, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SOC09_B", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-102", is_lab: false, department: "Social Science" },

  // -------------------------------------------------------------------------
  // WEDNESDAY
  // -------------------------------------------------------------------------
  // Period 1
  { day: "Wed", period: 1, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "BIO10_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-201", is_lab: false, department: "Hindi" },
  { day: "Wed", period: 1, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Wed", period: 1, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SCI09_B", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },

  // Period 2
  { day: "Wed", period: 2, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SOC10_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-201", is_lab: false, department: "Social Science" },
  { day: "Wed", period: 2, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "CS09_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Wed", period: 2, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ENG09_B", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-102", is_lab: false, department: "English" },

  // Period 3
  { day: "Wed", period: 3, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ENG10_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-201", is_lab: false, department: "English" },
  { day: "Wed", period: 3, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SCI09_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Wed", period: 3, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "CS09_B", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },

  // Period 4 (Pre-Lunch)
  { day: "Wed", period: 4, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "CS10_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Wed", period: 4, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SOC09_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-101", is_lab: false, department: "Social Science" },
  { day: "Wed", period: 4, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 5 (Post-Lunch)
  { day: "Wed", period: 5, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Wed", period: 5, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ENG09_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-101", is_lab: false, department: "English" },
  { day: "Wed", period: 5, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "BIO09_B", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-102", is_lab: false, department: "Hindi" },

  // Period 6
  { day: "Wed", period: 6, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ENG10_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-201", is_lab: false, department: "English" },
  { day: "Wed", period: 6, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "BIO09_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-101", is_lab: false, department: "Hindi" },
  { day: "Wed", period: 6, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SOC09_B", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-102", is_lab: false, department: "Social Science" },

  // Period 7
  { day: "Wed", period: 7, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SCI10_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Wed", period: 7, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SOC09_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-101", is_lab: false, department: "Social Science" },
  { day: "Wed", period: 7, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "PE09_B", course_name: "Physical Education", teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", room_id: "GYM-FIELD", is_lab: false, department: "Athletics" },

  // Period 8
  { day: "Wed", period: 8, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "BIO10_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-201", is_lab: false, department: "Hindi" },
  { day: "Wed", period: 8, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "PE09_A", course_name: "Physical Education", teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", room_id: "GYM-FIELD", is_lab: false, department: "Athletics" },
  { day: "Wed", period: 8, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ART09_B", course_name: "Art Education", teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", room_id: "ART-STUDIO", is_lab: false, department: "Fine Arts" },

  // -------------------------------------------------------------------------
  // THURSDAY
  // -------------------------------------------------------------------------
  // Period 1
  { day: "Thu", period: 1, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "LIB10_A", course_name: "Library & Reading", teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", room_id: "LIBRARY", is_lab: false, department: "Resource" },
  { day: "Thu", period: 1, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SCI09_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Thu", period: 1, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "CS09_B", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },

  // Period 2
  { day: "Thu", period: 2, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "PE10_A", course_name: "Physical Education", teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", room_id: "GYM-FIELD", is_lab: false, department: "Athletics" },
  { day: "Thu", period: 2, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ART09_A", course_name: "Art Education", teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", room_id: "ART-STUDIO", is_lab: false, department: "Fine Arts" },
  { day: "Thu", period: 2, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ENG09_B", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-102", is_lab: false, department: "English" },

  // Period 3
  { day: "Thu", period: 3, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Thu", period: 3, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "BIO09_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-101", is_lab: false, department: "Hindi" },
  { day: "Thu", period: 3, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "LIB09_B", course_name: "Library & Reading", teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", room_id: "LIBRARY", is_lab: false, department: "Resource" },

  // Period 4 (Pre-Lunch)
  { day: "Thu", period: 4, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SOC10_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-201", is_lab: false, department: "Social Science" },
  { day: "Thu", period: 4, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ENG09_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-101", is_lab: false, department: "English" },
  { day: "Thu", period: 4, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SCI09_B", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },

  // Period 5 (Post-Lunch)
  { day: "Thu", period: 5, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SCI10_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Thu", period: 5, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "CS09_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Thu", period: 5, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 6
  { day: "Thu", period: 6, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "CS10_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Thu", period: 6, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "LIB09_A", course_name: "Library & Reading", teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", room_id: "LIBRARY", is_lab: false, department: "Resource" },
  { day: "Thu", period: 6, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "BIO09_B", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-102", is_lab: false, department: "Hindi" },

  // Period 7
  { day: "Thu", period: 7, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ART10_A", course_name: "Art Education", teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", room_id: "ART-STUDIO", is_lab: false, department: "Fine Arts" },
  { day: "Thu", period: 7, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Thu", period: 7, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SOC09_B", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-102", is_lab: false, department: "Social Science" },

  // Period 8
  { day: "Thu", period: 8, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "MATH10_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-201", is_lab: false, department: "Mathematics" },
  { day: "Thu", period: 8, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ENG09_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-101", is_lab: false, department: "English" },
  { day: "Thu", period: 8, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "CS09_B", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },

  // -------------------------------------------------------------------------
  // FRIDAY
  // -------------------------------------------------------------------------
  // Period 1
  { day: "Fri", period: 1, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ENG10_A", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-201", is_lab: false, department: "English" },
  { day: "Fri", period: 1, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "CS09_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Fri", period: 1, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "PE09_B", course_name: "Physical Education", teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", room_id: "GYM-FIELD", is_lab: false, department: "Athletics" },

  // Period 2
  { day: "Fri", period: 2, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "CS10_A", course_name: "Information Technology", teacher_id: "T_POOJA_MEHTA", teacher_name: "Ms. Pooja Mehta", room_id: "COMP-LAB", is_lab: true, department: "Technology" },
  { day: "Fri", period: 2, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "MATH09_A", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-101", is_lab: false, department: "Mathematics" },
  { day: "Fri", period: 2, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SOC09_B", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-102", is_lab: false, department: "Social Science" },

  // Period 3
  { day: "Fri", period: 3, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "BIO10_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-201", is_lab: false, department: "Hindi" },
  { day: "Fri", period: 3, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "ART09_A", course_name: "Art Education", teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", room_id: "ART-STUDIO", is_lab: false, department: "Fine Arts" },
  { day: "Fri", period: 3, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "MATH09_B", course_name: "Mathematics", teacher_id: "T_AMIT_SHARMA", teacher_name: "Mr. Amit Sharma", room_id: "RM-102", is_lab: false, department: "Mathematics" },

  // Period 4 (Pre-Lunch)
  { day: "Fri", period: 4, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "ART10_A", course_name: "Art Education", teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", room_id: "ART-STUDIO", is_lab: false, department: "Fine Arts" },
  { day: "Fri", period: 4, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "BIO09_A", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-101", is_lab: false, department: "Hindi" },
  { day: "Fri", period: 4, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "SCI09_B", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },

  // Period 5 (Post-Lunch)
  { day: "Fri", period: 5, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SCI10_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Fri", period: 5, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "PE09_A", course_name: "Physical Education", teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", room_id: "GYM-FIELD", is_lab: false, department: "Athletics" },
  { day: "Fri", period: 5, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "BIO09_B", course_name: "Hindi Course A", teacher_id: "T_PRIYA_SINGH", teacher_name: "Ms. Priya Singh", room_id: "RM-102", is_lab: false, department: "Hindi" },

  // Period 6
  { day: "Fri", period: 6, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "SOC10_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-201", is_lab: false, department: "Social Science" },
  { day: "Fri", period: 6, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "LIB09_A", course_name: "Library & Reading", teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", room_id: "LIBRARY", is_lab: false, department: "Resource" },
  { day: "Fri", period: 6, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ART09_B", course_name: "Art Education", teacher_id: "T_KAVITA_JOSHI", teacher_name: "Mrs. Kavita Joshi", room_id: "ART-STUDIO", is_lab: false, department: "Fine Arts" },

  // Period 7
  { day: "Fri", period: 7, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "LIB10_A", course_name: "Library & Reading", teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", room_id: "LIBRARY", is_lab: false, department: "Resource" },
  { day: "Fri", period: 7, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SOC09_A", course_name: "Social Science", teacher_id: "T_SURESH_VERMA", teacher_name: "Mr. Suresh Verma", room_id: "RM-101", is_lab: false, department: "Social Science" },
  { day: "Fri", period: 7, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "ENG09_B", course_name: "English Language & Literature", teacher_id: "T_ANJALI_GUPTA", teacher_name: "Ms. Anjali Gupta", room_id: "RM-102", is_lab: false, department: "English" },

  // Period 8
  { day: "Fri", period: 8, group_id: "G10-A", group_name: "Grade 10 - Section A", course_id: "PE10_A", course_name: "Physical Education", teacher_id: "T_VIKRAM_YADAV", teacher_name: "Mr. Vikram Yadav", room_id: "GYM-FIELD", is_lab: false, department: "Athletics" },
  { day: "Fri", period: 8, group_id: "G9-A", group_name: "Grade 9 - Section A", course_id: "SCI09_A", course_name: "Science", teacher_id: "T_RAJESH_KUMAR", teacher_name: "Mr. Rajesh Kumar", room_id: "SCI-LAB", is_lab: true, department: "Science" },
  { day: "Fri", period: 8, group_id: "G9-B", group_name: "Grade 9 - Section B", course_id: "LIB09_B", course_name: "Library & Reading", teacher_id: "T_SANDEEP_PATEL", teacher_name: "Mr. Sandeep Patel", room_id: "LIBRARY", is_lab: false, department: "Resource" },

];
