import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2, School, X } from "lucide-react";
import { SchoolInfo } from "../../types";

interface SchoolProfileModalProps {
  isOpen: boolean;
  schoolInfo: SchoolInfo;
  onSave: (schoolInfo: SchoolInfo) => Promise<void>;
  onClose: () => void;
}

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  isOpen, schoolInfo, onSave, onClose,
}) => {
  const [form, setForm] = useState<SchoolInfo>(schoolInfo);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(schoolInfo);
      setError(null);
    }
  }, [isOpen, schoolInfo]);

  if (!isOpen) return null;

  const updateField = (field: keyof SchoolInfo, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.academicYear.trim()) {
      setError("School name and academic year are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({ ...form, session: `${form.academicYear} • ${form.term}` });
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not update school profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";
  const field = (label: string, id: keyof SchoolInfo, required = false, type = "text") => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor={`school-${id}`}>{label}{required && <span className="text-rose-500"> *</span>}</label>
      <input id={`school-${id}`} type={type} value={form[id] || ""} onChange={(event) => updateField(id, event.target.value)} className={inputClass} required={required} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 text-slate-900 shadow-2xl flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center"><School className="w-5 h-5 stroke-[2.2]" /></div>
            <div><h3 className="text-base font-bold">School Profile</h3><p className="text-xs text-slate-500">Update details shown across your timetable and exports.</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">{field("School Name", "name", true)}</div>
            {field("Academic Year", "academicYear", true)}
            {field("Academic Term / Session", "term")}
            {field("Principal Name", "principal")}
            {field("Academic Coordinator", "coordinator")}
            {field("School Phone", "phone", false, "tel")}
            {field("School Email", "email", false, "email")}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="school-address">School Address</label>
            <textarea id="school-address" value={form.address || ""} onChange={(event) => updateField("address", event.target.value)} rows={3} className={inputClass} />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5"><button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer">{isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{isSubmitting ? "Saving..." : "Save School Profile"}</button></div>
        </form>
      </div>
    </div>
  );
};
