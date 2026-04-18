import { useState } from "react";
import { Clock, Calendar, UserCheck, Trash2, Plus, Check } from "lucide-react";
import { useFieldArray, Controller } from "react-hook-form";
import Field from "../ui/Field";
import Toggle from "../ui/Toggle";
import { SectionTitle } from "../ui/SectionTitle";
import { inputCls } from "../ui/inputStyles";
import { ALL_DAYS, DAY_COLORS, EXAMPLE_SHIFTS, DEFAULT_SHIFT } from "../Constants";

const Step3 = ({ control, register, errors }) => {
  const shiftsArray = useFieldArray({ control, name: "shifts" });

  const [workingDays,  setWorkingDays]  = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [halfSaturday, setHalfSaturday] = useState(false);
  const [altSaturday,  setAltSaturday]  = useState(false);
  const [locationReq,  setLocationReq]  = useState(true);
  const [geoFencing,   setGeoFencing]   = useState(true);
  const [overtime,     setOvertime]     = useState(false);

  const toggleDay = (day) =>
    setWorkingDays((p) =>
      p.includes(day) ? p.filter((d) => d !== day) : [...p, day],
    );

  return (
    <div className="space-y-10">
      {/* ── Shifts ── */}
      <div>
        <SectionTitle
          icon={Clock}
          title="Shift Management"
          subtitle="Define work shifts that can be assigned to departments and employees."
        />

        {/* Quick-add chips */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {EXAMPLE_SHIFTS.map((s) => (
            <div
              key={s.shiftCode}
              onClick={() =>
                shiftsArray.append({
                  ...s,
                  graceTime: 15,
                  halfDayHours: 4,
                  fullDayHours: 8,
                  nightShift: s.shiftCode === "NGHT",
                })
              }
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 cursor-pointer transition-all"
            >
              + {s.shiftName}
            </div>
          ))}
        </div>

        {shiftsArray.fields.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 mb-3">
            <Clock className="w-7 h-7 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shifts added yet. Use the quick-add chips above or add manually.</p>
          </div>
        )}

        {shiftsArray.fields.map((field, idx) => (
          <div key={field.id} className="mb-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Shift {idx + 1}
                </span>
              </div>
              <div
                onClick={() => shiftsArray.remove(idx)}
                className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Shift Name" required error={errors.shifts?.[idx]?.shiftName?.message}>
                <input
                  {...register(`shifts.${idx}.shiftName`, { required: "Required" })}
                  className={inputCls(errors.shifts?.[idx]?.shiftName)}
                  placeholder="Morning Shift"
                />
              </Field>
              <Field label="Shift Code" required error={errors.shifts?.[idx]?.shiftCode?.message}>
                <input
                  {...register(`shifts.${idx}.shiftCode`, { required: "Required" })}
                  className={inputCls(errors.shifts?.[idx]?.shiftCode)}
                  placeholder="MORN"
                />
              </Field>
              <Field label="Start Time">
                <input type="time" {...register(`shifts.${idx}.startTime`)} className={inputCls(false)} />
              </Field>
              <Field label="End Time">
                <input type="time" {...register(`shifts.${idx}.endTime`)} className={inputCls(false)} />
              </Field>
              <Field label="Grace Time (minutes)">
                <input type="number" {...register(`shifts.${idx}.graceTime`)} className={inputCls(false)} placeholder="15" />
              </Field>
              <Field label="Half Day Hours">
                <input type="number" step="0.5" {...register(`shifts.${idx}.halfDayHours`)} className={inputCls(false)} placeholder="4" />
              </Field>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <Controller
                name={`shifts.${idx}.nightShift`}
                control={control}
                defaultValue={false}
                render={({ field: f }) => (
                  <Toggle
                    label="Night Shift"
                    description="This shift spans across midnight"
                    checked={!!f.value}
                    onChange={f.onChange}
                  />
                )}
              />
            </div>
          </div>
        ))}

        <div
          onClick={() => shiftsArray.append({ ...DEFAULT_SHIFT })}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Shift Manually
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* ── Working Days ── */}
      <div>
        <SectionTitle
          icon={Calendar}
          title="Company Working Days"
          subtitle="Default working days inherited by all departments unless overridden."
        />
        <div className="grid grid-cols-7 gap-2 mb-6">
          {ALL_DAYS.map((day) => {
            const active = workingDays.includes(day);
            return (
              <div
                key={day}
                onClick={() => toggleDay(day)}
                className={`relative flex flex-col items-center justify-center py-4 px-1 rounded-xl border-2 cursor-pointer
                  transition-all font-semibold text-xs
                  ${active
                    ? `bg-gradient-to-b ${DAY_COLORS[day]} shadow-sm scale-105`
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                  }`}
              >
                {active && <Check className="w-3 h-3 mb-1" />}
                <span className="text-[11px]">{day.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
        <div className="space-y-0.5 rounded-xl border border-slate-200 p-3 bg-white">
          <Toggle
            label="Half Day Saturday"
            description="Employees work half a day on Saturdays"
            checked={halfSaturday}
            onChange={setHalfSaturday}
          />
          <Toggle
            label="Alternate Saturdays"
            description="Employees work on alternate Saturdays only"
            checked={altSaturday}
            onChange={setAltSaturday}
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* ── Attendance Rules ── */}
      <div>
        <SectionTitle
          icon={UserCheck}
          title="Attendance Rules"
          subtitle="Configure check-in boundaries and overtime rules."
        />
        <div className="space-y-0.5 rounded-xl border border-slate-200 p-3 bg-white mb-4">
          <Toggle label="Office Location Required" description="Employees must be at office to check in" checked={locationReq} onChange={setLocationReq} />
          <Toggle label="Geo-fencing Required"     description="Enforce radius-based check-in"         checked={geoFencing}  onChange={setGeoFencing}  />
          <Toggle label="Overtime Allowed"         description="Allow logging of extra hours"           checked={overtime}    onChange={setOvertime}    />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Late Mark After (minutes)">
            <input type="number" {...register("lateMarkAfter")} className={inputCls(false)} placeholder="15" />
          </Field>
          <Field label="Auto Half Day After (minutes)">
            <input type="number" {...register("autoHalfDayAfter")} className={inputCls(false)} placeholder="120" />
          </Field>
        </div>
      </div>
    </div>
  );
};

export default Step3;