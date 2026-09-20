import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Database,
  Sparkles,
  FileSpreadsheet,
  School,
  FileDown,
  BookOpen,
  Settings2,
} from "lucide-react";
import {
  SAMPLE_COURSES,
  SAMPLE_TEACHERS,
  SAMPLE_ROOMS,
  SAMPLE_GROUPS,
  SAMPLE_TIME_SLOTS,
  INITIAL_SOLVED_ASSIGNMENTS,
  SCHOOL_INFO
} from "./data/sampleData";
import { Course, Teacher, Room, StudentGroup, TimeSlot, ScheduleAssignment, SchoolInfo } from "./types";
import { TimetableGrid } from "./components/TimetableGrid";
import { InputDataViewer } from "./components/InputDataViewer";
import { BellScheduleEditor, BellItem } from "./components/BellScheduleEditor";
import { AutoScheduleModal } from "./components/AutoScheduleModal";
import { ToastContainer, ToastMessage } from "./components/crud/Toast";
import { SchoolProfileModal } from "./components/crud/SchoolProfileModal";
import { generateTimetablePdf } from "./utils/exportPdf";

const DEFAULT_BELL_ITEMS: BellItem[] = [
  { id: "p1", period: 1, name: "Period 1", startTime: "08:00", endTime: "08:45", type: "academic", note: "Morning Academic Session" },
  { id: "p2", period: 2, name: "Period 2", startTime: "08:45", endTime: "09:30", type: "academic", note: "Core Academic Block" },
  { id: "p3", period: 3, name: "Period 3", startTime: "09:30", endTime: "10:15", type: "academic", note: "Mid-Morning Session" },
  { id: "p4", period: 4, name: "Period 4", startTime: "10:15", endTime: "11:00", type: "academic", note: "Pre-Lunch Block" },
  { id: "b1", period: 0, name: "Lunch Break", startTime: "11:00", endTime: "11:45", type: "break", note: "Lunch & Recreation (45 mins)" },
  { id: "p5", period: 5, name: "Period 5", startTime: "11:45", endTime: "12:30", type: "academic", note: "Post-Lunch Session" },
  { id: "p6", period: 6, name: "Period 6", startTime: "12:30", endTime: "13:15", type: "academic", note: "Afternoon Academic Block" },
  { id: "p7", period: 7, name: "Period 7", startTime: "13:15", endTime: "14:00", type: "academic", note: "Practical / Core" },
  { id: "p8", period: 8, name: "Period 8", startTime: "14:00", endTime: "14:45", type: "academic", note: "Co-Curricular / Activity / Dismissal" },
];

