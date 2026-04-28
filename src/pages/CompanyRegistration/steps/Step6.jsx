import { useState, useEffect } from "react";
import { CalendarDays, Globe, Download, Loader2, Trash2, Plus, Check, ChevronRight, ChevronDown } from "lucide-react";
import { useFieldArray, Controller } from "react-hook-form";
import Select from "react-select";
import Field from "../ui/Field";
import { inputCls, selectCls } from "../ui/InputStyles";
import { PRESET_HOLIDAYS, HOLIDAY_TYPES } from "../constants";
import { fetchHolidays } from "../../../hooks/Holidaysapi";
import { companyApi } from "../../../api";

const STATUS_COLORS = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error:   "bg-rose-50 border-rose-200 text-rose-800",
  info:    "bg-amber-50 border-amber-200 text-amber-800",
};

// Custom styles updated for better visibility and larger click targets
const multiSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(79, 70, 229, 0.2)' : 'none',
    '&:hover': { borderColor: '#94a3b8' },
    fontSize: '0.95rem',
    minHeight: '44px', 
    backgroundColor: 'white',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#eef2ff',
    borderRadius: '6px',
    border: '1px solid #c7d2fe',
    padding: '2px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#4338ca',
    fontWeight: '600',
    fontSize: '0.85rem',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#4f46e5',
    '&:hover': { backgroundColor: '#c7d2fe', color: '#dc2626' },
  }),
};

