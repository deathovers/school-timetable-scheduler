import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Database,
  Sparkles,
  FileSpreadsheet,
  School,
  FileDown,
  BookOpen
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
import { Course, Teacher, Room, StudentGroup, TimeSlot, ScheduleAssignment } from "./types";
import { TimetableGrid } from "./components/TimetableGrid";
import { InputDataViewer } from "./components/InputDataViewer";
import { BellScheduleEditor, BellItem } from "./components/BellScheduleEditor";
import { AutoScheduleModal } from "./components/AutoScheduleModal";

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
  const [schoolInfo, setSchoolInfo] = useState(SCHOOL_INFO);
  const [courses, setCourses] = useState<Course[]>(SAMPLE_COURSES);
  const [teachers, setTeachers] = useState<Teacher[]>(SAMPLE_TEACHERS);
  const [rooms, setRooms] = useState<Room[]>(SAMPLE_ROOMS);
  const [groups, setGroups] = useState<StudentGroup[]>(SAMPLE_GROUPS);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(SAMPLE_TIME_SLOTS);
  const [bellSchedule, setBellSchedule] = useState<BellItem[]>(DEFAULT_BELL_ITEMS);

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

  const handlePrint = () => {
    window.print();
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
                onClick={handlePrint}
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
          />
        )}
      </main>

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
              onClick={handlePrint}
              className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Print Timetable
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
        onClose={() => setIsAutoScheduleModalOpen(false)}
        onSolveComplete={handleSolveComplete}
      />
    </div>
  );
}

export default App;