export function App() {
  const [activeTab, setActiveTab] = useState<"timetable" | "bell" | "curriculum">("timetable");
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>(INITIAL_SOLVED_ASSIGNMENTS);
  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(SCHOOL_INFO);
  const [isSchoolProfileModalOpen, setIsSchoolProfileModalOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>(SAMPLE_COURSES);
  const [teachers, setTeachers] = useState<Teacher[]>(SAMPLE_TEACHERS);
  const [rooms, setRooms] = useState<Room[]>(SAMPLE_ROOMS);
  const [groups, setGroups] = useState<StudentGroup[]>(SAMPLE_GROUPS);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(SAMPLE_TIME_SLOTS);
  const [bellSchedule, setBellSchedule] = useState<BellItem[]>(DEFAULT_BELL_ITEMS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load live data from PostgreSQL API on initial mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [currRes, bellRes, ttRes] = await Promise.allSettled([
          fetch("/api/curriculum"),
          fetch("/api/bell-schedule"),
          fetch("/api/timetable"),
        ]);

        if (currRes.status === "fulfilled" && currRes.value.ok) {
          const curr = await currRes.value.json();
          if (curr.school) {
            setSchoolInfo({
              name: curr.school.name,
              academicYear: curr.school.academic_year,
              term: curr.school.term,
              principal: curr.school.principal_name || "",
              coordinator: curr.school.coordinator_name || "",
              address: curr.school.address || "",
              phone: curr.school.phone || "",
              email: curr.school.email || "",
              bellTimings: SCHOOL_INFO.bellTimings,
              session: `${curr.school.academic_year} • ${curr.school.term}`,
            });
          }
          if (curr.courses?.length) setCourses(curr.courses);
          if (curr.teachers?.length) setTeachers(curr.teachers);
          if (curr.rooms?.length) setRooms(curr.rooms);
          if (curr.groups?.length) setGroups(curr.groups);
          if (curr.timeSlots?.length) setTimeSlots(curr.timeSlots);
        }

        if (bellRes.status === "fulfilled" && bellRes.value.ok) {
          const bell = await bellRes.value.json();
          if (Array.isArray(bell) && bell.length) {
            setBellSchedule(bell);
          }
        }

        if (ttRes.status === "fulfilled" && ttRes.value.ok) {
          const tt = await ttRes.value.json();
          if (Array.isArray(tt.assignments) && tt.assignments.length) {
            setAssignments(tt.assignments);
          }
        }
      } catch (e) {
        console.warn("Backend API not reachable; fell back to initial baseline data:", e);
      }
    }

    loadInitialData();
  }, []);

  const handleSaveSchoolProfile = async (updated: SchoolInfo) => {
    try {
      const res = await fetch("/api/school", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          academic_year: updated.academicYear,
          term: updated.term,
          principal_name: updated.principal,
          coordinator_name: updated.coordinator,
          address: updated.address,
          phone: updated.phone,
          email: updated.email,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Could not update school profile");
      }
      const school = await res.json();
      setSchoolInfo({
        name: school.name,
        academicYear: school.academic_year,
        term: school.term,
        principal: school.principal_name || "",
        coordinator: school.coordinator_name || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
        bellTimings: schoolInfo.bellTimings,
        session: `${school.academic_year} • ${school.term}`,
      });
      addToast("success", "School Profile Updated", "Your school details have been saved.");
    } catch (err: any) {
      addToast("error", "Could Not Update School Profile", err.message || "Please try again.");
      throw err;
    }
  };

  const handleSaveBellSchedule = async (newSchedule: BellItem[]) => {
    setBellSchedule(newSchedule);
    try {
      const res = await fetch("/api/bell-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: newSchedule }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBellSchedule(updated);
      }
    } catch (e) {
      console.warn("Could not save to PostgreSQL; preserved in local state:", e);
    }
  };

  const handleResetBellSchedule = async () => {
    try {
      const res = await fetch("/api/bell-schedule/reset", { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setBellSchedule(updated);
        return;
      }
    } catch (e) {
      console.warn("Could not reset on server:", e);
    }
    setBellSchedule(DEFAULT_BELL_ITEMS);
  };

  const handleSolveComplete = (newAssignments: ScheduleAssignment[]) => {
    setAssignments(newAssignments);
    setActiveTab("timetable");
  };

  const handleExportPdf = () => {
    generateTimetablePdf({
      assignments,
      groups,
      teachers,
      rooms,
      schoolInfo,
      bellSchedule,
      filterMode: "master",
      selectedGroupId: groups[0]?.group_id || "",
      selectedTeacherId: teachers[0]?.teacher_id || "",
      selectedRoomId: rooms[0]?.room_id || "",
    });
  };

  // --- CRUD Handlers: Subjects & Courses ---
  const handleAddCourse = async (data: any) => {
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create subject");
      }
      const created: Course = await res.json();
      setCourses((prev) => [...prev, created]);
      addToast("success", "Subject Created", `Subject "${created.course_name}" (${created.course_id}) has been added.`);
    } catch (err: any) {
      addToast("error", "Error Adding Subject", err.message || "Failed to add subject");
      throw err;
    }
  };

  const handleAddCourses = async (data: any[]) => {
    try {
      const res = await fetch("/api/courses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create subjects");
      }
      const created: Course[] = await res.json();
      setCourses((prev) => [...prev, ...created]);
      addToast(
        "success",
        `${created.length} Subjects Created`,
        `Added ${created.length} subject${created.length === 1 ? "" : "s"} to the curriculum.`
      );
    } catch (err: any) {
      addToast("error", "Error Adding Subjects", err.message || "Failed to add subjects");
      throw err;
    }
  };

  const handleUpdateCourse = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update subject");
      }
      const updated: Course = await res.json();
      setCourses((prev) => prev.map((c) => (c.course_id === id ? updated : c)));
      addToast("success", "Subject Updated", `Subject "${updated.course_name}" has been updated.`);
    } catch (err: any) {
      addToast("error", "Error Updating Subject", err.message || "Failed to update subject");
      throw err;
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete subject");
      }
      setCourses((prev) => prev.filter((c) => c.course_id !== id));
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          enrolled_courses: g.enrolled_courses.filter((c) => c !== id),
        }))
      );
      setAssignments((prev) => prev.filter((a) => a.course_id !== id));
      addToast("success", "Subject Deleted", `Subject "${id}" and associated records removed.`);
    } catch (err: any) {
      addToast("error", "Error Deleting Subject", err.message || "Failed to delete subject");
      throw err;
    }
  };

  // --- CRUD Handlers: Teaching Staff ---
  const handleAddTeacher = async (data: any) => {
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add faculty member");
      }
      const created: Teacher = await res.json();
      setTeachers((prev) => [...prev, created]);
      addToast("success", "Teacher Added", `Faculty member "${created.teacher_name}" added.`);
    } catch (err: any) {
      addToast("error", "Error Adding Teacher", err.message || "Failed to add teacher");
      throw err;
    }
  };

  const handleUpdateTeacher = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update faculty member");
      }
      const updated: Teacher = await res.json();
      setTeachers((prev) => prev.map((t) => (t.teacher_id === id ? updated : t)));
      addToast("success", "Teacher Updated", `Faculty member "${updated.teacher_name}" updated.`);
    } catch (err: any) {
      addToast("error", "Error Updating Teacher", err.message || "Failed to update teacher");
      throw err;
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to remove faculty member");
      }
      setTeachers((prev) => prev.filter((t) => t.teacher_id !== id));
      setCourses((prev) => prev.filter((c) => c.teacher_id !== id));
      setAssignments((prev) => prev.filter((a) => a.teacher_id !== id));
      addToast("success", "Teacher Removed", `Faculty member "${id}" and assigned courses removed.`);
    } catch (err: any) {
      addToast("error", "Error Removing Teacher", err.message || "Failed to remove teacher");
      throw err;
    }
  };

  // --- CRUD Handlers: Classrooms & Labs ---
  const handleAddRoom = async (data: any) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add facility/room");
      }
      const created: Room = await res.json();
      setRooms((prev) => [...prev, created]);
      addToast("success", "Facility Added", `Room "${created.room_name || created.room_id}" has been created.`);
    } catch (err: any) {
      addToast("error", "Error Adding Room", err.message || "Failed to add room");
      throw err;
    }
  };

  const handleUpdateRoom = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update room");
      }
      const updated: Room = await res.json();
      setRooms((prev) => prev.map((r) => (r.room_id === id ? updated : r)));
      addToast("success", "Facility Updated", `Room "${updated.room_name || updated.room_id}" has been updated.`);
    } catch (err: any) {
      addToast("error", "Error Updating Room", err.message || "Failed to update room");
      throw err;
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete room");
      }
      setRooms((prev) => prev.filter((r) => r.room_id !== id));
      setAssignments((prev) => prev.filter((a) => a.room_id !== id));
      addToast("success", "Facility Deleted", `Room "${id}" removed.`);
    } catch (err: any) {
      addToast("error", "Error Deleting Room", err.message || "Failed to delete room");
      throw err;
    }
  };

  // --- CRUD Handlers: Student Groups (Classes) ---
  const handleAddGroup = async (data: any) => {
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add class cohort");
      }
      const created: StudentGroup = await res.json();
      setGroups((prev) => [...prev, created]);
      addToast("success", "Class Created", `Class "${created.group_name}" has been added.`);
    } catch (err: any) {
      addToast("error", "Error Adding Class", err.message || "Failed to add class");
      throw err;
    }
  };

  const handleUpdateGroup = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update class");
      }
      const updated: StudentGroup = await res.json();
      setGroups((prev) => prev.map((g) => (g.group_id === id ? updated : g)));
      addToast("success", "Class Updated", `Class "${updated.group_name}" has been updated.`);
    } catch (err: any) {
      addToast("error", "Error Updating Class", err.message || "Failed to update class");
      throw err;
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete class");
      }
      setGroups((prev) => prev.filter((g) => g.group_id !== id));
      setAssignments((prev) => prev.filter((a) => a.group_id !== id));
      addToast("success", "Class Deleted", `Class "${id}" removed.`);
    } catch (err: any) {
      addToast("error", "Error Deleting Class", err.message || "Failed to delete class");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Modern Header Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & School Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
                <School className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-slate-900">
                    School Time Table
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {schoolInfo.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Academic Year {schoolInfo.academicYear} • Class & Teacher Schedule Management
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Export PDF Button */}
              <button
                id="header-export-pdf-btn"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Export timetable as PDF"
              >
                <FileDown className="w-4 h-4 text-rose-600" />
                <span>Export PDF</span>
              </button>

              {/* Export to Excel */}
              <a
                id="header-download-excel-btn"
                href="/api/download/excel"
                download="timetable_output.xlsx"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Download formatted Excel workbook"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Export Excel</span>
              </a>

              <button
                id="header-school-profile-btn"
                onClick={() => setIsSchoolProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Edit school profile"
              >
                <Settings2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">School Profile</span>
              </button>

              {/* Schedule Generator */}
              <button
                id="header-run-solver-btn"
                onClick={() => setIsAutoScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Generate timetable"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* User-Oriented Navigation Tabs */}
          <div className="flex items-center space-x-1 border-t border-slate-100 py-2.5 overflow-x-auto">
            <button
              id="nav-timetable-tab"
              onClick={() => setActiveTab("timetable")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "timetable"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Class Timetables</span>
            </button>

            <button
              id="nav-bell-tab"
              onClick={() => setActiveTab("bell")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "bell"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Bell Schedule & Timings</span>
            </button>

            <button
              id="nav-curriculum-tab"
              onClick={() => setActiveTab("curriculum")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "curriculum"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>School Staff & Curriculum</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Class & Teacher Timetables */}
        {activeTab === "timetable" && (
          <TimetableGrid
            assignments={assignments}
            groups={groups}
            teachers={teachers}
            rooms={rooms}
            schoolInfo={schoolInfo}
            bellSchedule={bellSchedule}
            onOpenBellSettings={() => setActiveTab("bell")}
          />
        )}

        {/* Tab 2: Bell Schedule & Timings Editor */}
        {activeTab === "bell" && (
          <BellScheduleEditor
            bellSchedule={bellSchedule}
            onSave={handleSaveBellSchedule}
            onReset={handleResetBellSchedule}
          />
        )}

        {/* Tab 3: School Staff & Curriculum Directory */}
        {activeTab === "curriculum" && (
          <InputDataViewer
            courses={courses}
            teachers={teachers}
            rooms={rooms}
            groups={groups}
            timeSlots={timeSlots}
            onAddCourse={handleAddCourse}
            onAddCourses={handleAddCourses}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}
      </main>

      <SchoolProfileModal
        isOpen={isSchoolProfileModalOpen}
        schoolInfo={schoolInfo}
        onSave={handleSaveSchoolProfile}
        onClose={() => setIsSchoolProfileModalOpen(false)}
      />

      {/* School Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{schoolInfo.name}</span>
            <span>•</span>
            <span>School Timetable Management</span>
            <span>•</span>
            <span>Academic Year {schoolInfo.academicYear}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportPdf}
              className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Export PDF
            </button>
            <span className="text-slate-300">•</span>
            <a
              href="/api/download/excel"
              download="timetable_output.xlsx"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Export Excel Workbook (.xlsx)
            </a>
          </div>
        </div>
      </footer>

      {/* Auto-Schedule Generator Modal */}
      <AutoScheduleModal
        isOpen={isAutoScheduleModalOpen}
        schoolInfo={schoolInfo}
        onClose={() => setIsAutoScheduleModalOpen(false)}
        onSolveComplete={handleSolveComplete}
      />

      {/* Toast Feedback Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