const Step6 = ({ control, register, errors, watch }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "holidays" });

  const [isImporting,  setIsImporting]  = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importYear,   setImportYear]   = useState(new Date().getFullYear());

  const [apiBranches, setApiBranches] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // State to track which rows are expanded (accordion UX)
  const [expandedRows, setExpandedRows] = useState(new Set());

  const selectedCountry = watch("country") || "IN";

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await companyApi.getBranches();
        const branchArray = branchRes.data?.data?.data || [];
        setApiBranches(Array.isArray(branchArray) ? branchArray : []);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchBranches();
  }, []);

  const branchOptions = apiBranches.map(b => ({
    value: b.id,
    label: b.branchName
  }));

  const handleImportHolidays = async () => {
    setIsImporting(true);
    setImportStatus(null);
    try {
      const data = await fetchHolidays(selectedCountry, importYear);
      const existingDates = new Set(fields.map((f) => f.holidayDate));
      const allBranchIds = apiBranches.map((b) => b.id);

      const newHolidays = data
        .filter((h) => !existingDates.has(h.date))
        .map((h) => ({
          holidayName: h.name,
          holidayDate: h.date,
          holidayType: h.types?.includes("Public") ? "National Holiday" : "Optional Holiday",
          branchId: allBranchIds, 
          description: "",
        }));

      if (newHolidays.length === 0) {
        setImportStatus({
          type: "info",
          msg: `All ${data.length} holidays for ${selectedCountry} (${importYear}) are already in the list.`,
        });
        return;
      }
      append(newHolidays);
      setImportStatus({
        type: "success",
        msg: `✓ Imported ${newHolidays.length} holiday${newHolidays.length !== 1 ? "s" : ""} for ${selectedCountry} (${importYear}).`,
      });
    } catch (e) {
      setImportStatus({ type: "error", msg: e.message || "Failed to import holidays." });
    } finally {
      setIsImporting(false);
    }
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-5 border-b-2 border-slate-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl shrink-0">
            <CalendarDays className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Holiday Register</h2>
            <p className="text-sm text-slate-500 mt-1">Build your company's official holiday calendar.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="relative">
            <select
              value={importYear}
              onChange={(e) => setImportYear(Number(e.target.value))}
              className="pl-4 pr-10 py-2.5 text-sm font-medium rounded-lg border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 rotate-90 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 border-2 border-slate-200 text-sm font-bold text-slate-700 select-none">
            <Globe className="w-4 h-4" />
            <span>{selectedCountry}</span>
          </div>

          <div
            type="div"
            onClick={isImporting || isLoadingData ? undefined : handleImportHolidays}
            disabled={isImporting || isLoadingData}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm
              ${isImporting || isLoadingData
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer active:scale-95"}`}
          >
            {isImporting || isLoadingData
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {isLoadingData ? "Loading..." : "Importing…"}</>
              : <><Download className="w-4 h-4" /> Auto-Import</>}
          </div>
        </div>
      </div>

      {importStatus && (
        <div className={`mb-6 flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl border-2 text-sm font-bold ${STATUS_COLORS[importStatus.type]}`}>
          <span>{importStatus.msg}</span>
          <div type="div" onClick={() => setImportStatus(null)} className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition-all leading-none">✕</div>
        </div>
      )}

      {/* Preset holiday chips */}
      <div className={`flex flex-wrap gap-2.5 mb-8 ${isLoadingData ? "opacity-50 pointer-events-none" : ""}`}>
        {PRESET_HOLIDAYS.map((h) => {
          const alreadyAdded = fields.some((f) => f.holidayDate === h.holidayDate);
          return (
            <div
              key={h.holidayName}
              onClick={() => !alreadyAdded && append({ 
                ...h, 
                branchId: apiBranches.map(b => b.id), 
                description: "" 
              })}
              className={`px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all select-none
                ${alreadyAdded
                  ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 cursor-pointer hover:-translate-y-0.5"}`}
            >
              {alreadyAdded ? <><Check className="w-3.5 h-3.5 inline mr-1.5" />Added</> : `+ ${h.holidayName}`}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {fields.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl text-slate-500 mb-6">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-medium">No holidays added yet.</p>
            <p className="text-sm mt-1">Use the import div above or add them manually.</p>
          </div>
        )}

        {fields.map((field, idx) => {
          const isExpanded = expandedRows.has(field.id);

          return (
            <div key={field.id} className="flex flex-col p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              
              {/* Always Visible Row */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-12 lg:col-span-4">
                  <Field label="Holiday Name" required error={errors.holidays?.[idx]?.holidayName?.message}>
                    <input
                      {...register(`holidays.${idx}.holidayName`, { required: "Required" })}
                      className={`${inputCls(errors.holidays?.[idx]?.holidayName)} py-2.5 text-base`}
                      placeholder="e.g. Republic Day"
                    />
                  </Field>
                </div>
                
                <div className="col-span-6 lg:col-span-3">
                  <Field label="Date">
                    <input 
                      type="date" 
                      {...register(`holidays.${idx}.holidayDate`)} 
                      className={`${inputCls(false)} py-2.5 text-base`} 
                    />
                  </Field>
                </div>
                
                <div className="col-span-6 lg:col-span-3">
                  <Field label="Type">
                    <div className="relative">
                      <select {...register(`holidays.${idx}.holidayType`)} className={`${selectCls(false)} py-2.5 text-base`}>
                        {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 rotate-90 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {/* Actions (Expand & Delete) */}
                <div className="col-span-12 lg:col-span-2 flex items-end justify-end gap-2" style={{ paddingTop: "26px" }}>
                  <div
                    type="div"
                    onClick={() => toggleRow(field.id)}
                    title={isExpanded ? "Hide branch settings" : "Show branch settings"}
                    className="p-2.5 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors border border-slate-200 hover:border-indigo-200"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                  <div
                    type="div"
                    onClick={() => remove(idx)}
                    title="Remove holiday"
                    className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl cursor-pointer transition-colors border border-rose-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Expandable Area for bulky Multi-Select Branches */}
              <div 
                className={`grid transition-all duration-300 ease-in-out ${
                  isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pt-4 border-t border-slate-100">
                    <Field label="Applicable Branches">
                      <Controller
                        name={`holidays.${idx}.branchId`}
                        control={control}
                        render={({ field: { onChange, value, ref } }) => {
                          const selectedValue = branchOptions.filter(opt => 
                              Array.isArray(value) ? value.includes(opt.value) : value === opt.value
                          );

                          return (
                            <Select
                              ref={ref}
                              isMulti
                              options={branchOptions}
                              classNamePrefix="react-select"
                              styles={multiSelectStyles}
                              isLoading={isLoadingData}
                              placeholder="Select branches..."
                              value={selectedValue}
                              onChange={(selected) => {
                                onChange(selected ? selected.map(s => s.value) : []);
                              }}
                            />
                          );
                        }}
                      />
                    </Field>
                    {field.description && (
                      <div className="mt-3 px-1">
                        <span className="inline-block text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          {field.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      <div
        type="div"
        onClick={() => {
          if (!isLoadingData) {
            append({ 
              holidayName: "", 
              holidayDate: "", 
              holidayType: "National Holiday", 
              branchId: apiBranches.map(b => b.id) 
            });
          }
        }}
        disabled={isLoadingData}
        className={`w-full mt-6 py-4 rounded-2xl border-2 border-dashed font-bold transition-all flex items-center justify-center gap-2
          ${isLoadingData 
            ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed" 
            : "border-indigo-300 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400 cursor-pointer"}`}
      >
        <Plus className="w-5 h-5" /> 
        <span className="text-base">Add Holiday Manually</span>
      </div>
    </div>
  );
};

export default Step6;