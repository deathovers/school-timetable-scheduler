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
  Plus,
  Pencil,
  Trash2,
  Copy,
  ListPlus,
} from "lucide-react";
import { BELL_SCHEDULE } from "../data/sampleData";
import { CourseModal } from "./crud/CourseModal";
import { BulkCourseModal } from "./crud/BulkCourseModal";
import { TeacherModal } from "./crud/TeacherModal";
import { RoomModal } from "./crud/RoomModal";
import { GroupModal } from "./crud/GroupModal";
import { ConfirmModal } from "./crud/ConfirmModal";

interface InputDataViewerProps {
  courses: Course[];
  teachers: Teacher[];
  rooms: Room[];
  groups: StudentGroup[];
  timeSlots: TimeSlot[];
  onAddCourse?: (data: any) => Promise<void>;
  onAddCourses?: (data: any[]) => Promise<void>;
  onUpdateCourse?: (id: string, data: any) => Promise<void>;
  onDeleteCourse?: (id: string) => Promise<void>;
  onAddTeacher?: (data: any) => Promise<void>;
  onUpdateTeacher?: (id: string, data: any) => Promise<void>;
  onDeleteTeacher?: (id: string) => Promise<void>;
  onAddRoom?: (data: any) => Promise<void>;
  onUpdateRoom?: (id: string, data: any) => Promise<void>;
  onDeleteRoom?: (id: string) => Promise<void>;
  onAddGroup?: (data: any) => Promise<void>;
  onUpdateGroup?: (id: string, data: any) => Promise<void>;
  onDeleteGroup?: (id: string) => Promise<void>;
}

