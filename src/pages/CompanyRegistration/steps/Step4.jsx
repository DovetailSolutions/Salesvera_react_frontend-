import { useState, useEffect } from "react";
import { Layers, Users, UserCheck, Trash2, Plus, Check, ChevronRight } from "lucide-react";
import { useFieldArray, Controller } from "react-hook-form";
import Field from "../ui/Field";
import Toggle from "../ui/Toggle";
import DayPicker from "../ui/DayPicker";
import { SectionTitle, SubSection } from "../ui/SectionTitle";
import { inputCls, selectCls } from "../ui/inputStyles";
import { ALL_DAYS, DAY_COLORS, DEPT_PRESETS, DEFAULT_DEPARTMENT } from "../Constants";
import { companyApi } from "../../../api";

const COMPANY_WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const Step4 = ({ control, register, errors }) => {
  const deptArray = useFieldArray({ control, name: "departments" });

  const [deptWorkingDays, setDeptWorkingDays] = useState({});
  const [deptCustomDays,  setDeptCustomDays]  = useState({});
  
  // --- State for fetched API data ---
  const [apiBranches, setApiBranches] = useState([]);
  const [apiShifts, setApiShifts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- Fetch data on mount ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [branchRes, shiftRes] = await Promise.all([
          companyApi.getBranches(),
          companyApi.getShifts()
        ]);
        
        // Axios sets .data, the payload has .data (pagination object), which has .data (the array)
        const branchArray = branchRes.data?.data?.data || [];
        const shiftArray = shiftRes.data?.data?.data || [];

        setApiBranches(Array.isArray(branchArray) ? branchArray : []);
        setApiShifts(Array.isArray(shiftArray) ? shiftArray : []);
      } catch (error) {
        console.error("Failed to fetch branches or shifts:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDropdownData();
  }, []);

  const toggleDeptCustom = (idx) => {
    setDeptCustomDays((p) => ({ ...p, [idx]: !p[idx] }));
    if (!deptCustomDays[idx]) {
      setDeptWorkingDays((p) => ({ ...p, [idx]: [...COMPANY_WORKING_DAYS] }));
    }
  };

  const setDeptDays = (idx, days) =>
    setDeptWorkingDays((p) => ({ ...p, [idx]: days }));

  const addPresetDept = (preset) => {
    const idx = deptArray.fields.length;
    deptArray.append({ ...DEFAULT_DEPARTMENT, deptName: preset.deptName, deptCode: preset.deptCode });
    if (!preset.workingDaysInherit) {
      setDeptCustomDays((p) => ({ ...p, [idx]: true }));
      setDeptWorkingDays((p) => ({ ...p, [idx]: [...ALL_DAYS] }));
    }
  };

  return (
    <div>
      <SectionTitle
        icon={Layers}
        title="Department Setup"
        subtitle="Add departments and configure their branch assignment, default shift, and working schedule."
      />

      {/* Quick-add presets */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {DEPT_PRESETS.map((p) => {
            const alreadyAdded = deptArray.fields.some((f) => f.deptCode === p.deptCode);
            return (
              <div
                key={p.deptCode}
                onClick={() => !alreadyAdded && addPresetDept(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                  ${alreadyAdded
                    ? "border-slate-200 text-slate-300 cursor-not-allowed"
                    : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 cursor-pointer"}`}
              >
                {alreadyAdded ? <><Check className="w-3 h-3 inline mr-1" />Added</> : `+ ${p.deptName}`}
              </div>
            );
          })}
        </div>
      </div>

      {deptArray.fields.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 mb-4">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No departments added yet. Use the quick-add chips above or add manually.</p>
        </div>
      )}

      {deptArray.fields.map((field, idx) => {
        const isCustom = !!deptCustomDays[idx];
        const deptDays = deptWorkingDays[idx] ?? COMPANY_WORKING_DAYS;

        return (
          <div key={field.id} className="mb-5 rounded-2xl border-2 border-slate-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {field.deptName || `Department ${idx + 1}`}
                </span>
                {field.deptCode && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                    {field.deptCode}
                  </span>
                )}
              </div>
              <div
                onClick={() => deptArray.remove(idx)}
                className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Identity */}
              <div>
                <SubSection title="Department Identity" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Department Name" required error={errors.departments?.[idx]?.deptName?.message}>
                    <input
                      {...register(`departments.${idx}.deptName`, { required: "Required" })}
                      className={inputCls(errors.departments?.[idx]?.deptName)}
                      placeholder="Engineering"
                    />
                  </Field>
                  <Field label="Department Code" required error={errors.departments?.[idx]?.deptCode?.message}>
                    <input
                      {...register(`departments.${idx}.deptCode`, { required: "Required" })}
                      className={inputCls(errors.departments?.[idx]?.deptCode)}
                      placeholder="ENG"
                    />
                  </Field>
                  <Field label="Department Head">
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        {...register(`departments.${idx}.deptHead`)}
                        className={`${inputCls(false)} pl-9`}
                        placeholder="e.g. Rahul Sharma"
                      />
                    </div>
                  </Field>
                  <Field label="Max Headcount">
                    <input
                      type="number"
                      {...register(`departments.${idx}.maxHeadcount`, { 
                        valueAsNumber: true // <-- Ensures output is an integer
                      })}
                      className={inputCls(false)}
                      placeholder="50"
                    />
                  </Field>
                </div>
              </div>

              {/* Assignment */}
              <div>
                <SubSection title="Assignment" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Assigned Branch">
                    <div className="relative">
                      <select 
                        {...register(`departments.${idx}.branchId`, {
                          // Converts to integer, handles "All" or empty safely
                          setValueAs: (v) => (v && v !== "All" ? parseInt(v, 10) : null)
                        })} 
                        className={selectCls(false)} 
                        disabled={isLoadingData}
                      >
                        {isLoadingData ? (
                          <option value="">Loading branches...</option>
                        ) : (
                          <>
                            <option value="All">All Branches</option>
                            {apiBranches.map((b) => (
                              <option key={b.id} value={b.id}>{b.branchName}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Default Shift">
                    <div className="relative">
                      <select 
                        {...register(`departments.${idx}.shiftId`, {
                          // Converts to integer, handles empty cleanly
                          setValueAs: (v) => (v ? parseInt(v, 10) : null)
                        })} 
                        className={selectCls(false)} 
                        disabled={isLoadingData}
                      >
                        {isLoadingData ? (
                          <option value="">Loading shifts...</option>
                        ) : (
                          <>
                            <option value="">Inherit / No Default</option>
                            {apiShifts.map((s) => (
                              <option key={s.id} value={s.id}>{s.shiftName}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </Field>
                </div>
                {!isLoadingData && apiShifts.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-2">
                    ⚠ No shifts found in the system.
                  </p>
                )}
              </div>

              {/* Working days */}
              <div>
                <SubSection title="Working Days" />
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Schedule</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isCustom
                          ? `Custom: ${deptDays.length} day${deptDays.length !== 1 ? "s" : ""} selected`
                          : "Inheriting company-wide working days"}
                      </p>
                    </div>
                    <div
                      onClick={() => toggleDeptCustom(idx)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-all
                        ${isCustom
                          ? "border-indigo-400 bg-indigo-100 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"}`}
                    >
                      {isCustom ? "✓ Custom Days" : "Set Custom Days"}
                    </div>
                  </div>

                  {isCustom ? (
                    <DayPicker selected={deptDays} onChange={(days) => setDeptDays(idx, days)} />
                  ) : (
                    <div className="grid grid-cols-7 gap-1.5">
                      {ALL_DAYS.map((day) => {
                        const active = COMPANY_WORKING_DAYS.includes(day);
                        return (
                          <div
                            key={day}
                            className={`flex items-center justify-center py-2 rounded-lg text-[10px] font-bold border
                              ${active
                                ? `bg-gradient-to-b ${DAY_COLORS[day]} border-opacity-60`
                                : "border-slate-100 bg-white text-slate-300"}`}
                          >
                            {day.slice(0, 2)}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isCustom && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Controller
                        name={`departments.${idx}.halfSaturday`}
                        control={control}
                        defaultValue={false}
                        render={({ field: f }) => (
                          <Toggle
                            label="Half Day Saturday"
                            description="This department works half-day on Saturdays"
                            checked={!!f.value}
                            onChange={f.onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div
        onClick={() => deptArray.append({ ...DEFAULT_DEPARTMENT })}
        className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Department Manually
      </div>
    </div>
  );
};

export default Step4;