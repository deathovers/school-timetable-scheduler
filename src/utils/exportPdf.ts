import jsPDF from "jspdf";
import { ScheduleAssignment, StudentGroup, Teacher, Room, SchoolInfo } from "../types";
import { BellItem } from "../components/BellScheduleEditor";

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

const DEFAULT_PERIOD_TIMES: Record<number, string> = {
  1: "08:00 – 08:45",
  2: "08:45 – 09:30",
  3: "09:30 – 10:15",
  4: "10:15 – 11:00",
  5: "11:45 – 12:30",
  6: "12:30 – 13:15",
  7: "13:15 – 14:00",
  8: "14:00 – 14:45",
};

interface ColorDef {
  bg: [number, number, number];
  border: [number, number, number];
  text: [number, number, number];
}

// Elegant pastel color palettes for departments (soft backgrounds, dark readable text)
const DEPT_COLORS: Record<string, ColorDef> = {
  Mathematics:              { bg: [239, 246, 255], border: [191, 219, 254], text: [30, 58, 138] },  // Blue
  Sciences:                 { bg: [240, 253, 244], border: [187, 247, 208], text: [20, 83, 45] },   // Green
  Science:                  { bg: [240, 253, 244], border: [187, 247, 208], text: [20, 83, 45] },
  Humanities:               { bg: [255, 251, 235], border: [253, 230, 138], text: [120, 53, 15] },  // Amber
  "Social Science":         { bg: [255, 251, 235], border: [253, 230, 138], text: [120, 53, 15] },
  Technology:               { bg: [236, 254, 255], border: [165, 243, 252], text: [21, 94, 117] },  // Cyan
  "Information Technology": { bg: [236, 254, 255], border: [165, 243, 252], text: [21, 94, 117] },
  Athletics:                { bg: [250, 245, 255], border: [233, 213, 255], text: [88, 28, 135] },  // Purple
  "Physical Education":     { bg: [250, 245, 255], border: [233, 213, 255], text: [88, 28, 135] },
  "Fine Arts":              { bg: [255, 241, 242], border: [254, 205, 211], text: [136, 19, 55] },  // Rose
  "Art Education":          { bg: [255, 241, 242], border: [254, 205, 211], text: [136, 19, 55] },
  Hindi:                    { bg: [253, 244, 255], border: [245, 208, 254], text: [112, 26, 117] }, // Fuchsia
  English:                  { bg: [248, 250, 252], border: [203, 213, 225], text: [30, 41, 59] },   // Slate
  Resource:                 { bg: [241, 245, 249], border: [203, 213, 225], text: [51, 65, 85] },   // Cool gray
  "Library & Reading":      { bg: [241, 245, 249], border: [203, 213, 225], text: [51, 65, 85] },
};

const DEFAULT_COLOR: ColorDef = {
  bg: [248, 250, 252],
  border: [203, 213, 225],
  text: [30, 41, 59],
};

const SHORT_SUBJECT_NAMES: Record<string, string> = {
  "English Language & Literature": "English",
  "English Language": "English",
  "Information Technology": "Info Tech",
  "Computer Science": "Comp Science",
  "Physical Education": "Physical Ed (PE)",
  "Social Science": "Social Science",
  "Library & Reading": "Library",
  "Art Education": "Art Education",
  "Hindi Course A": "Hindi",
  "Hindi Course B": "Hindi",
  "Mathematics": "Mathematics",
  "Science": "Science",
};

function formatSubject(name: string): string {
  if (!name) return "";
  if (SHORT_SUBJECT_NAMES[name]) return SHORT_SUBJECT_NAMES[name];
  let clean = name
    .replace(/\s+Course\s+[A-Z]/i, "")
    .replace(/& Literature/i, "")
    .replace(/& Reading/i, "")
    .trim();
  if (clean.length > 18) {
    clean = clean.slice(0, 17) + "…";
  }
  return clean;
}

function formatTeacher(name: string): string {
  if (!name) return "";
  if (name.length <= 18) return name;
  return name.replace(/^([A-Za-z.]+)\s+([A-Za-z]+)\s+([A-Za-z]+)$/, "$1 $2. $3");
}

interface ExportPdfOptions {
  assignments: ScheduleAssignment[];
  groups: StudentGroup[];
  teachers: Teacher[];
  rooms: Room[];
  schoolInfo: SchoolInfo;
  bellSchedule?: BellItem[];
  filterMode: FilterMode;
  selectedGroupId: string;
  selectedTeacherId: string;
  selectedRoomId: string;
}

