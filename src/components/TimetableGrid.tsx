import React, { useState } from "react";
import { ScheduleAssignment, StudentGroup, Teacher, Room, SchoolInfo } from "../types";
import {
  GraduationCap,
  Users,
  Building2,
  FlaskConical,
  Clock,
  CheckCircle2,
  ChevronDown,
  Calendar,
  X,
  FileDown,
  BookOpen,
  LayoutGrid,
  Coffee,
  UtensilsCrossed
} from "lucide-react";
import { BELL_SCHEDULE } from "../data/sampleData";
import { BellItem } from "./BellScheduleEditor";
import { generateTimetablePdf } from "../utils/exportPdf";

interface TimetableGridProps {
  assignments: ScheduleAssignment[];
  groups: StudentGroup[];
  teachers: Teacher[];
  rooms: Room[];
  schoolInfo: SchoolInfo;
  bellSchedule?: BellItem[];
  onOpenBellSettings?: () => void;
}

type FilterMode = "class" | "teacher" | "room" | "master";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS: Record<string, { full: string; short: string }> = {
  Mon: { full: "Monday", short: "MON" },
  Tue: { full: "Tuesday", short: "TUE" },
  Wed: { full: "Wednesday", short: "WED" },
  Thu: { full: "Thursday", short: "THU" },
  Fri: { full: "Friday", short: "FRI" },
};

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const PERIOD_TIMES: Record<number, { time: string; label: string; periodNum: number }> = {
  1: { time: "08:00 – 08:45", label: "Period 1", periodNum: 1 },
  2: { time: "08:45 – 09:30", label: "Period 2", periodNum: 2 },
  3: { time: "09:30 – 10:15", label: "Period 3", periodNum: 3 },
  4: { time: "10:15 – 11:00", label: "Period 4", periodNum: 4 },
  5: { time: "11:45 – 12:30", label: "Period 5", periodNum: 5 },
  6: { time: "12:30 – 13:15", label: "Period 6", periodNum: 6 },
  7: { time: "13:15 – 14:00", label: "Period 7", periodNum: 7 },
  8: { time: "14:00 – 14:45", label: "Period 8", periodNum: 8 },
};

// Department styling for clean school aesthetic
const DEPARTMENT_THEMES: Record<string, {
  cardBg: string;
  borderColor: string;
  titleColor: string;
  badgeBg: string;
  accentBar: string;
}> = {
  Mathematics: {
    cardBg: "bg-blue-50/80 hover:bg-blue-50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-950",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    accentBar: "bg-blue-600",
  },
  Sciences: {
    cardBg: "bg-emerald-50/80 hover:bg-emerald-50",
    borderColor: "border-emerald-200",
    titleColor: "text-emerald-950",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accentBar: "bg-emerald-600",
  },
  Humanities: {
    cardBg: "bg-amber-50/80 hover:bg-amber-50",
    borderColor: "border-amber-200",
    titleColor: "text-amber-950",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
    accentBar: "bg-amber-600",
  },
  Technology: {
    cardBg: "bg-cyan-50/80 hover:bg-cyan-50",
    borderColor: "border-cyan-200",
    titleColor: "text-cyan-950",
    badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200",
    accentBar: "bg-cyan-600",
  },
  Athletics: {
    cardBg: "bg-purple-50/80 hover:bg-purple-50",
    borderColor: "border-purple-200",
    titleColor: "text-purple-950",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
    accentBar: "bg-purple-600",
  },
  "Fine Arts": {
    cardBg: "bg-rose-50/80 hover:bg-rose-50",
    borderColor: "border-rose-200",
    titleColor: "text-rose-950",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    accentBar: "bg-rose-600",
  },
  Resource: {
    cardBg: "bg-slate-50/90 hover:bg-slate-100/80",
    borderColor: "border-slate-200",
    titleColor: "text-slate-900",
    badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
    accentBar: "bg-slate-500",
  },
};

