import { useState } from "react";
import { Umbrella, Sun, RefreshCw, Trash2, Plus, Check } from "lucide-react";
import { useFieldArray, Controller } from "react-hook-form";
import Field from "../ui/Field";
import Toggle from "../ui/Toggle";
import { SectionTitle } from "../ui/SectionTitle";
import { inputCls } from "../ui/InputStyles";
import { LEAVE_TYPE_PRESETS, DEFAULT_LEAVE_TYPE } from "../Constants";

const Step5 = ({ control, register }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "leaveTypes" });

  const [casualApproval, setCasualApproval] = useState(true);
  const [casualCarryFwd, setCasualCarryFwd] = useState(false);
  const [compOffEnabled, setCompOffEnabled] = useState(false);
  const [compApproval,   setCompApproval]   = useState(true);

  const handleAddPreset = (lt) => {
    const code = lt.split(" ").map((w) => w[0]).join("").toUpperCase();
    append({ ...DEFAULT_LEAVE_TYPE, leaveName: lt, leaveCode: code });
  };

  return (
    <div className="space-y-10">
      {/* ── Leave Types ── */}
      <div>
        <SectionTitle
          icon={Umbrella}
          title="Leave Management"
          subtitle="Define standard leave types and accrual policies."
        />

        {/* Preset chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {LEAVE_TYPE_PRESETS.map((lt) => {
            const alreadyAdded = fields.some((f) => f.leaveName === lt);
            return (
              <div
                key={lt}
                onClick={() => !alreadyAdded && handleAddPreset(lt)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                  ${alreadyAdded
                    ? "border-slate-200 text-slate-300 cursor-not-allowed"
                    : "border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"}`}
              >
                {alreadyAdded ? <Check className="w-3 h-3 inline mr-1" /> : "+ "}{lt}
              </div>
            );
          })}
        </div>

        {fields.map((field, idx) => (
          <div key={field.id} className="mb-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-500">{field.leaveName}</span>
              <div
                onClick={() => remove(idx)}
                className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <Field label="Leave Name">
                <input {...register(`leaveTypes.${idx}.leaveName`)} className={inputCls(false)} />
              </Field>
              <Field label="Leave Code">
                <input {...register(`leaveTypes.${idx}.leaveCode`)} className={inputCls(false)} />
              </Field>
              <Field label="Leaves Per Year">
                <input type="number" {...register(`leaveTypes.${idx}.leavesPerYear`)} className={inputCls(false)} />
              </Field>
            </div>

            <div className="space-y-0.5">
              <Controller
                name={`leaveTypes.${idx}.carryForward`}
                control={control}
                render={({ field: f }) => (
                  <Toggle label="Carry Forward Allowed" checked={!!f.value} onChange={f.onChange} />
                )}
              />
              <Controller
                name={`leaveTypes.${idx}.carryForward`}
                control={control}
                render={({ field: cf }) =>
                  cf.value ? (
                    <div className="py-2 pl-1">
                      <Field label="Max Carry Forward (days)">
                        <input
                          type="number"
                          {...register(`leaveTypes.${idx}.carryForwardLimit`)}
                          className={inputCls(false)}
                          placeholder="e.g. 10"
                        />
                      </Field>
                    </div>
                  ) : null
                }
              />
              <Controller
                name={`leaveTypes.${idx}.managerApproval`}
                control={control}
                render={({ field: f }) => (
                  <Toggle label="Manager Approval Required" checked={!!f.value} onChange={f.onChange} />
                )}
              />
            </div>
          </div>
        ))}

        <div
          onClick={() => append({ ...DEFAULT_LEAVE_TYPE })}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Custom Leave Type
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* ── Casual Holidays ── */}
      <div>
        <SectionTitle
          icon={Sun}
          title="Casual Holiday Settings"
          subtitle="Allow employees to choose their own holidays from a pool."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Field label="Total Allowed (per year)">
            <input type="number" {...register("casualHolidaysTotal")} className={inputCls(false)} placeholder="2" />
          </Field>
          <Field label="Allowed Per Month">
            <input type="number" {...register("casualHolidaysPerMonth")} className={inputCls(false)} placeholder="1" />
          </Field>
          <Field label="Minimum Notice Days">
            <input type="number" {...register("casualHolidayNotice")} className={inputCls(false)} placeholder="3" />
          </Field>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 bg-white mb-3">
          <Toggle
            label="Manager Approval Required"
            description="Employee must get manager sign-off before availing"
            checked={casualApproval}
            onChange={setCasualApproval}
          />
          <Toggle
            label="Carry Forward Allowed"
            description="Unused casual holidays can be carried to the next year"
            checked={casualCarryFwd}
            onChange={setCasualCarryFwd}
          />
        </div>
        {casualCarryFwd && (
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Max Carry Forward (days)">
                <input type="number" {...register("casualCarryForwardLimit")} className={inputCls(false)} placeholder="e.g. 2" />
              </Field>
              <Field label="Carry Forward Expiry (months)">
                <input type="number" {...register("casualCarryForwardExpiry")} className={inputCls(false)} placeholder="e.g. 3" />
              </Field>
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* ── Comp Off ── */}
      <div>
        <SectionTitle
          icon={RefreshCw}
          title="Comp Off Settings"
          subtitle="Compensatory off for employees working extra."
        />
        <div className="rounded-xl border border-slate-200 p-3 bg-white mb-4">
          <Toggle
            label="Comp Off Enabled"
            description="Allow employees to claim compensatory offs"
            checked={compOffEnabled}
            onChange={setCompOffEnabled}
          />
        </div>
        <div className={`transition-all duration-200 ${compOffEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Minimum Extra Hours Required">
              <input type="number" step="0.5" {...register("compOffMinHours")} className={inputCls(false)} placeholder="4" />
            </Field>
            <Field label="Expiry Days">
              <input type="number" {...register("compOffExpiryDays")} className={inputCls(false)} placeholder="30" />
            </Field>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <Toggle
              label="Approval Required"
              description="Manager must approve comp off requests"
              checked={compApproval}
              onChange={setCompApproval}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5;