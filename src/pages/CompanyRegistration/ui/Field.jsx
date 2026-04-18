const Field = ({ label, error, children, required }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
  </div>
);

export default Field;