function getPeriodTime(period: number, bellSchedule?: BellItem[]): string {
  if (bellSchedule) {
    const item = bellSchedule.find((b) => b.type === "academic" && b.period === period);
    if (item) return `${item.startTime} – ${item.endTime}`;
  }
  return DEFAULT_PERIOD_TIMES[period] || "";
}

function getBreakTime(bellSchedule?: BellItem[]): string {
  if (bellSchedule) {
    const item = bellSchedule.find(
      (b) => b.type === "break" && b.name.toLowerCase().includes("lunch")
    );
    if (item) return `${item.startTime} – ${item.endTime}`;
  }
  return "11:00 – 11:45";
}

function getContextTitle(opts: ExportPdfOptions): string {
  const { filterMode, groups, teachers, rooms, selectedGroupId, selectedTeacherId, selectedRoomId } = opts;
  if (filterMode === "class") {
    const g = groups.find((g) => g.group_id === selectedGroupId);
    return g
      ? `${g.group_name}  (${g.student_count} Students • Homeroom: ${g.homeroom_teacher || "—"} • Room: ${g.homeroom_room_id || "—"})`
      : `Class: ${selectedGroupId}`;
  }
  if (filterMode === "teacher") {
    const t = teachers.find((t) => t.teacher_id === selectedTeacherId);
    return t
      ? `Teacher Schedule: ${t.teacher_name}  (${t.department || "General"} • Max ${t.max_hours_per_day} Periods/Day)`
      : `Teacher: ${selectedTeacherId}`;
  }
  if (filterMode === "room") {
    const r = rooms.find((r) => r.room_id === selectedRoomId);
    return r
      ? `Facility Allocation: ${r.room_name || r.room_id}  (${r.room_capacity} Seats • ${r.room_type || (r.is_lab ? "Lab" : "Classroom")})`
      : `Facility: ${selectedRoomId}`;
  }
  return "Master All-Class Grid";
}

function getFileName(opts: ExportPdfOptions): string {
  const { filterMode, groups, teachers, rooms, selectedGroupId, selectedTeacherId, selectedRoomId, schoolInfo } = opts;
  const year = (schoolInfo.academicYear || "2026").replace(/[^a-zA-Z0-9-]/g, "");
  if (filterMode === "class") {
    const g = groups.find((g) => g.group_id === selectedGroupId);
    const name = g ? g.group_name.replace(/\s+/g, "_") : selectedGroupId;
    return `Timetable_${name}_${year}.pdf`;
  }
  if (filterMode === "teacher") {
    const t = teachers.find((t) => t.teacher_id === selectedTeacherId);
    const name = t ? t.teacher_name.replace(/\s+/g, "_") : selectedTeacherId;
    return `Schedule_${name}_${year}.pdf`;
  }
  if (filterMode === "room") {
    const r = rooms.find((r) => r.room_id === selectedRoomId);
    const name = r ? (r.room_name || r.room_id).replace(/\s+/g, "_") : selectedRoomId;
    return `Room_${name}_${year}.pdf`;
  }
  return `Master_Timetable_${year}.pdf`;
}

/**
 * Renders a single timetable page in crisp native vector format using jsPDF.
 * Page format: A4 Landscape (297mm x 210mm).
 */
