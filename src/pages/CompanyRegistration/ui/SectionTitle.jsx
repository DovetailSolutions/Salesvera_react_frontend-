export const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-6 pb-4 border-b border-slate-100">
    <div className="p-2.5 bg-indigo-50 rounded-xl shrink-0">
      <Icon className="w-5 h-5 text-indigo-600" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export const SubSection = ({ title }) => (
  <div className="flex items-center gap-2 mt-5 mb-3">
    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{title}</span>
    <div className="flex-1 h-px bg-indigo-100" />
  </div>
);