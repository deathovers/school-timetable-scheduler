import React, { useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Check,
  Calendar,
  School,
  FileSpreadsheet
} from "lucide-react";
import { ScheduleAssignment } from "../types";

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSolveComplete: (assignments: ScheduleAssignment[]) => void;
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  onClose,
  onSolveComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balanceWorkload, setBalanceWorkload] = useState(true);
  const [labRouting, setLabRouting] = useState(true);
  const [evenSpread, setEvenSpread] = useState(true);

  const [metrics, setMetrics] = useState<{
    status?: string;
    solveTime?: number;
    branches?: number;
    conflicts?: number;
    objectiveValue?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setSuccess(false);
    setMetrics(null);

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeLimit: 15,
          workers: 4,
          balanceWorkload,
          labRouting,
          evenSpread,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || data.detail || "Unable to generate schedule");
      }

      setSuccess(true);
      setMetrics({
        status: data.status,
        solveTime: data.solve_time_seconds,
        branches: data.branches,
        conflicts: data.conflicts,
        objectiveValue: data.objective_value,
      });

      if (data.assignments && data.assignments.length > 0) {
        onSolveComplete(data.assignments);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the timetable.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      id="auto-schedule-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        id="auto-schedule-modal-card"
        className="bg-white rounded-2xl border border-slate-200/90 max-w-lg w-full p-6 text-slate-900 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Generate School Timetable
              </h2>
              <p className="text-xs text-slate-500">
                Oakridge International High School • Academic Schedule Generator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Generates and arranges all 120 weekly class periods for Grade 9-A, Grade 9-B, and Grade 10-A (8 periods per day starting from 8:00 AM with lunch after period 4). Guarantees zero teacher clashes, assigns required laboratory facilities, and balances faculty workloads.
          </p>

          {/* User-friendly Preferences */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Scheduling Rules & Checks
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={balanceWorkload}
                onChange={(e) => setBalanceWorkload(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Balance teacher workload (maximum 3–4 periods per day)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={labRouting}
                onChange={(e) => setLabRouting(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Route Science & Computer classes to specialized labs</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={evenSpread}
                onChange={(e) => setEvenSpread(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Distribute core subjects evenly across Monday to Friday</span>
            </label>
          </div>

          {/* Feedback States */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Generation failed:</span> {error}
              </div>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Schedule Successfully Generated & Saved to PostgreSQL!</p>
                <p className="text-emerald-700">
                  OR-Tools CP-SAT completed with status <strong>{metrics?.status || "OPTIMAL"}</strong>. All class periods scheduled across 8 periods per day.
                </p>
                {metrics && (
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-800">
                    <span className="bg-emerald-100/80 px-2 py-0.5 rounded font-mono">
                      ⏱ {metrics.solveTime}s
                    </span>
                    <span className="bg-emerald-100/80 px-2 py-0.5 rounded font-mono">
                      Branches: {metrics.branches}
                    </span>
                    <span className="bg-emerald-100/80 px-2 py-0.5 rounded font-mono">
                      Conflicts: {metrics.conflicts}
                    </span>
                    {metrics.objectiveValue !== undefined && (
                      <span className="bg-emerald-100/80 px-2 py-0.5 rounded font-mono">
                        Objective: {metrics.objectiveValue.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {success ? "Close & View Timetable" : "Cancel"}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Schedule...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{success ? "Regenerate Schedule" : "Generate Schedule"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