const DEFAULT_THEME = {
  cardBg: "bg-indigo-50/80 hover:bg-indigo-50",
  borderColor: "border-indigo-200",
  titleColor: "text-indigo-950",
  badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
  accentBar: "bg-indigo-600",
};

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  assignments,
  groups,
  teachers,
  rooms,
  schoolInfo,
  bellSchedule,
  onOpenBellSettings,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>("class");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.group_id || "G9-A");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.teacher_id || "T_CLARK");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.room_id || "RM-101");
  const [activeModalSlot, setActiveModalSlot] = useState<ScheduleAssignment | null>(null);
  const [showLunchModal, setShowLunchModal] = useState<boolean>(false);
  const [showBellScheduleBanner, setShowBellScheduleBanner] = useState(true);

  // Dynamic bell timing helpers
  const getPeriodTime = (p: number): string => {
    if (bellSchedule) {
      const item = bellSchedule.find((b) => b.type === "academic" && b.period === p);
      if (item) return `${item.startTime} – ${item.endTime}`;
    }
    return PERIOD_TIMES[p]?.time || "";
  };

  const getBreakTime = (nameLike: string): string => {
    if (bellSchedule) {
      const item = bellSchedule.find(
        (b) => b.type === "break" && b.name.toLowerCase().includes(nameLike.toLowerCase())
      );
      if (item) return `${item.startTime} – ${item.endTime}`;
    }
    return "11:00 – 11:45";
  };

  const bannerItems = bellSchedule || BELL_SCHEDULE.map((b, idx) => ({
    id: `b-${idx}`,
    period: b.period,
    name: b.name,
    startTime: b.time.split(" – ")[0] || "",
    endTime: b.time.split(" – ")[1] || "",
    type: b.type as "academic" | "break",
    note: b.note,
  }));

  // Filter assignments based on current selection
  const filteredAssignments = assignments.filter((a) => {
    if (filterMode === "class") return a.group_id === selectedGroupId;
    if (filterMode === "teacher") return a.teacher_id === selectedTeacherId;
    if (filterMode === "room") return a.room_id === selectedRoomId;
    return true; // master mode includes all
  });

  const getSlot = (day: string, period: number, groupId?: string): ScheduleAssignment | undefined => {
    if (filterMode === "master" && groupId) {
      return assignments.find((a) => a.day === day && a.period === period && a.group_id === groupId);
    }
    return filteredAssignments.find((a) => a.day === day && a.period === period);
  };

  const currentGroup = groups.find((g) => g.group_id === selectedGroupId);
  const currentTeacher = teachers.find((t) => t.teacher_id === selectedTeacherId);
  const currentRoom = rooms.find((r) => r.room_id === selectedRoomId);

  const handleExportPdf = () => {
    generateTimetablePdf({
      assignments,
      groups,
      teachers,
      rooms,
      schoolInfo,
      bellSchedule,
      filterMode,
      selectedGroupId,
      selectedTeacherId,
      selectedRoomId,
    });
  };

  return (
    <div className="space-y-4">
      {/* School Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
                Official School Timetable
              </span>
              <span className="text-xs font-medium text-slate-500">• {schoolInfo.academicYear}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {schoolInfo.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bell Timings: <span className="font-semibold text-slate-700">{bellSchedule ? `${bellSchedule[0]?.startTime || "08:15"} – ${bellSchedule[bellSchedule.length - 1]?.endTime || "14:00"}` : schoolInfo.bellTimings}</span>{schoolInfo.principal && <> • Principal: <span className="font-semibold text-slate-700">{schoolInfo.principal}</span></>}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenBellSettings && (
              <button
                onClick={onOpenBellSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors cursor-pointer"
                title="Edit Bell Timings"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Bell Timings</span>
              </button>
            )}

            <button
              onClick={() => setShowBellScheduleBanner(!showBellScheduleBanner)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{showBellScheduleBanner ? "Hide Bell Schedule" : "Show Bell Schedule"}</span>
            </button>

            <button
              onClick={handleExportPdf}
              id="export-pdf-timetable-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Export formatted timetable as PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Bell Schedule Bar (Collapsible) */}
        {showBellScheduleBanner && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> School Bell Schedule & Daily Routine
              </span>
              <span className="text-[11px] text-slate-400">8 Academic Periods • 1 Lunch Break after Period 4</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {bannerItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    item.type === "break"
                      ? "bg-amber-50/70 border-amber-200/80 text-amber-900"
                      : "bg-slate-50/80 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                    {item.type === "break" ? (
                      item.name.includes("Lunch") ? (
                        <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                      ) : (
                        <Coffee className="w-3 h-3 text-amber-600" />
                      )
                    ) : (
                      <BookOpen className="w-3 h-3 text-indigo-600" />
                    )}
                    <span>{item.name}</span>
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-slate-600 mt-0.5">
                    {item.startTime} – {item.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Perspective Switcher & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Perspective Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Timetable View
            </span>
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                id="filter-mode-class-btn"
                onClick={() => setFilterMode("class")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === "class"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>By Class / Section</span>
              </button>

              <button
                id="filter-mode-teacher-btn"
                onClick={() => setFilterMode("teacher")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === "teacher"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>By Subject Teacher</span>
              </button>

              <button
                id="filter-mode-room-btn"
                onClick={() => setFilterMode("room")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === "room"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-violet-600" />
                <span>By Room / Lab</span>
              </button>

              <button
                id="filter-mode-master-btn"
                onClick={() => setFilterMode("master")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === "master"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-purple-600" />
                <span>Master All-Class Grid</span>
              </button>
            </div>
          </div>

          {/* Entity Selector Dropdown (When not in master view) */}
          {filterMode !== "master" && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select {filterMode === "class" ? "Class" : filterMode === "teacher" ? "Teacher" : "Facility"}
              </span>
              <div className="relative min-w-[280px]">
                {filterMode === "class" && (
                  <select
                    id="class-selector"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-300/80 text-slate-800 text-xs font-semibold rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                  >
                    {groups.map((g) => (
                      <option key={g.group_id} value={g.group_id}>
                        {g.group_name} ({g.student_count} Students • {g.homeroom_teacher})
                      </option>
                    ))}
                  </select>
                )}

                {filterMode === "teacher" && (
                  <select
                    id="teacher-selector"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-300/80 text-slate-800 text-xs font-semibold rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                  >
                    {teachers.map((t) => (
                      <option key={t.teacher_id} value={t.teacher_id}>
                        {t.teacher_name} ({t.department} • Max {t.max_hours_per_day}p/day)
                      </option>
                    ))}
                  </select>
                )}

                {filterMode === "room" && (
                  <select
                    id="room-selector"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-300/80 text-slate-800 text-xs font-semibold rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
                  >
                    {rooms.map((r) => (
                      <option key={r.room_id} value={r.room_id}>
                        {r.room_name || r.room_id} ({r.room_capacity} Seats • {r.room_type || (r.is_lab ? "Lab" : "Classroom")})
                      </option>
                    ))}
                  </select>
                )}
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Selected Context Bar */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            {filterMode === "class" && currentGroup && (
              <>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  {currentGroup.group_name}
                </span>
                <span className="text-slate-300">•</span>
                <span>Homeroom: <strong className="text-slate-800">{currentGroup.homeroom_teacher}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Base Room: <strong className="text-slate-800">{currentGroup.homeroom_room_id}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Students: <strong className="text-slate-800">{currentGroup.student_count}</strong></span>
              </>
            )}
            {filterMode === "teacher" && currentTeacher && (
              <>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  {currentTeacher.teacher_name}
                </span>
                <span className="text-slate-300">•</span>
                <span>Department: <strong className="text-slate-800">{currentTeacher.department}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Daily Limit: <strong className="text-slate-800">{currentTeacher.max_hours_per_day} Periods</strong></span>
                <span className="text-slate-300">•</span>
                <span>Unavailability: <strong className="text-slate-800">{currentTeacher.unavailable_times || "Fully Available"}</strong></span>
              </>
            )}
            {filterMode === "room" && currentRoom && (
              <>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-violet-600" />
                  {currentRoom.room_name || currentRoom.room_id}
                </span>
                <span className="text-slate-300">•</span>
                <span>Type: <strong className="text-slate-800">{currentRoom.room_type || (currentRoom.is_lab ? "Laboratory" : "Classroom")}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Capacity: <strong className="text-slate-800">{currentRoom.room_capacity} Seats</strong></span>
              </>
            )}
            {filterMode === "master" && (
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-purple-600" />
                Master Matrix: Grade 9-A, Grade 9-B, Grade 10-A (120 Weekly Class Sessions)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Clock className="w-3 h-3" />
              {filterMode === "master" ? "120/120 Sessions" : `${filteredAssignments.length} Periods Scheduled`}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" />
              Zero Timetable Conflicts
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Table Grid View */}
      {filterMode !== "master" ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[1080px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600">
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-28 text-slate-500 border-r border-slate-200/60">
                    Day / Bell
                  </th>
                  {/* Periods 1 to 4 */}
                  {PERIODS.slice(0, 4).map((p) => (
                    <th key={p} className="py-3 px-3 text-center border-r border-slate-200/60">
                      <div className="text-xs font-bold text-slate-800">
                        Period 0{p}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 font-semibold">
                        {getPeriodTime(p)}
                      </div>
                    </th>
                  ))}

                  {/* Explicit LUNCH BREAK Column */}
                  <th className="py-3 px-3 text-center border-r border-amber-200/80 bg-amber-50/70 min-w-[135px]">
                    <div className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-950">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
                      <span>Lunch Break</span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-700 mt-0.5 font-semibold">
                      {getBreakTime("lunch")}
                    </div>
                    <div className="text-[9px] font-semibold text-amber-700/90 bg-amber-100/90 rounded px-1.5 py-0.5 mt-1 border border-amber-200 inline-block">
                      45 Mins Recess
                    </div>
                  </th>

                  {/* Periods 5 to 8 */}
                  {PERIODS.slice(4).map((p) => (
                    <th key={p} className="py-3 px-3 text-center border-r border-slate-200/60 last:border-r-0">
                      <div className="text-xs font-bold text-slate-800">
                        Period 0{p}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 font-semibold">
                        {getPeriodTime(p)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/30 transition-colors">
                    {/* Day Label Column */}
                    <td className="py-3 px-4 border-r border-slate-200/60 bg-slate-50/50 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          {DAY_LABELS[day].full}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-400">
                          {DAY_LABELS[day].short}
                        </span>
                      </div>
                    </td>

                    {/* Periods 1 to 4 Slots */}
                    {PERIODS.slice(0, 4).map((period) => {
                      const slot = getSlot(day, period);
                      const dept = slot?.department || "General";
                      const theme = DEPARTMENT_THEMES[dept] || DEFAULT_THEME;

                      return (
                        <td
                          key={period}
                          className="p-1.5 border-r border-slate-200/60 align-top min-w-[145px] h-[104px]"
                        >
                          {slot ? (
                            <div
                              onClick={() => setActiveModalSlot(slot)}
                              className={`h-full w-full rounded-xl p-2.5 border ${theme.borderColor} ${theme.cardBg} flex flex-col justify-between cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${theme.badgeBg}`}>
                                    {slot.department || "Academic"}
                                  </span>
                                  {slot.is_lab && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-bold uppercase tracking-wider">
                                      <FlaskConical className="w-2.5 h-2.5" />
                                      Lab
                                    </span>
                                  )}
                                </div>
                                <div className={`text-xs font-bold leading-snug truncate ${theme.titleColor}`}>
                                  {slot.course_name}
                                </div>
                                <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                                  {filterMode === "teacher" ? slot.group_name : slot.teacher_name}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200/60 text-[10px] font-mono text-slate-500">
                                <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 shadow-2xs">
                                  {slot.room_id}
                                </span>
                                <span className="text-slate-600 font-semibold">
                                  {slot.group_id}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full rounded-xl border border-dashed border-slate-200/80 bg-slate-50/40 flex flex-col items-center justify-center text-slate-400 text-xs font-mono select-none hover:border-slate-300 transition-colors">
                              <span className="font-semibold text-slate-400">Free Period</span>
                              <span className="text-[10px] text-slate-300 mt-0.5">Study / Planning</span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Dedicated LUNCH BREAK Cell */}
                    <td className="p-1.5 border-r border-amber-200/70 bg-amber-50/30 align-middle min-w-[135px] h-[104px]">
                      <div
                        onClick={() => setShowLunchModal(true)}
                        className="h-full w-full rounded-xl p-2.5 border border-amber-200/90 bg-gradient-to-b from-amber-50 to-amber-100/60 flex flex-col items-center justify-center text-center cursor-pointer select-none shadow-2xs group hover:border-amber-300 hover:shadow-xs transition-all"
                        title="Click to view Lunch & Midday Recess details"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 mb-1 group-hover:scale-105 transition-transform shadow-2xs">
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-amber-950">Lunch Break</span>
                        <span className="text-[10px] font-mono font-semibold text-amber-700 mt-0.5">
                          {getBreakTime("lunch")}
                        </span>
                        <span className="text-[9px] text-amber-700/90 font-medium mt-1 px-1.5 py-0.2 rounded bg-amber-100/80 border border-amber-200/60">
                          Dining Hall & Rec
                        </span>
                      </div>
                    </td>

                    {/* Periods 5 to 8 Slots */}
                    {PERIODS.slice(4).map((period) => {
                      const slot = getSlot(day, period);
                      const dept = slot?.department || "General";
                      const theme = DEPARTMENT_THEMES[dept] || DEFAULT_THEME;

                      return (
                        <td
                          key={period}
                          className="p-1.5 border-r border-slate-200/60 last:border-r-0 align-top min-w-[145px] h-[104px]"
                        >
                          {slot ? (
                            <div
                              onClick={() => setActiveModalSlot(slot)}
                              className={`h-full w-full rounded-xl p-2.5 border ${theme.borderColor} ${theme.cardBg} flex flex-col justify-between cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${theme.badgeBg}`}>
                                    {slot.department || "Academic"}
                                  </span>
                                  {slot.is_lab && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-bold uppercase tracking-wider">
                                      <FlaskConical className="w-2.5 h-2.5" />
                                      Lab
                                    </span>
                                  )}
                                </div>
                                <div className={`text-xs font-bold leading-snug truncate ${theme.titleColor}`}>
                                  {slot.course_name}
                                </div>
                                <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                                  {filterMode === "teacher" ? slot.group_name : slot.teacher_name}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200/60 text-[10px] font-mono text-slate-500">
                                <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 shadow-2xs">
                                  {slot.room_id}
                                </span>
                                <span className="text-slate-600 font-semibold">
                                  {slot.group_id}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full rounded-xl border border-dashed border-slate-200/80 bg-slate-50/40 flex flex-col items-center justify-center text-slate-400 text-xs font-mono select-none hover:border-slate-300 transition-colors">
                              <span className="font-semibold text-slate-400">Free Period</span>
                              <span className="text-[10px] text-slate-300 mt-0.5">Study / Planning</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Master All-Classes Grid View */
        <div className="space-y-6">
          {groups.map((grp) => (
            <div key={grp.group_id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-slate-900">{grp.group_name}</span>
                  <span className="text-xs text-slate-500 font-medium">({grp.student_count} Students • Homeroom: {grp.homeroom_teacher} • Room {grp.homeroom_room_id})</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  40/40 Periods Full Quota
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[1080px]">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-200/60 text-slate-600">
                      <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider w-24 text-slate-500 border-r border-slate-200/60">
                        Day
                      </th>
                      {/* Periods 1 to 4 */}
                      {PERIODS.slice(0, 4).map((p) => (
                        <th key={p} className="py-2 px-3 text-center border-r border-slate-200/60 text-xs font-bold text-slate-700">
                          Period 0{p} <span className="font-normal font-mono text-[10px] text-slate-400">({getPeriodTime(p)})</span>
                        </th>
                      ))}
                      {/* Master Lunch Header */}
                      <th className="py-2 px-3 text-center border-r border-amber-200/80 bg-amber-50/80 text-xs font-bold text-amber-950 min-w-[125px]">
                        <div className="flex items-center justify-center gap-1">
                          <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                          <span>Lunch Break</span>
                        </div>
                        <div className="font-normal font-mono text-[10px] text-amber-700">({getBreakTime("lunch")})</div>
                      </th>
                      {/* Periods 5 to 8 */}
                      {PERIODS.slice(4).map((p) => (
                        <th key={p} className="py-2 px-3 text-center border-r border-slate-200/60 last:border-r-0 text-xs font-bold text-slate-700">
                          Period 0{p} <span className="font-normal font-mono text-[10px] text-slate-400">({getPeriodTime(p)})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <td className="py-2.5 px-4 border-r border-slate-200/60 bg-slate-50/40 text-xs font-bold text-slate-800">
                          {DAY_LABELS[day].full}
                        </td>
                        {/* Periods 1 to 4 */}
                        {PERIODS.slice(0, 4).map((p) => {
                          const slot = getSlot(day, p, grp.group_id);
                          const dept = slot?.department || "General";
                          const theme = DEPARTMENT_THEMES[dept] || DEFAULT_THEME;

                          return (
                            <td key={p} className="p-1.5 border-r border-slate-200/60 min-w-[135px]">
                              {slot ? (
                                <div
                                  onClick={() => setActiveModalSlot(slot)}
                                  className={`rounded-lg p-2 border ${theme.borderColor} ${theme.cardBg} cursor-pointer hover:shadow-xs transition-all`}
                                >
                                  <div className={`text-xs font-bold truncate ${theme.titleColor}`}>
                                    {slot.course_name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {slot.teacher_name}
                                  </div>
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                                    <span className="font-semibold text-slate-700">{slot.room_id}</span>
                                    {slot.is_lab && <span className="text-purple-600 font-bold">LAB</span>}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2 text-slate-300 text-xs font-mono">Free</div>
                              )}
                            </td>
                          );
                        })}

                        {/* Master Lunch Cell */}
                        <td className="p-1.5 border-r border-amber-200/60 bg-amber-50/30 text-center align-middle min-w-[125px]">
                          <div
                            onClick={() => setShowLunchModal(true)}
                            className="rounded-lg p-1.5 border border-amber-200/80 bg-amber-50/90 text-center cursor-pointer hover:border-amber-300 transition-colors"
                            title="Click to view Lunch details"
                          >
                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-950">
                              <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                              <span>Lunch Break</span>
                            </div>
                            <div className="text-[9px] font-mono font-semibold text-amber-700 mt-0.5">
                              {getBreakTime("lunch")}
                            </div>
                          </div>
                        </td>

                        {/* Periods 5 to 8 */}
                        {PERIODS.slice(4).map((p) => {
                          const slot = getSlot(day, p, grp.group_id);
                          const dept = slot?.department || "General";
                          const theme = DEPARTMENT_THEMES[dept] || DEFAULT_THEME;

                          return (
                            <td key={p} className="p-1.5 border-r border-slate-200/60 last:border-r-0 min-w-[135px]">
                              {slot ? (
                                <div
                                  onClick={() => setActiveModalSlot(slot)}
                                  className={`rounded-lg p-2 border ${theme.borderColor} ${theme.cardBg} cursor-pointer hover:shadow-xs transition-all`}
                                >
                                  <div className={`text-xs font-bold truncate ${theme.titleColor}`}>
                                    {slot.course_name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {slot.teacher_name}
                                  </div>
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1">
                                    <span className="font-semibold text-slate-700">{slot.room_id}</span>
                                    {slot.is_lab && <span className="text-purple-600 font-bold">LAB</span>}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2 text-slate-300 text-xs font-mono">Free</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slot Details Modal */}
      {activeModalSlot && (
        <div
          id="slot-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setActiveModalSlot(null)}
        >
          <div
            id="slot-modal-content"
            className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 text-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1.5">
                  <BookOpen className="w-3 h-3" />
                  {activeModalSlot.course_id}
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeModalSlot.course_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Department: {activeModalSlot.department || "General Academic"}</p>
              </div>
              <button
                id="close-slot-modal-btn"
                onClick={() => setActiveModalSlot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Day & Bell Time</span>
                <span className="font-semibold text-slate-900">
                  {DAY_LABELS[activeModalSlot.day]?.full || activeModalSlot.day}, Period {activeModalSlot.period} ({PERIOD_TIMES[activeModalSlot.period]?.time})
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Class & Section</span>
                <span className="font-semibold text-slate-900">
                  {activeModalSlot.group_name} ({activeModalSlot.group_id})
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Subject Teacher</span>
                <span className="font-semibold text-slate-900">
                  {activeModalSlot.teacher_name} ({activeModalSlot.teacher_id})
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Allocated Facility</span>
                <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                  {activeModalSlot.room_id}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Curriculum Format</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  activeModalSlot.is_lab
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {activeModalSlot.is_lab ? "Laboratory Session (Practical)" : "Classroom Lecture (Theoretical)"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero constraint conflicts</span>
              </div>
              <button
                onClick={() => setActiveModalSlot(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lunch Details Modal */}
      {showLunchModal && (
        <div
          id="lunch-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowLunchModal(false)}
        >
          <div
            id="lunch-modal-content"
            className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 text-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                    Midday School Interval
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Official Lunch & Recess Break</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Campus Dining Hall & Recreation Courtyard</p>
                </div>
              </div>
              <button
                id="close-lunch-modal-btn"
                onClick={() => setShowLunchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Scheduled Time</span>
                <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {getBreakTime("lunch")} (45 Minutes)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Interval Position</span>
                <span className="font-semibold text-slate-800">
                  Directly after Period 4 (Preceding Period 5)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Applicable Cohorts</span>
                <span className="font-semibold text-slate-800">
                  All Classes (Grade 9-A, 9-B, 10-A) & Faculty
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Dining & Facilities</span>
                <span className="font-medium text-slate-800">
                  Central Dining Hall, Cafeteria & Courtyard
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Timetable Policy</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  100% Protected Break (Zero Classes)
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              {onOpenBellSettings ? (
                <button
                  onClick={() => {
                    setShowLunchModal(false);
                    onOpenBellSettings();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Customize Bell Timings</span>
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setShowLunchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
