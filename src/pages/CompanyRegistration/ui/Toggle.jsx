const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <div
      onClick={() => onChange(!checked)}
      className={`shrink-0 relative rounded-full transition-colors cursor-pointer ${checked ? "bg-indigo-500" : "bg-slate-200"}`}
      style={{ height: "22px", width: "40px" }}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </div>
  </div>
);

export default Toggle;