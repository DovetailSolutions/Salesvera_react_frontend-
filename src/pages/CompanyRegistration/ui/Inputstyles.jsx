export const inputCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white transition-all
   focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder:text-slate-300
   ${err ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}`;

export const selectCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-700 bg-white cursor-pointer
   focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 appearance-none
   ${err ? "border-rose-400" : "border-slate-200 hover:border-slate-300"}`;