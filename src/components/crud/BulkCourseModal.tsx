import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookCopy, Loader2, Plus, X } from "lucide-react";
import { Course, Teacher } from "../../types";

type CourseInput = Pick<
  Course,
  "course_id" | "course_name" | "weekly_periods" | "teacher_id" | "lab_required" | "department" | "color_code"
>;

interface BulkCourseModalProps {
  isOpen: boolean;
  coursesToCopy: Course[];
  teachers: Teacher[];
  existingCourseIds: string[];
  onSave: (courses: CourseInput[]) => Promise<void>;
  onClose: () => void;
}

const DEPARTMENTS = [
  "Mathematics", "Science", "English", "Social Science", "Hindi", "Technology",
  "Physical Education", "Fine Arts", "Resource", "General",
];

function generateCourseId(name: string, grade: string, section: string, usedIds: Set<string>) {
  const firstWord = name.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, "").toUpperCase() || "SUBJ";
  const initials = name.trim().replace(/[^a-zA-Z\s]/g, "").split(/\s+/)
    .map((word) => word.charAt(0)).join("").toUpperCase();
  const prefix = (firstWord.length >= 4 ? firstWord.slice(0, 4) : initials.slice(0, 4)) || "SUBJ";
  const gradePart = grade.trim() ? grade.trim().padStart(2, "0") : "";
  const sectionPart = section.trim() ? `_${section.trim().toUpperCase()}` : "";
  const base = `${prefix}${gradePart}${sectionPart}`;
  let id = base;
  let counter = 2;
  while (usedIds.has(id.toUpperCase())) id = `${base}_${counter++}`;
  usedIds.add(id.toUpperCase());
  return id;
}

export const BulkCourseModal: React.FC<BulkCourseModalProps> = ({
  isOpen, coursesToCopy, teachers, existingCourseIds, onSave, onClose,
}) => {
  const isCopying = coursesToCopy.length > 0;
  const [subjectLines, setSubjectLines] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [department, setDepartment] = useState("General");
  const [weeklyPeriods, setWeeklyPeriods] = useState(5);
  const [teacherId, setTeacherId] = useState("");
  const [labRequired, setLabRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSubjectLines("");
    setGrade("");
    setSection("");
    setDepartment("General");
    setWeeklyPeriods(5);
    setTeacherId(teachers[0]?.teacher_id || "");
    setLabRequired(false);
    setError(null);
  }, [isOpen, teachers]);

  const copyNames = useMemo(() => coursesToCopy.map((course) => course.course_name).join(", "), [coursesToCopy]);

  if (!isOpen) return null;

  const parseSubjects = () => {
    const subjects = subjectLines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, lineGrade, lineSection] = line.split(/[|,]/).map((part) => part.trim());
        return { name, grade: lineGrade || grade, section: lineSection || section };
      });
    return subjects;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const usedIds = new Set<string>(existingCourseIds.map((id) => id.toUpperCase()));
    const entries = isCopying
      ? coursesToCopy.map((course) => ({ course, grade, section }))
      : parseSubjects();

    if (!entries.length) {
      setError(isCopying ? "Select at least one subject to copy." : "Add at least one subject name.");
      return;
    }
    if (!isCopying && !teacherId) {
      setError("Please select an assigned faculty member.");
      return;
    }
    if (!isCopying && (weeklyPeriods < 1 || weeklyPeriods > 20)) {
      setError("Weekly periods must be between 1 and 20.");
      return;
    }

    const newCourses: CourseInput[] = isCopying
      ? entries.map(({ course, grade: entryGrade, section: entrySection }) => ({
          course_id: generateCourseId(course.course_name, entryGrade, entrySection, usedIds),
          course_name: course.course_name,
          weekly_periods: course.weekly_periods,
          teacher_id: course.teacher_id,
          lab_required: course.lab_required,
          department: course.department || "General",
          color_code: course.color_code,
        }))
      : (entries as { name: string; grade: string; section: string }[]).map((entry) => ({
          course_id: generateCourseId(entry.name, entry.grade, entry.section, usedIds),
          course_name: entry.name,
          weekly_periods: Number(weeklyPeriods),
          teacher_id: teacherId,
          lab_required: labRequired,
          department,
        }));

    if (newCourses.some((course) => !course.course_name)) {
      setError("Each line must start with a subject name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(newCourses);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save subjects.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 text-slate-900 shadow-2xl flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              {isCopying ? <BookCopy className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">{isCopying ? "Copy Selected Subjects" : "Add Multiple Subjects"}</h3>
              <p className="text-xs text-slate-500">{isCopying ? "A new unique subject ID will be made for each copy." : "Create several subjects with shared settings in one step."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" /><span>{error}</span></div>}

          {isCopying ? (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
              <span className="font-bold">Copying {coursesToCopy.length} subject{coursesToCopy.length === 1 ? "" : "s"}:</span> {copyNames}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subjects <span className="text-rose-500">*</span></label>
              <textarea value={subjectLines} onChange={(event) => setSubjectLines(event.target.value)} rows={6} autoFocus placeholder={"One subject per line\nMathematics | 9 | A\nPhysics | 9 | A"} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              <p className="text-[10px] text-slate-500 mt-1">Use <span className="font-mono">Subject | Grade | Section</span>, or enter only a name to use the defaults below.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Default Grade <span className="text-slate-400 font-normal">(for ID)</span></label><input value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="e.g. 9" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Default Section <span className="text-slate-400 font-normal">(for ID)</span></label><input value={section} onChange={(event) => setSection(event.target.value)} placeholder="e.g. A" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
          </div>

          {!isCopying && <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Department</label><select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Periods</label><input type="number" min={1} max={20} value={weeklyPeriods} onChange={(event) => setWeeklyPeriods(Number(event.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Teacher <span className="text-rose-500">*</span></label><select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"><option value="" disabled>Select Teacher</option>{teachers.map((teacher) => <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.teacher_name} ({teacher.department || "Academic"})</option>)}</select></div>
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700"><input type="checkbox" checked={labRequired} onChange={(event) => setLabRequired(event.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />Requires a specialized laboratory</label>
          </>}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5"><button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer">{isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{isSubmitting ? "Saving..." : isCopying ? `Copy ${coursesToCopy.length} Subject${coursesToCopy.length === 1 ? "" : "s"}` : "Create Subjects"}</button></div>
        </form>
      </div>
    </div>
  );
};
