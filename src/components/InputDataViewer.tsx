import React, { useState } from "react";
import { Course, Teacher, Room, StudentGroup, TimeSlot } from "../types";
import {
  BookOpen,
  Users,
  Building2,
  GraduationCap,
  Clock,
  Search,
  FlaskConical,
  Coffee,
  UtensilsCrossed,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { BELL_SCHEDULE, SCHOOL_INFO } from "../data/sampleData";

interface InputDataViewerProps {
  courses: Course[];
  teachers: Teacher[];
  rooms: Room[];
  groups: StudentGroup[];
  timeSlots: TimeSlot[];
}

export const InputDataViewer: React.FC<InputDataViewerProps> = ({
  courses,
  teachers,
  rooms,
  groups,
  timeSlots,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"courses" | "teachers" | "rooms" | "groups" | "bell">("courses");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCourses = courses.filter(
    (c) =>
      c.course_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRooms = rooms.filter(
    (r) =>
      r.room_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.room_name && r.room_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.room_type && r.room_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGroups = groups.filter(
    (g) =>
      g.group_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.homeroom_teacher && g.homeroom_teacher.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Control Bar: Subtabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Subtab Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              id="subtab-courses-btn"
              onClick={() => setActiveSubTab("courses")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "courses"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Subjects & Courses ({courses.length})</span>
            </button>

            <button
              id="subtab-teachers-btn"
              onClick={() => setActiveSubTab("teachers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "teachers"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teaching Staff ({teachers.length})</span>
            </button>

            <button
              id="subtab-rooms-btn"
              onClick={() => setActiveSubTab("rooms")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "rooms"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-violet-600" />
              <span>Classrooms & Labs ({rooms.length})</span>
            </button>

            <button
              id="subtab-groups-btn"
              onClick={() => setActiveSubTab("groups")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "groups"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              <span>School Classes ({groups.length})</span>
            </button>

            <button
              id="subtab-bell-btn"
              onClick={() => setActiveSubTab("bell")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "bell"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Bell Timings</span>
            </button>
          </div>

          {/* Search Filter */}
          {activeSubTab !== "bell" && (
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="dataset-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search records..."
                className="w-full bg-slate-50 border border-slate-300/80 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* SUBTAB 1: COURSES */}
      {activeSubTab === "courses" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              School Curriculum & Course Catalog
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {filteredCourses.length} of {courses.length} subjects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Subject Code</th>
                  <th className="py-2.5 px-4">Course Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Weekly Periods</th>
                  <th className="py-2.5 px-4">Assigned Teacher</th>
                  <th className="py-2.5 px-4">Facility Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCourses.map((c) => {
                  const teacher = teachers.find((t) => t.teacher_id === c.teacher_id);
                  return (
                    <tr key={c.course_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {c.course_id}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-semibold">
                        {c.course_name}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {c.department || "Academic"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {c.weekly_periods} periods/wk
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {teacher ? teacher.teacher_name : c.teacher_id}
                      </td>
                      <td className="py-2.5 px-4">
                        {c.lab_required ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <FlaskConical className="w-3 h-3" />
                            Laboratory Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                            Standard Classroom
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TEACHERS */}
      {activeSubTab === "teachers" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Teaching Faculty & Subject Specialists
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {filteredTeachers.length} of {teachers.length} faculty members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Teacher ID</th>
                  <th className="py-2.5 px-4">Full Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Homeroom Responsibility</th>
                  <th className="py-2.5 px-4">Daily Workload Limit</th>
                  <th className="py-2.5 px-4">Unavailable Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTeachers.map((t) => (
                  <tr key={t.teacher_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {t.teacher_id}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {t.teacher_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {t.department || "Academic"}
                    </td>
                    <td className="py-2.5 px-4">
                      {t.homeroom_class && t.homeroom_class !== "None" ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                          {t.homeroom_class}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        Max {t.max_hours_per_day} periods/day
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {t.unavailable_times ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.unavailable_times}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Fully Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ROOMS */}
      {activeSubTab === "rooms" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Campus Classrooms, Science Labs & Sports Facilities
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {filteredRooms.length} of {rooms.length} facilities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Room ID</th>
                  <th className="py-2.5 px-4">Facility Name</th>
                  <th className="py-2.5 px-4">Facility Category</th>
                  <th className="py-2.5 px-4">Student Seating Capacity</th>
                  <th className="py-2.5 px-4">Lab Hardware Specs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRooms.map((r) => (
                  <tr key={r.room_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {r.room_id}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {r.room_name || r.room_id}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {r.room_type || (r.is_lab ? "Science Lab" : "Classroom")}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {r.room_capacity} Seats
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {r.is_lab ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <FlaskConical className="w-3 h-3" />
                          Specialized Equipment
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard Whiteboard & AV</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: GROUPS (CLASSES) */}
      {activeSubTab === "groups" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              School Classes & Grade Cohorts
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {filteredGroups.length} of {groups.length} classes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Class ID</th>
                  <th className="py-2.5 px-4">Class Name</th>
                  <th className="py-2.5 px-4">Class Strength</th>
                  <th className="py-2.5 px-4">Homeroom Teacher</th>
                  <th className="py-2.5 px-4">Base Classroom</th>
                  <th className="py-2.5 px-4">Required Subject Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredGroups.map((g) => (
                  <tr key={g.group_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {g.group_id}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {g.group_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {g.student_count} Students
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">
                      {g.homeroom_teacher || "Assigned"}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      {g.homeroom_room_id || "RM-101"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                        40 Periods / Week ({g.enrolled_courses.length} Subjects)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 5: BELL SCHEDULE */}
      {activeSubTab === "bell" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                School Master Bell Schedule & Daily Routine
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Standard School Day: 08:00 AM to 02:45 PM (8 Periods with Lunch after Period 4)
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Routine
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-4">Sequence / Period</th>
                  <th className="py-2.5 px-4">Time Interval</th>
                  <th className="py-2.5 px-4">Session Type</th>
                  <th className="py-2.5 px-4">Purpose & Guidelines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {BELL_SCHEDULE.map((b, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      b.type === "break" ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      {b.type === "break" ? (
                        b.name.includes("Lunch") ? (
                          <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Coffee className="w-4 h-4 text-amber-600" />
                        )
                      ) : (
                        <Clock className="w-4 h-4 text-indigo-600" />
                      )}
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {b.time}
                    </td>
                    <td className="py-3 px-4">
                      {b.type === "break" ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px]">
                          Break / Nutrition
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                          Academic Period (45 min)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
