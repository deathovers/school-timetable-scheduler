import React, { useState } from "react";
import {
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  Coffee,
  UtensilsCrossed,
  BookOpen,
  Info,
  AlertCircle
} from "lucide-react";

export interface BellItem {
  id: string;
  period: number; // 0 for breaks, 1..6 for periods
  name: string;
  startTime: string;
  endTime: string;
  type: "academic" | "break";
  note: string;
}

interface BellScheduleEditorProps {
  bellSchedule: BellItem[];
  onSave: (newSchedule: BellItem[]) => void;
  onReset: () => void;
}

export const BellScheduleEditor: React.FC<BellScheduleEditorProps> = ({
  bellSchedule,
  onSave,
  onReset,
}) => {
  const [schedule, setSchedule] = useState<BellItem[]>(bellSchedule);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleTimeChange = (id: string, field: "startTime" | "endTime" | "name" | "note", val: string) => {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSave = () => {
    onSave(schedule);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset bell schedule back to school defaults?")) {
      onReset();
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                Daily Routine Management
              </span>
              <span className="text-xs text-slate-500 font-medium">• Live Timetable Synchronization</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              School Bell Schedule & Period Timings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize start and dismissal times, recess breaks, and lunch intervals. Changes apply instantly to all class timetables.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply Timings</span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Bell timings updated successfully! All timetable columns are now updated.</span>
          </div>
        )}
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Tip for School Administrators:</strong> The daily schedule features 8 academic periods (45 minutes each) starting from 8:00 AM, with 1 lunch break after the 4th period (11:00 AM – 11:45 AM). You can adjust any start and end times below to match your exact bell timings.
        </p>
      </div>

      {/* Editable Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-40">Period / Event</th>
                <th className="py-3 px-4 w-32">Type</th>
                <th className="py-3 px-4 w-44">Start Time</th>
                <th className="py-3 px-4 w-44">End Time</th>
                <th className="py-3 px-4">Description / Session Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    item.type === "break" ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* Period Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.type === "break" ? (
                        item.name.includes("Lunch") ? (
                          <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                        )
                      ) : (
                        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleTimeChange(item.id, "name", e.target.value)}
                        className="bg-transparent font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 w-full transition-all"
                      />
                    </div>
                  </td>

                  {/* Type Badge */}
                  <td className="py-3 px-4">
                    {item.type === "break" ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px] uppercase tracking-wide">
                        Recess / Meal
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] uppercase tracking-wide">
                        Academic Class
                      </span>
                    )}
                  </td>

                  {/* Start Time */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={item.startTime}
                        onChange={(e) => handleTimeChange(item.id, "startTime", e.target.value)}
                        placeholder="e.g. 08:15"
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-slate-800 w-28"
                      />
                    </div>
                  </td>

                  {/* End Time */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={item.endTime}
                        onChange={(e) => handleTimeChange(item.id, "endTime", e.target.value)}
                        placeholder="e.g. 09:00"
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-slate-800 w-28"
                      />
                    </div>
                  </td>

                  {/* Notes */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => handleTimeChange(item.id, "note", e.target.value)}
                      placeholder="Session guidelines or instructions"
                      className="bg-transparent text-slate-600 border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none px-1.5 py-0.5 w-full transition-all text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