export const InputDataViewer: React.FC<InputDataViewerProps> = ({
  courses,
  teachers,
  rooms,
  groups,
  timeSlots,
  onAddCourse,
  onAddCourses,
  onUpdateCourse,
  onDeleteCourse,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"courses" | "teachers" | "rooms" | "groups" | "bell">("courses");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isBulkCourseModalOpen, setIsBulkCourseModalOpen] = useState(false);
  const [courseIdsToCopy, setCourseIdsToCopy] = useState<string[]>([]);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);

  // Confirm Delete State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    isDeleting?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

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

  const selectedCourses = courses.filter((course) => courseIdsToCopy.includes(course.course_id));
  const allVisibleCoursesSelected = filteredCourses.length > 0 && filteredCourses.every((course) => courseIdsToCopy.includes(course.course_id));

  const toggleCourseSelection = (courseId: string) => {
    setCourseIdsToCopy((previous) => previous.includes(courseId)
      ? previous.filter((id) => id !== courseId)
      : [...previous, courseId]);
  };

  const toggleVisibleCourseSelection = () => {
    const visibleIds = filteredCourses.map((course) => course.course_id);
    setCourseIdsToCopy((previous) => allVisibleCoursesSelected
      ? previous.filter((id) => !visibleIds.includes(id))
      : [...new Set([...previous, ...visibleIds])]);
  };

  // Trigger Confirmation Helper
  const askDelete = (
    title: string,
    message: string,
    itemName: string,
    action: () => Promise<void>
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      itemName,
      isDeleting: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isDeleting: true }));
        try {
          await action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch {
          setConfirmDialog((prev) => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

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
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                School Curriculum & Course Catalog
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredCourses.length} of {courses.length})
              </span>
            </div>
            {onAddCourse && (
              <div className="flex items-center gap-2">
                {onAddCourses && (
                  <button
                    id="btn-bulk-add-course"
                    onClick={() => {
                      setCourseIdsToCopy([]);
                      setIsBulkCourseModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Bulk Add</span>
                  </button>
                )}
                <button
                  id="btn-add-course"
                  onClick={() => {
                    setEditingCourse(null);
                    setIsCourseModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>
            )}
          </div>

          {onAddCourses && courseIdsToCopy.length > 0 && (
            <div className="px-4 py-2.5 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-indigo-900">{courseIdsToCopy.length} subject{courseIdsToCopy.length === 1 ? "" : "s"} selected</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCourseIdsToCopy([])} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer">Clear</button>
                <button onClick={() => setIsBulkCourseModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"><Copy className="w-3.5 h-3.5" />Copy Selected</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  {onAddCourses && <th className="py-2.5 px-3 w-10"><input type="checkbox" aria-label="Select all visible subjects" checked={allVisibleCoursesSelected} onChange={toggleVisibleCourseSelection} className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" /></th>}
                  <th className="py-2.5 px-4">Subject Code</th>
                  <th className="py-2.5 px-4">Course Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Weekly Periods</th>
                  <th className="py-2.5 px-4">Assigned Teacher</th>
                  <th className="py-2.5 px-4">Facility Requirement</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCourses.map((c) => {
                  const teacher = teachers.find((t) => t.teacher_id === c.teacher_id);
                  return (
                    <tr key={c.course_id} className="hover:bg-slate-50/50 transition-colors">
                      {onAddCourses && <td className="py-2.5 px-3"><input type="checkbox" aria-label={`Select ${c.course_name}`} checked={courseIdsToCopy.includes(c.course_id)} onChange={() => toggleCourseSelection(c.course_id)} className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" /></td>}
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
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCourse(c);
                              setIsCourseModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Subject"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              askDelete(
                                "Delete Subject Course",
                                `Are you sure you want to delete ${c.course_name}? Associated schedule assignments will be cleared.`,
                                `${c.course_name} (${c.course_id})`,
                                () => (onDeleteCourse ? onDeleteCourse(c.course_id) : Promise.resolve())
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Teaching Faculty & Subject Specialists
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredTeachers.length} of {teachers.length})
              </span>
            </div>
            {onAddTeacher && (
              <button
                id="btn-add-teacher"
                onClick={() => {
                  setEditingTeacher(null);
                  setIsTeacherModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Faculty</span>
              </button>
            )}
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
                  <th className="py-2.5 px-4 text-right">Actions</th>
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
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTeacher(t);
                            setIsTeacherModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Edit Faculty"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            askDelete(
                              "Delete Faculty Member",
                              `Are you sure you want to delete ${t.teacher_name}? Associated courses and timetable slots will be removed.`,
                              `${t.teacher_name} (${t.teacher_id})`,
                              () => (onDeleteTeacher ? onDeleteTeacher(t.teacher_id) : Promise.resolve())
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Campus Classrooms, Science Labs & Sports Facilities
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredRooms.length} of {rooms.length})
              </span>
            </div>
            {onAddRoom && (
              <button
                id="btn-add-room"
                onClick={() => {
                  setEditingRoom(null);
                  setIsRoomModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Facility</span>
              </button>
            )}
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
                  <th className="py-2.5 px-4 text-right">Actions</th>
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
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRoom(r);
                            setIsRoomModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                          title="Edit Facility"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            askDelete(
                              "Delete Campus Facility",
                              `Are you sure you want to delete ${r.room_name || r.room_id}? Associated timetable assignments will be cleared.`,
                              `${r.room_name || r.room_id} (${r.room_id})`,
                              () => (onDeleteRoom ? onDeleteRoom(r.room_id) : Promise.resolve())
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Facility"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                School Classes & Grade Cohorts
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredGroups.length} of {groups.length})
              </span>
            </div>
            {onAddGroup && (
              <button
                id="btn-add-group"
                onClick={() => {
                  setEditingGroup(null);
                  setIsGroupModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            )}
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
                  <th className="py-2.5 px-4 text-right">Actions</th>
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
                        {g.enrolled_courses.length} Subjects
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingGroup(g);
                            setIsGroupModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Class"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            askDelete(
                              "Delete School Class",
                              `Are you sure you want to delete ${g.group_name}? Associated schedule assignments will be cleared.`,
                              `${g.group_name} (${g.group_id})`,
                              () => (onDeleteGroup ? onDeleteGroup(g.group_id) : Promise.resolve())
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* CRUD Modals */}
      <CourseModal
        isOpen={isCourseModalOpen}
        course={editingCourse}
        teachers={teachers}
        groups={groups}
        existingCourses={courses}
        existingCourseIds={courses.map((c) => c.course_id)}
        onSave={async (data) => {
          if (editingCourse) {
            await onUpdateCourse?.(editingCourse.course_id, data);
          } else {
            await onAddCourse?.(data);
          }
        }}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
      />

      <BulkCourseModal
        isOpen={isBulkCourseModalOpen}
        coursesToCopy={selectedCourses}
        teachers={teachers}
        existingCourseIds={courses.map((course) => course.course_id)}
        onSave={async (data) => onAddCourses?.(data)}
        onClose={() => {
          setIsBulkCourseModalOpen(false);
          setCourseIdsToCopy([]);
        }}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        teacher={editingTeacher}
        existingTeacherIds={teachers.map((t) => t.teacher_id)}
        onSave={async (data) => {
          if (editingTeacher) {
            await onUpdateTeacher?.(editingTeacher.teacher_id, data);
          } else {
            await onAddTeacher?.(data);
          }
        }}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacher(null);
        }}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        room={editingRoom}
        existingRoomIds={rooms.map((r) => r.room_id)}
        existingRooms={rooms}
        onSave={async (data) => {
          if (editingRoom) {
            await onUpdateRoom?.(editingRoom.room_id, data);
          } else {
            await onAddRoom?.(data);
          }
        }}
        onClose={() => {
          setIsRoomModalOpen(false);
          setEditingRoom(null);
        }}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        group={editingGroup}
        existingGroupIds={groups.map((g) => g.group_id)}
        courses={courses}
        teachers={teachers}
        rooms={rooms}
        groups={groups}
        onSave={async (data) => {
          if (editingGroup) {
            await onUpdateGroup?.(editingGroup.group_id, data);
          } else {
            await onAddGroup?.(data);
          }
        }}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        itemName={confirmDialog.itemName}
        isDeleting={confirmDialog.isDeleting}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