function drawTimetablePage(
  doc: jsPDF,
  opts: ExportPdfOptions,
  activeAssignments: ScheduleAssignment[],
  contextTitle: string
): void {
  const { schoolInfo, bellSchedule, filterMode } = opts;

  // Geometry: Left margin 10mm, Content width 277mm (Right margin 10mm)
  const marginX = 10;
  const totalWidth = 277;

  // Column definitions:
  // Day: 17mm, 4 Periods: 30mm each, Lunch: 20mm, 4 Periods: 30mm each -> 17 + 120 + 20 + 120 = 277mm
  const dayColW = 17;
  const periodColW = 30;
  const lunchColW = 20;

  // Calculate X positions for columns
  const colXMap: number[] = [marginX]; // Day column at index 0
  let curX = marginX + dayColW;
  // Periods 1 to 4
  for (let i = 0; i < 4; i++) {
    colXMap.push(curX);
    curX += periodColW;
  }
  // Lunch column (index 5)
  const lunchX = curX;
  colXMap.push(lunchX);
  curX += lunchColW;
  // Periods 5 to 8
  for (let i = 0; i < 4; i++) {
    colXMap.push(curX);
    curX += periodColW;
  }

  // --- 1. School Header (Y: 10mm - 27mm) ---
  const viewSub = filterMode === "class" ? "CLASS TIMETABLE" :
    filterMode === "teacher" ? "TEACHER SCHEDULE" :
    filterMode === "room" ? "FACILITY ALLOCATION" : "CLASS TIMETABLE";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202); // Indigo
  doc.text(`OFFICIAL SCHOOL TIMETABLE  •  ${viewSub}`, marginX, 13.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(schoolInfo.name || "School Timetable", marginX, 19.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate-600
  const bellStr = bellSchedule
    ? `${bellSchedule[0]?.startTime || "08:00"} – ${bellSchedule[bellSchedule.length - 1]?.endTime || "14:45"}`
    : schoolInfo.bellTimings || "08:00 – 14:45";
  const principalStr = schoolInfo.principal ? `   •   Principal: ${schoolInfo.principal}` : "";
  doc.text(`Bell Schedule: ${bellStr}${principalStr}`, marginX, 24.5);

  // Top-Right Academic Session Badge
  const badgeW = 42;
  const badgeH = 14;
  const badgeX = marginX + totalWidth - badgeW;
  const badgeY = 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("ACADEMIC SESSION", badgeX + badgeW / 2, badgeY + 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(schoolInfo.academicYear || "2026 – 2027", badgeX + badgeW / 2, badgeY + 11, { align: "center" });

  // Separator Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, 27, marginX + totalWidth, 27);

  // --- 2. Context Bar (Y: 29mm - 36mm) ---
  const barY = 29;
  const barH = 7.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, barY, totalWidth, barH, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(contextTitle, marginX + 3, barY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("8 Academic Periods  •  Mon – Fri  •  45 Min Lunch Break", marginX + totalWidth - 3, barY + 5, { align: "right" });

  // --- 3. Table Header Row (Y: 38.5mm - 50mm) ---
  const headerY = 38.5;
  const headerH = 11.5;

  // Day header
  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(colXMap[0], headerY, dayColW, headerH, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("DAY", colXMap[0] + dayColW / 2, headerY + 7, { align: "center" });

  // Academic Period Headers
  for (let p = 1; p <= 8; p++) {
    const colIdx = p <= 4 ? p : p; // mapped via colXMap (p=1..4 are indices 1..4, p=5..8 are indices 6..9)
    const xPos = p <= 4 ? colXMap[p] : colXMap[p + 1];
    const pTime = getPeriodTime(p, bellSchedule);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(xPos, headerY, periodColW, headerH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`Period 0${p}`, xPos + periodColW / 2, headerY + 4.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pTime, xPos + periodColW / 2, headerY + 8.5, { align: "center" });
  }

  // Lunch Header
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.rect(lunchX, headerY, lunchColW, headerH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15);
  doc.text("LUNCH", lunchX + lunchColW / 2, headerY + 4.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(180, 83, 9);
  doc.text(getBreakTime(bellSchedule), lunchX + lunchColW / 2, headerY + 8.5, { align: "center" });

  // --- 4. Table Day Rows (5 Days: Mon to Fri) ---
  const rowStartY = 50;
  const rowH = 29.5; // 5 rows * 29.5 = 147.5mm (Y from 50 to 197.5)

  DAYS.forEach((day, dIdx) => {
    const rowY = rowStartY + dIdx * rowH;
    const dayObj = DAY_LABELS[day] || { full: day, short: day };

    // Day Cell (Left column)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(colXMap[0], rowY, dayColW, rowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(dayObj.short, colXMap[0] + dayColW / 2, rowY + 12.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(dayObj.full, colXMap[0] + dayColW / 2, rowY + 17.5, { align: "center" });

    // Academic Period Cells
    for (let p = 1; p <= 8; p++) {
      const xPos = p <= 4 ? colXMap[p] : colXMap[p + 1];
      const slot = activeAssignments.find((a) => a.day === day && a.period === p);

      // Outer cell border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(xPos, rowY, periodColW, rowH, "FD");

      if (slot) {
        const dept = slot.department || "General";
        const theme = DEPT_COLORS[dept] || DEFAULT_COLOR;
        const subject = formatSubject(slot.course_name);

        let secondary = "";
        if (filterMode === "teacher") {
          secondary = slot.group_name || slot.group_id;
        } else {
          secondary = formatTeacher(slot.teacher_name);
        }

        // Inner period card
        const cardInset = 0.8;
        const cardX = xPos + cardInset;
        const cardY = rowY + cardInset;
        const cardW = periodColW - cardInset * 2;
        const cardH = rowH - cardInset * 2;

        doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
        doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, cardY, cardW, cardH, 1.5, 1.5, "FD");

        // Subject Name (Centered, Bold, Clear)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
        doc.text(subject, cardX + cardW / 2, cardY + 7, {
          align: "center",
          maxWidth: cardW - 2,
        });

        // Teacher / Group Name (Centered, Medium)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(secondary, cardX + cardW / 2, cardY + 13, {
          align: "center",
          maxWidth: cardW - 2,
        });

        // Horizontal card divider
        doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
        doc.setLineWidth(0.2);
        doc.line(cardX + 3, cardY + 17, cardX + cardW - 3, cardY + 17);

        // Room badge pill
        const isLab = Boolean(slot.is_lab);
        if (isLab) {
          // Room pill
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.roundedRect(cardX + 2, cardY + 19, 14, 5.5, 1, 1, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(30, 41, 59);
          doc.text(slot.room_id, cardX + 9, cardY + 22.8, { align: "center" });

          // Lab badge pill
          doc.setFillColor(237, 233, 254);
          doc.setDrawColor(196, 181, 253);
          doc.roundedRect(cardX + 17.5, cardY + 19, 8.5, 5.5, 1, 1, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6);
          doc.setTextColor(109, 40, 217);
          doc.text("LAB", cardX + 21.7, cardY + 22.8, { align: "center" });
        } else {
          // Room pill centered
          const pillW = 20;
          const pillX = cardX + (cardW - pillW) / 2;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.roundedRect(pillX, cardY + 19, pillW, 5.5, 1, 1, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(slot.room_id, cardX + cardW / 2, cardY + 22.8, { align: "center" });
        }
      } else {
        // Free Period Box
        const cardInset = 0.8;
        const cardX = xPos + cardInset;
        const cardY = rowY + cardInset;
        const cardW = periodColW - cardInset * 2;
        const cardH = rowH - cardInset * 2;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.roundedRect(cardX, cardY, cardW, cardH, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Free Period", cardX + cardW / 2, cardY + 12, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(203, 213, 225);
        doc.text("Self Study", cardX + cardW / 2, cardY + 17, { align: "center" });
      }
    }

    // Lunch Cell
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.2);
    doc.rect(lunchX, rowY, lunchColW, rowH, "FD");

    const lCardInset = 0.8;
    const lCardX = lunchX + lCardInset;
    const lCardY = rowY + lCardInset;
    const lCardW = lunchColW - lCardInset * 2;
    const lCardH = rowH - lCardInset * 2;

    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.setLineWidth(0.3);
    doc.roundedRect(lCardX, lCardY, lCardW, lCardH, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 53, 15);
    doc.text("LUNCH", lCardX + lCardW / 2, lCardY + 9, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 53, 15);
    doc.text("BREAK", lCardX + lCardW / 2, lCardY + 13.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(180, 83, 9);
    doc.text(getBreakTime(bellSchedule), lCardX + lCardW / 2, lCardY + 18.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(146, 64, 14);
    doc.text("45m Recess", lCardX + lCardW / 2, lCardY + 23, { align: "center" });
  });

  // --- 5. Footer (Y: 200mm - 205mm) ---
  const footY = 200;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, footY, marginX + totalWidth, footY);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${schoolInfo.name}  •  Automated School Timetable Scheduler`, marginX, footY + 4);
  doc.text(`Generated on ${dateStr}  •  Format: A4 Landscape (Vector Quality)`, marginX + totalWidth, footY + 4, { align: "right" });
}

export async function generateTimetablePdf(opts: ExportPdfOptions): Promise<void> {
  const { filterMode, groups, assignments } = opts;

  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  if (filterMode === "master") {
    // Multi-page PDF: One clean page per class/section
    for (let i = 0; i < groups.length; i++) {
      const grp = groups[i];
      if (i > 0) doc.addPage();

      const grpAssignments = assignments.filter((a) => a.group_id === grp.group_id);
      const title = `${grp.group_name}  (${grp.student_count} Students • Homeroom: ${grp.homeroom_teacher || "—"} • Room: ${grp.homeroom_room_id || "—"})`;

      drawTimetablePage(doc, { ...opts, filterMode: "class" }, grpAssignments, title);
    }
  } else {
    // Single-page PDF for selected view
    let activeAssignments = assignments;
    if (filterMode === "class") {
      activeAssignments = assignments.filter((a) => a.group_id === opts.selectedGroupId);
    } else if (filterMode === "teacher") {
      activeAssignments = assignments.filter((a) => a.teacher_id === opts.selectedTeacherId);
    } else if (filterMode === "room") {
      activeAssignments = assignments.filter((a) => a.room_id === opts.selectedRoomId);
    }

    const title = getContextTitle(opts);
    drawTimetablePage(doc, opts, activeAssignments, title);
  }

  const fileName = getFileName(opts);
  doc.save(fileName);
}
