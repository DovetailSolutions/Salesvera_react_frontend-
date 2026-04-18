import React, { useState, useEffect } from "react";
import {
  Building2, MapPin, Clock, Calendar, UserCheck, Umbrella,
  Sun, RefreshCw, CalendarDays, ChevronRight, ChevronLeft,
  Check, Upload, Globe, Mail, Phone, Trash2, Plus,
  Download, Loader2, Landmark, Users, Layers,
} from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { fetchHolidays } from "../hooks/Holidaysapi";


const STEPS = [
  { id: 1, label: "Company Info",        icon: Building2   },
  { id: 2, label: "Branches & Offices",  icon: MapPin      },
  { id: 3, label: "Shifts & Attendance", icon: Clock       },
  { id: 4, label: "Departments",         icon: Layers      },
  { id: 5, label: "Leaves & Time Off",   icon: Umbrella    },
  { id: 6, label: "Holiday Calendar",    icon: CalendarDays },
];

const ALL_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ─── Reusable UI atoms ────────────────────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white transition-all
   focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder:text-slate-300
   ${err ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}`;

const selectCls = (err) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-700 bg-white cursor-pointer
   focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 appearance-none
   ${err ? "border-rose-400" : "border-slate-200 hover:border-slate-300"}`;

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
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

const SubSection = ({ title }) => (
  <div className="flex items-center gap-2 mt-5 mb-3">
    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{title}</span>
    <div className="flex-1 h-px bg-indigo-100" />
  </div>
);

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
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </div>
  </div>
);

const DayPicker = ({ selected, onChange }) => {
  const dayColors = {
    Monday:    "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    Tuesday:   "from-violet-50 to-violet-100 border-violet-200 text-violet-700",
    Wednesday: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    Thursday:  "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
    Friday:    "from-rose-50 to-rose-100 border-rose-200 text-rose-700",
    Saturday:  "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
    Sunday:    "from-slate-50 to-slate-100 border-slate-200 text-slate-600",
  };
  const toggle = (day) =>
    onChange(selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day]);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {ALL_DAYS.map((day) => {
        const active = selected.includes(day);
        return (
          <div key={day} onClick={() => toggle(day)} title={day}
            className={`flex flex-col items-center justify-center py-2.5 px-0.5 rounded-lg border-2 cursor-pointer transition-all text-[10px] font-bold
              ${active ? `bg-gradient-to-b ${dayColors[day]} shadow-sm scale-105` : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"}`}>
            {active && <Check className="w-2.5 h-2.5 mb-0.5" />}
            {day.slice(0, 2)}
          </div>
        );
      })}
    </div>
  );
};

// ─── Step 1 – Company Info & Bank Details ─────────────────────────────────────
const Step1 = ({ register, errors }) => {
  const [logoPreview, setLogoPreview] = useState(null);
  const [countries,   setCountries]   = useState([]);

  const INDUSTRIES    = ["Technology","Manufacturing","Retail","Healthcare","Finance","Education","Hospitality","Construction","Logistics","Other"];
  const SIZES         = ["1–10","11–50","51–200","201–500","501–1000","1000+"];
  const TIMEZONES     = ["Asia/Kolkata","UTC","America/New_York","America/Los_Angeles","Europe/London","Asia/Tokyo","Australia/Sydney"];
  const CURRENCIES    = ["INR","USD","EUR","GBP","AED","SGD"];
  const ACCOUNT_TYPES = ["Current","Savings","Overdraft","Cash Credit"];

  useEffect(() => {
    fetch("https://date.nager.at/api/v3/AvailableCountries")
      .then((r) => r.json()).then(setCountries)
      .catch((err) => console.error("Failed to load countries", err));
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle icon={Building2} title="Company Basic Information" subtitle="Core details used to identify your organisation across the platform." />
        <Field label="Company Logo">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group mb-4">
            {logoPreview
              ? <img src={logoPreview} alt="logo" className="h-24 object-contain rounded-xl" />
              : <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <Upload className="w-7 h-7" />
                  <span className="text-xs font-medium">Click to upload logo (PNG, JPG, SVG)</span>
                </div>}
            <input type="file" className="hidden" accept="image/*"
              onChange={(e) => { const f = e.target.files[0]; if (f) setLogoPreview(URL.createObjectURL(f)); }} />
          </label>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name" required error={errors.companyName?.message}>
            <input {...register("companyName", { required: "Required" })} className={inputCls(errors.companyName)} placeholder="Acme Corp" />
          </Field>
          <Field label="Legal Company Name" required error={errors.legalName?.message}>
            <input {...register("legalName", { required: "Required" })} className={inputCls(errors.legalName)} placeholder="Acme Corporation Pvt. Ltd." />
          </Field>
          <Field label="Company Registration Number" required error={errors.registrationNo?.message}>
            <input {...register("registrationNo", { required: "Required" })} className={inputCls(errors.registrationNo)} placeholder="CIN / Reg. No." />
          </Field>
          <Field label="GST Number" error={errors.gst?.message}>
            <input {...register("gst")} className={inputCls(false)} placeholder="22AAAAA0000A1Z5" />
          </Field>
          <Field label="PAN Number" required error={errors.pan?.message}>
            <input {...register("pan", { required: "Required" })} className={inputCls(errors.pan)} placeholder="ABCDE1234F" />
          </Field>
          <Field label="Industry Type" required error={errors.industry?.message}>
            <div className="relative">
              <select {...register("industry", { required: "Required" })} className={selectCls(errors.industry)}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </Field>
          <Field label="Company Size" required error={errors.companySize?.message}>
            <div className="relative">
              <select {...register("companySize", { required: "Required" })} className={selectCls(errors.companySize)}>
                <option value="">Select size</option>
                {SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </Field>
          <Field label="Website" error={errors.website?.message}>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register("website")} className={`${inputCls(false)} pl-9`} placeholder="https://acme.com" />
            </div>
          </Field>
          <Field label="Company Email" required error={errors.companyEmail?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register("companyEmail", { required: "Required" })} className={`${inputCls(errors.companyEmail)} pl-9`} placeholder="contact@acme.com" />
            </div>
          </Field>
          <Field label="Company Phone" required error={errors.companyPhone?.message}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register("companyPhone", { required: "Required" })} className={`${inputCls(errors.companyPhone)} pl-9`} placeholder="+91 98765 43210" />
            </div>
          </Field>
        </div>
        <SubSection title="HQ Settings" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Time Zone" required error={errors.timezone?.message}>
            <div className="relative">
              <select {...register("timezone", { required: "Required" })} className={selectCls(errors.timezone)}>
                <option value="">Select timezone</option>
                {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </Field>
          <Field label="Currency" required error={errors.currency?.message}>
            <div className="relative">
              <select {...register("currency", { required: "Required" })} className={selectCls(errors.currency)}>
                <option value="">Select currency</option>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </Field>
        </div>
      </div>

      <hr className="border-slate-200" />

      <div>
        <SectionTitle icon={Landmark} title="Bank Account Details" subtitle="Primary company bank account used for payroll and transactions." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Account Holder Name" required error={errors.bankAccountHolder?.message}>
            <input {...register("bankAccountHolder", { required: "Required" })} className={inputCls(errors.bankAccountHolder)} placeholder="Acme Corporation Pvt. Ltd." />
          </Field>
          <Field label="Bank Name" required error={errors.bankName?.message}>
            <input {...register("bankName", { required: "Required" })} className={inputCls(errors.bankName)} placeholder="State Bank of India" />
          </Field>
          <Field label="Account Number" required error={errors.bankAccountNumber?.message}>
            <input {...register("bankAccountNumber", { required: "Required", pattern: { value: /^\d{9,18}$/, message: "Enter a valid account number" } })}
              className={inputCls(errors.bankAccountNumber)} placeholder="012345678901" maxLength={18} />
          </Field>
          <Field label="Confirm Account Number" required error={errors.bankAccountNumberConfirm?.message}>
            <input {...register("bankAccountNumberConfirm", { required: "Required" })} className={inputCls(errors.bankAccountNumberConfirm)} placeholder="Re-enter account number" maxLength={18} />
          </Field>
          <Field label="IFSC Code" required error={errors.bankIfsc?.message}>
            <input {...register("bankIfsc", { required: "Required", pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Enter valid IFSC" } })}
              className={inputCls(errors.bankIfsc)} placeholder="SBIN0001234" maxLength={11} style={{ textTransform: "uppercase" }} />
          </Field>
          <Field label="Bank Branch Name">
            <input {...register("bankBranchName")} className={inputCls(false)} placeholder="Andheri West Branch" />
          </Field>
          <Field label="Account Type" required error={errors.bankAccountType?.message}>
            <div className="relative">
              <select {...register("bankAccountType", { required: "Required" })} className={selectCls(errors.bankAccountType)}>
                <option value="">Select type</option>
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </Field>
          <Field label="MICR Code">
            <input {...register("bankMicr")} className={inputCls(false)} placeholder="400002003" maxLength={9} />
          </Field>
        </div>
        <SubSection title="Additional Payment Info" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="UPI ID">
            <input {...register("upiId")} className={inputCls(false)} placeholder="acme@sbi" />
          </Field>
          <Field label="Payroll Cycle" required error={errors.payrollCycle?.message}>
            <div className="relative">
              <select {...register("payrollCycle", { required: "Required" })} className={selectCls(errors.payrollCycle)}>
                <option value="">Select cycle</option>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
};

// ─── Step 2 – Branch / Office Setup ──────────────────────────────────────────
const Step2 = ({ register, errors, control }) => {
  const [countries,     setCountries]     = useState([]);
  const [headOfficeIdx, setHeadOfficeIdx] = useState(0);
  const { fields, append, remove } = useFieldArray({ control, name: "branches" });

  useEffect(() => {
    fetch("https://date.nager.at/api/v3/AvailableCountries")
      .then((r) => r.json()).then(setCountries)
      .catch((err) => console.error("Failed to load countries", err));
  }, []);

  return (
    <div>
      <SectionTitle icon={MapPin} title="Branch / Office Setup" subtitle="Add all your office locations with their complete addresses. Mark one as the Head Office." />

      {fields.map((field, idx) => (
        <div key={field.id} className={`mb-6 rounded-2xl border-2 transition-all ${headOfficeIdx === idx ? "border-indigo-300 bg-indigo-50/20" : "border-slate-200 bg-white"}`}>
          <div className={`flex items-center justify-between px-5 py-3.5 rounded-t-2xl border-b ${headOfficeIdx === idx ? "border-indigo-200 bg-indigo-50/40" : "border-slate-100 bg-slate-50/60"}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${headOfficeIdx === idx ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{idx + 1}</div>
              <div>
                <span className="text-sm font-bold text-slate-700">{field.branchName || `Branch ${idx + 1}`}</span>
                {headOfficeIdx === idx && <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wide">Head Office</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div onClick={() => setHeadOfficeIdx(idx)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${headOfficeIdx === idx ? "border-indigo-400 bg-indigo-100 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"}`}>
                {headOfficeIdx === idx ? "✓ Head Office" : "Set as Head Office"}
              </div>
              {fields.length > 1 && (
                <div onClick={() => { remove(idx); if (headOfficeIdx === idx) setHeadOfficeIdx(0); }} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                  <Trash2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <SubSection title="Branch Identity" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Branch Name" required error={errors.branches?.[idx]?.branchName?.message}>
                  <input {...register(`branches.${idx}.branchName`, { required: "Required" })} className={inputCls(errors.branches?.[idx]?.branchName)} placeholder="Mumbai HQ" />
                </Field>
                <Field label="Branch Code" required error={errors.branches?.[idx]?.branchCode?.message}>
                  <input {...register(`branches.${idx}.branchCode`, { required: "Required" })} className={inputCls(errors.branches?.[idx]?.branchCode)} placeholder="MUM-01" />
                </Field>
                <Field label="Branch Email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register(`branches.${idx}.branchEmail`)} className={`${inputCls(false)} pl-9`} placeholder="mumbai@acme.com" />
                  </div>
                </Field>
                <Field label="Branch Phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input {...register(`branches.${idx}.branchPhone`)} className={`${inputCls(false)} pl-9`} placeholder="+91 22 1234 5678" />
                  </div>
                </Field>
              </div>
            </div>
            <div>
              <SubSection title="Full Address" />
              <div className="grid grid-cols-1 gap-3">
                <Field label="Address Line 1" required error={errors.branches?.[idx]?.addressLine1?.message}>
                  <input {...register(`branches.${idx}.addressLine1`, { required: "Required" })} className={inputCls(errors.branches?.[idx]?.addressLine1)} placeholder="Building name, Street / Road" />
                </Field>
                <Field label="Address Line 2">
                  <input {...register(`branches.${idx}.addressLine2`)} className={inputCls(false)} placeholder="Area, Locality (optional)" />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Field label="City" required error={errors.branches?.[idx]?.branchCity?.message}>
                  <input {...register(`branches.${idx}.branchCity`, { required: "Required" })} className={inputCls(errors.branches?.[idx]?.branchCity)} placeholder="Mumbai" />
                </Field>
                <Field label="State / Province" required error={errors.branches?.[idx]?.branchState?.message}>
                  <input {...register(`branches.${idx}.branchState`, { required: "Required" })} className={inputCls(errors.branches?.[idx]?.branchState)} placeholder="Maharashtra" />
                </Field>
                <Field label="Postal / ZIP Code" required error={errors.branches?.[idx]?.postalCode?.message}>
                  <input {...register(`branches.${idx}.postalCode`, { required: "Required" })} className={inputCls(errors.branches?.[idx]?.postalCode)} placeholder="400001" />
                </Field>
                <Field label="Country" required error={errors.branches?.[idx]?.branchCountry?.message}>
                  <div className="relative">
                    <select {...register(`branches.${idx}.branchCountry`, { required: "Required" })} className={selectCls(errors.branches?.[idx]?.branchCountry)}>
                      <option value="">Select country</option>
                      {countries.map((c) => <option key={c.countryCode} value={c.countryCode}>{c.name}</option>)}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                </Field>
              </div>
            </div>
            <div>
              <SubSection title="Geo-fencing" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Latitude">
                  <input type="number" step="any" {...register(`branches.${idx}.latitude`)} className={inputCls(false)} placeholder="19.0760" />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="any" {...register(`branches.${idx}.longitude`)} className={inputCls(false)} placeholder="72.8777" />
                </Field>
                <Field label="Radius (metres)">
                  <input type="number" {...register(`branches.${idx}.geoRadius`)} className={inputCls(false)} placeholder="100" />
                </Field>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Employees must be within this radius to clock in at this branch.
              </p>
            </div>
          </div>
        </div>
      ))}

      <div onClick={() => append({ branchName: "", branchCode: "", addressLine1: "", addressLine2: "", branchCity: "", branchState: "", postalCode: "", branchCountry: "IN", latitude: "", longitude: "", geoRadius: "" })}
        className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Another Branch
      </div>
    </div>
  );
};

// ─── Step 3 – Shifts & Attendance ─────────────────────────────────────────────
const Step3 = ({ control, register, errors }) => {
  const shiftsArray = useFieldArray({ control, name: "shifts" });

  const [workingDays,  setWorkingDays]  = useState(["Monday","Tuesday","Wednesday","Thursday","Friday"]);
  const [halfSaturday, setHalfSaturday] = useState(false);
  const [altSaturday,  setAltSaturday]  = useState(false);
  const [locationReq,  setLocationReq]  = useState(true);
  const [geoFencing,   setGeoFencing]   = useState(true);
  const [overtime,     setOvertime]     = useState(false);

  const dayColors = {
    Monday:    "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    Tuesday:   "from-violet-50 to-violet-100 border-violet-200 text-violet-700",
    Wednesday: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    Thursday:  "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
    Friday:    "from-rose-50 to-rose-100 border-rose-200 text-rose-700",
    Saturday:  "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
    Sunday:    "from-slate-50 to-slate-100 border-slate-200 text-slate-600",
  };

  const toggleDay = (day) =>
    setWorkingDays((p) => p.includes(day) ? p.filter((d) => d !== day) : [...p, day]);

  const EXAMPLE_SHIFTS = [
    { shiftName: "Morning Shift", shiftCode: "MORN", startTime: "09:00", endTime: "18:00" },
    { shiftName: "Night Shift",   shiftCode: "NGHT", startTime: "22:00", endTime: "06:00" },
  ];

  return (
    <div className="space-y-10">
      {/* ── Shifts ── */}
      <div>
        <SectionTitle icon={Clock} title="Shift Management" subtitle="Define work shifts that can be assigned to departments and employees." />
        <div className="flex gap-2 mb-5 flex-wrap">
          {EXAMPLE_SHIFTS.map((s) => (
            <div key={s.shiftCode}
              onClick={() => shiftsArray.append({ ...s, graceTime: 15, halfDayHours: 4, fullDayHours: 8, nightShift: s.shiftCode === "NGHT" })}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 cursor-pointer transition-all">
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Shift {idx + 1}</span>
              </div>
              <div onClick={() => shiftsArray.remove(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Shift Name" required error={errors.shifts?.[idx]?.shiftName?.message}>
                <input {...register(`shifts.${idx}.shiftName`, { required: "Required" })} className={inputCls(errors.shifts?.[idx]?.shiftName)} placeholder="Morning Shift" />
              </Field>
              <Field label="Shift Code" required error={errors.shifts?.[idx]?.shiftCode?.message}>
                <input {...register(`shifts.${idx}.shiftCode`, { required: "Required" })} className={inputCls(errors.shifts?.[idx]?.shiftCode)} placeholder="MORN" />
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
              <Controller name={`shifts.${idx}.nightShift`} control={control} defaultValue={false}
                render={({ field: f }) => (
                  <Toggle label="Night Shift" description="This shift spans across midnight" checked={!!f.value} onChange={f.onChange} />
                )}
              />
            </div>
          </div>
        ))}

        <div onClick={() => shiftsArray.append({ shiftName: "", shiftCode: "", startTime: "", endTime: "", graceTime: 15, halfDayHours: 4, fullDayHours: 8, nightShift: false })}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Shift Manually
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* ── Company-Wide Working Days ── */}
      <div>
        <SectionTitle icon={Calendar} title="Company Working Days" subtitle="Default working days inherited by all departments unless overridden." />
        <div className="grid grid-cols-7 gap-2 mb-6">
          {ALL_DAYS.map((day) => {
            const active = workingDays.includes(day);
            return (
              <div key={day} onClick={() => toggleDay(day)}
                className={`relative flex flex-col items-center justify-center py-4 px-1 rounded-xl border-2 cursor-pointer transition-all font-semibold text-xs
                  ${active ? `bg-gradient-to-b ${dayColors[day]} shadow-sm scale-105` : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"}`}>
                {active && <Check className="w-3 h-3 mb-1" />}
                <span className="text-[11px]">{day.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
        <div className="space-y-0.5 rounded-xl border border-slate-200 p-3 bg-white">
          <Toggle label="Half Day Saturday" description="Employees work half a day on Saturdays" checked={halfSaturday} onChange={setHalfSaturday} />
          <Toggle label="Alternate Saturdays" description="Employees work on alternate Saturdays only" checked={altSaturday} onChange={setAltSaturday} />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* ── Attendance Rules ── */}
      <div>
        <SectionTitle icon={UserCheck} title="Attendance Rules" subtitle="Configure check-in boundaries and overtime rules." />
        <div className="space-y-0.5 rounded-xl border border-slate-200 p-3 bg-white mb-4">
          <Toggle label="Office Location Required" description="Employees must be at office to check in" checked={locationReq} onChange={setLocationReq} />
          <Toggle label="Geo-fencing Required" description="Enforce radius-based check-in" checked={geoFencing} onChange={setGeoFencing} />
          <Toggle label="Overtime Allowed" description="Allow logging of extra hours" checked={overtime} onChange={setOvertime} />
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

// ─── Step 4 – Departments ─────────────────────────────────────────────────────
const Step4 = ({ control, register, errors, watch }) => {
  const deptArray = useFieldArray({ control, name: "departments" });

  const [companyWorkingDays] = useState(["Monday","Tuesday","Wednesday","Thursday","Friday"]);
  const [deptWorkingDays, setDeptWorkingDays] = useState({});
  const [deptCustomDays,  setDeptCustomDays]  = useState({});

  const dayColors = {
    Monday:    "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    Tuesday:   "from-violet-50 to-violet-100 border-violet-200 text-violet-700",
    Wednesday: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    Thursday:  "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
    Friday:    "from-rose-50 to-rose-100 border-rose-200 text-rose-700",
    Saturday:  "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
    Sunday:    "from-slate-50 to-slate-100 border-slate-200 text-slate-600",
  };

  const toggleDeptCustom = (idx) => {
    setDeptCustomDays((p) => ({ ...p, [idx]: !p[idx] }));
    if (!deptCustomDays[idx]) setDeptWorkingDays((p) => ({ ...p, [idx]: [...companyWorkingDays] }));
  };

  const setDeptDays = (idx, days) => setDeptWorkingDays((p) => ({ ...p, [idx]: days }));

  const branchFields  = watch("branches") || [];
  const branchOptions = branchFields.filter((b) => b.branchName).map((b) => b.branchName);
  const shiftFields   = watch("shifts")   || [];
  const shiftOptions  = shiftFields.filter((s) => s.shiftName).map((s) => s.shiftName);

  const DEPT_PRESETS = [
    { deptName: "Engineering",     deptCode: "ENG",  workingDaysInherit: true  },
    { deptName: "Human Resources", deptCode: "HR",   workingDaysInherit: true  },
    { deptName: "Finance",         deptCode: "FIN",  workingDaysInherit: true  },
    { deptName: "Sales",           deptCode: "SALE", workingDaysInherit: true  },
    { deptName: "Operations",      deptCode: "OPS",  workingDaysInherit: true  },
    { deptName: "Support",         deptCode: "SUP",  workingDaysInherit: false },
  ];

  const addPresetDept = (preset) => {
    const idx = deptArray.fields.length;
    deptArray.append({ deptName: preset.deptName, deptCode: preset.deptCode, deptHead: "", branch: "All", defaultShift: "", maxHeadcount: "" });
    if (!preset.workingDaysInherit) {
      setDeptCustomDays((p) => ({ ...p, [idx]: true }));
      setDeptWorkingDays((p) => ({ ...p, [idx]: [...ALL_DAYS] }));
    }
  };

  return (
    <div>
      <SectionTitle icon={Layers} title="Department Setup" subtitle="Add departments and configure their branch assignment, default shift, and working schedule." />

      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {DEPT_PRESETS.map((p) => {
            const alreadyAdded = deptArray.fields.some((f) => f.deptCode === p.deptCode);
            return (
              <div key={p.deptCode} onClick={() => !alreadyAdded && addPresetDept(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                  ${alreadyAdded ? "border-slate-200 text-slate-300 cursor-not-allowed" : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 cursor-pointer"}`}>
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
        const deptDays = deptWorkingDays[idx] ?? companyWorkingDays;

        return (
          <div key={field.id} className="mb-5 rounded-2xl border-2 border-slate-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">{field.deptName || `Department ${idx + 1}`}</span>
                {field.deptCode && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">{field.deptCode}</span>
                )}
              </div>
              <div onClick={() => deptArray.remove(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Identity */}
              <div>
                <SubSection title="Department Identity" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Department Name" required error={errors.departments?.[idx]?.deptName?.message}>
                    <input {...register(`departments.${idx}.deptName`, { required: "Required" })} className={inputCls(errors.departments?.[idx]?.deptName)} placeholder="Engineering" />
                  </Field>
                  <Field label="Department Code" required error={errors.departments?.[idx]?.deptCode?.message}>
                    <input {...register(`departments.${idx}.deptCode`, { required: "Required" })} className={inputCls(errors.departments?.[idx]?.deptCode)} placeholder="ENG" />
                  </Field>
                  <Field label="Department Head">
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input {...register(`departments.${idx}.deptHead`)} className={`${inputCls(false)} pl-9`} placeholder="e.g. Rahul Sharma" />
                    </div>
                  </Field>
                  <Field label="Max Headcount">
                    <input type="number" {...register(`departments.${idx}.maxHeadcount`)} className={inputCls(false)} placeholder="50" />
                  </Field>
                </div>
              </div>

              {/* Assignment */}
              <div>
                <SubSection title="Assignment" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Assigned Branch">
                    <div className="relative">
                      <select {...register(`departments.${idx}.branch`)} className={selectCls(false)}>
                        <option value="All">All Branches</option>
                        {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Default Shift">
                    <div className="relative">
                      <select {...register(`departments.${idx}.defaultShift`)} className={selectCls(false)}>
                        <option value="">Inherit / No Default</option>
                        {shiftOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </Field>
                </div>
                {shiftOptions.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-2">⚠ No shifts defined — go back to Step 3 to add shifts first.</p>
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
                        {isCustom ? `Custom: ${deptDays.length} day${deptDays.length !== 1 ? "s" : ""} selected` : "Inheriting company-wide working days"}
                      </p>
                    </div>
                    <div onClick={() => toggleDeptCustom(idx)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-all
                        ${isCustom ? "border-indigo-400 bg-indigo-100 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"}`}>
                      {isCustom ? "✓ Custom Days" : "Set Custom Days"}
                    </div>
                  </div>
                  {isCustom ? (
                    <DayPicker selected={deptDays} onChange={(days) => setDeptDays(idx, days)} />
                  ) : (
                    <div className="grid grid-cols-7 gap-1.5">
                      {ALL_DAYS.map((day) => {
                        const active = companyWorkingDays.includes(day);
                        return (
                          <div key={day} className={`flex items-center justify-center py-2 rounded-lg text-[10px] font-bold border
                            ${active ? `bg-gradient-to-b ${dayColors[day]} border-opacity-60` : "border-slate-100 bg-white text-slate-300"}`}>
                            {day.slice(0, 2)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isCustom && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Controller name={`departments.${idx}.halfSaturday`} control={control} defaultValue={false}
                        render={({ field: f }) => (
                          <Toggle label="Half Day Saturday" description="This department works half-day on Saturdays" checked={!!f.value} onChange={f.onChange} />
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

      <div onClick={() => deptArray.append({ deptName: "", deptCode: "", deptHead: "", branch: "All", defaultShift: "", maxHeadcount: "" })}
        className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Department Manually
      </div>
    </div>
  );
};

// ─── Step 5 – Leaves & Time Off ───────────────────────────────────────────────
const Step5 = ({ control, register }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "leaveTypes" });
  const [casualApproval, setCasualApproval] = useState(true);
  const [casualCarryFwd, setCasualCarryFwd] = useState(false);
  const [compOffEnabled, setCompOffEnabled] = useState(false);
  const [compApproval,   setCompApproval]   = useState(true);

  const LEAVE_TYPES = ["Casual Leave","Sick Leave","Paid Leave","Unpaid Leave","Maternity Leave"];

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle icon={Umbrella} title="Leave Management" subtitle="Define standard leave types and accrual policies." />
        <div className="flex flex-wrap gap-2 mb-5">
          {LEAVE_TYPES.map((lt) => {
            const code = lt.split(" ").map((w) => w[0]).join("").toUpperCase();
            const alreadyAdded = fields.some((f) => f.leaveName === lt);
            return (
              <div key={lt}
                onClick={() => !alreadyAdded && append({ leaveName: lt, leaveCode: code, leavesPerYear: 12, carryForward: false, carryForwardLimit: 0, managerApproval: true })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${alreadyAdded ? "border-slate-200 text-slate-300 cursor-not-allowed" : "border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"}`}>
                {alreadyAdded ? <Check className="w-3 h-3 inline mr-1" /> : "+ "}{lt}
              </div>
            );
          })}
        </div>
        {fields.map((field, idx) => (
          <div key={field.id} className="mb-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-500">{field.leaveName}</span>
              <div onClick={() => remove(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <Field label="Leave Name"><input {...register(`leaveTypes.${idx}.leaveName`)} className={inputCls(false)} /></Field>
              <Field label="Leave Code"><input {...register(`leaveTypes.${idx}.leaveCode`)} className={inputCls(false)} /></Field>
              <Field label="Leaves Per Year"><input type="number" {...register(`leaveTypes.${idx}.leavesPerYear`)} className={inputCls(false)} /></Field>
            </div>
            <div className="space-y-0.5">
              <Controller name={`leaveTypes.${idx}.carryForward`} control={control} render={({ field: f }) => (
                <Toggle label="Carry Forward Allowed" checked={!!f.value} onChange={f.onChange} />
              )} />
              <Controller name={`leaveTypes.${idx}.carryForward`} control={control} render={({ field: cf }) =>
                cf.value ? (
                  <div className="py-2 pl-1">
                    <Field label="Max Carry Forward (days)">
                      <input type="number" {...register(`leaveTypes.${idx}.carryForwardLimit`)} className={inputCls(false)} placeholder="e.g. 10" />
                    </Field>
                  </div>
                ) : null
              } />
              <Controller name={`leaveTypes.${idx}.managerApproval`} control={control} render={({ field: f }) => (
                <Toggle label="Manager Approval Required" checked={!!f.value} onChange={f.onChange} />
              )} />
            </div>
          </div>
        ))}
        <div onClick={() => append({ leaveName: "", leaveCode: "", leavesPerYear: 12, carryForward: false, carryForwardLimit: 0, managerApproval: true })}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Custom Leave Type
        </div>
      </div>

      <hr className="border-slate-200" />

      <div>
        <SectionTitle icon={Sun} title="Casual Holiday Settings" subtitle="Allow employees to choose their own holidays from a pool." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Field label="Total Allowed (per year)"><input type="number" {...register("casualHolidaysTotal")} className={inputCls(false)} placeholder="2" /></Field>
          <Field label="Allowed Per Month"><input type="number" {...register("casualHolidaysPerMonth")} className={inputCls(false)} placeholder="1" /></Field>
          <Field label="Minimum Notice Days"><input type="number" {...register("casualHolidayNotice")} className={inputCls(false)} placeholder="3" /></Field>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 bg-white mb-3">
          <Toggle label="Manager Approval Required" description="Employee must get manager sign-off before availing" checked={casualApproval} onChange={setCasualApproval} />
          <Toggle label="Carry Forward Allowed" description="Unused casual holidays can be carried to the next year" checked={casualCarryFwd} onChange={setCasualCarryFwd} />
        </div>
        {casualCarryFwd && (
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Max Carry Forward (days)"><input type="number" {...register("casualCarryForwardLimit")} className={inputCls(false)} placeholder="e.g. 2" /></Field>
              <Field label="Carry Forward Expiry (months)"><input type="number" {...register("casualCarryForwardExpiry")} className={inputCls(false)} placeholder="e.g. 3" /></Field>
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      <div>
        <SectionTitle icon={RefreshCw} title="Comp Off Settings" subtitle="Compensatory off for employees working extra." />
        <div className="rounded-xl border border-slate-200 p-3 bg-white mb-4">
          <Toggle label="Comp Off Enabled" description="Allow employees to claim compensatory offs" checked={compOffEnabled} onChange={setCompOffEnabled} />
        </div>
        <div className={`transition-all duration-200 ${compOffEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Minimum Extra Hours Required"><input type="number" step="0.5" {...register("compOffMinHours")} className={inputCls(false)} placeholder="4" /></Field>
            <Field label="Expiry Days"><input type="number" {...register("compOffExpiryDays")} className={inputCls(false)} placeholder="30" /></Field>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <Toggle label="Approval Required" description="Manager must approve comp off requests" checked={compApproval} onChange={setCompApproval} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Step 6 – Holiday Register ────────────────────────────────────────────────
const Step6 = ({ control, register, errors, watch }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "holidays" });
  const [isImporting,  setIsImporting]  = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importYear,   setImportYear]   = useState(new Date().getFullYear());

  const selectedCountry = watch("country") || "IN";
  const HOLIDAY_TYPES = ["National Holiday","Festival Holiday","Optional Holiday","Company Holiday"];

  const PRESET_HOLIDAYS = [
    { holidayName: "Republic Day",       holidayDate: "2026-01-26", holidayType: "National Holiday" },
    { holidayName: "Holi",               holidayDate: "2026-03-04", holidayType: "Festival Holiday" },
    { holidayName: "Baisakhi",           holidayDate: "2026-04-14", holidayType: "Festival Holiday" },
    { holidayName: "Eid-ul-Fitr",        holidayDate: "2026-03-20", holidayType: "Festival Holiday" },
    { holidayName: "Independence Day",   holidayDate: "2026-08-15", holidayType: "National Holiday" },
    { holidayName: "Gandhi Jayanti",     holidayDate: "2026-10-02", holidayType: "National Holiday" },
    { holidayName: "Diwali",             holidayDate: "2026-11-08", holidayType: "Festival Holiday" },
    { holidayName: "Guru Nanak Jayanti", holidayDate: "2026-11-24", holidayType: "Festival Holiday" },
    { holidayName: "Christmas Day",      holidayDate: "2026-12-25", holidayType: "Festival Holiday" },
  ];

  const handleImportHolidays = async () => {
    setIsImporting(true); setImportStatus(null);
    try {
      const data = await fetchHolidays(selectedCountry, importYear);
      const existingDates = new Set(fields.map((f) => f.holidayDate));
      const newHolidays = data.filter((h) => !existingDates.has(h.date)).map((h) => ({
        holidayName: h.name, holidayDate: h.date,
        holidayType: h.types?.includes("Public") ? "National Holiday" : "Optional Holiday",
        applicableBranch: "All", description: "",
      }));
      if (newHolidays.length === 0) {
        setImportStatus({ type: "info", msg: `All ${data.length} holidays for ${selectedCountry} (${importYear}) are already in the list.` });
        return;
      }
      append(newHolidays);
      setImportStatus({ type: "success", msg: `✓ Imported ${newHolidays.length} holiday${newHolidays.length !== 1 ? "s" : ""} for ${selectedCountry} (${importYear}).` });
    } catch (e) {
      setImportStatus({ type: "error", msg: e.message || "Failed to import holidays." });
    } finally { setIsImporting(false); }
  };

  const statusColors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    error:   "bg-rose-50 border-rose-200 text-rose-700",
    info:    "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl shrink-0"><CalendarDays className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Holiday Register</h2>
            <p className="text-xs text-slate-500 mt-0.5">Build your company's official holiday calendar.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="relative">
            <select value={importYear} onChange={(e) => setImportYear(Number(e.target.value))}
              className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 appearance-none cursor-pointer hover:border-slate-300">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 select-none">
            <Globe className="w-3.5 h-3.5" /><span>{selectedCountry}</span>
          </div>
          <div onClick={isImporting ? undefined : handleImportHolidays}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border shadow-sm
              ${isImporting ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer hover:shadow"}`}>
            {isImporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Download className="w-4 h-4" /> Auto-Import Holidays</>}
          </div>
        </div>
      </div>

      {importStatus && (
        <div className={`mb-4 flex items-start justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium ${statusColors[importStatus.type]}`}>
          <span>{importStatus.msg}</span>
          <button type="button" onClick={() => setImportStatus(null)} className="shrink-0 opacity-60 hover:opacity-100 leading-none">✕</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {PRESET_HOLIDAYS.map((h) => {
          const alreadyAdded = fields.some((f) => f.holidayDate === h.holidayDate);
          return (
            <div key={h.holidayName}
              onClick={() => !alreadyAdded && append({ ...h, applicableBranch: "All", description: "" })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                ${alreadyAdded ? "border-slate-200 text-slate-300 cursor-not-allowed" : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 cursor-pointer"}`}>
              {alreadyAdded ? <><Check className="w-3 h-3 inline mr-1" />Added</> : `+ ${h.holidayName}`}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {fields.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 mb-4">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No holidays added. Use the import button above or add them manually.</p>
          </div>
        )}
        {fields.map((field, idx) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="col-span-12 md:col-span-4">
              <Field label="Holiday Name" required error={errors.holidays?.[idx]?.holidayName?.message}>
                <input {...register(`holidays.${idx}.holidayName`, { required: "Required" })} className={inputCls(errors.holidays?.[idx]?.holidayName)} placeholder="Republic Day" />
              </Field>
            </div>
            <div className="col-span-6 md:col-span-3">
              <Field label="Date"><input type="date" {...register(`holidays.${idx}.holidayDate`)} className={inputCls(false)} /></Field>
            </div>
            <div className="col-span-6 md:col-span-4">
              <Field label="Type">
                <div className="relative">
                  <select {...register(`holidays.${idx}.holidayType`)} className={selectCls(false)}>
                    {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </Field>
            </div>
            <div className="col-span-12 md:col-span-1 flex items-end pb-0.5 justify-center" style={{ paddingTop: "22px" }}>
              <div onClick={() => remove(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            {field.description && (
              <div className="col-span-12 -mt-1 px-1"><span className="text-[11px] text-slate-400 italic">{field.description}</span></div>
            )}
          </div>
        ))}
      </div>

      <div onClick={() => append({ holidayName: "", holidayDate: "", holidayType: "National Holiday", applicableBranch: "All" })}
        className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-all flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Holiday Manually
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyRegister() {
  const [currentStep,  setCurrentStep]  = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      country:     "IN",
      branches:    [{ branchName: "", branchCode: "", addressLine1: "", addressLine2: "", branchCity: "", branchState: "", postalCode: "", branchCountry: "IN", latitude: "", longitude: "", geoRadius: "" }],
      shifts:      [],
      departments: [],
      leaveTypes:  [],
      holidays:    [],
    },
  });

  const goNext = () => { if (currentStep < STEPS.length) setCurrentStep((s) => s + 1); };
  const goPrev = () => { if (currentStep > 1) setCurrentStep((s) => s - 1); };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("Company Registration Payload:", data);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const StepComponents = [Step1, Step2, Step3, Step4, Step5, Step6];
  const StepComponent  = StepComponents[currentStep - 1];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Company Registered!</h2>
          <p className="text-slate-500">Your organisation has been set up successfully. You can now start managing your team.</p>
          <div onClick={() => { setSubmitted(false); setCurrentStep(1); }}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 cursor-pointer transition-colors inline-block">
            Register Another
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      <div className="p-4 md:p-0 mx-auto">
        <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Company Registration</h1>
          <p className="text-slate-500 text-sm mt-1">Complete all 6 sections to set up your organisation on the platform.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm sticky top-6">
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isDone   = step.id < currentStep;
                return (
                  <div key={step.id} onClick={() => setCurrentStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all mb-0.5 cursor-pointer
                      ${isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : isDone ? "text-slate-600 hover:bg-slate-50 font-medium" : "text-slate-400 hover:bg-slate-50"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all
                      ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : isDone ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </div>
                    <span className="leading-tight">{step.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />}
                  </div>
                );
              })}
              <div className="mt-3 mx-3 mb-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </aside>

          {/* Form */}
          <main className="flex-1 min-w-0">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 mb-4 min-h-[500px]">
                <StepComponent register={register} errors={errors} control={control} watch={watch} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div onClick={goPrev}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer
                    ${currentStep === 1 ? "border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </div>

                <div className="flex items-center gap-1.5">
                  {STEPS.map((s) => (
                    <div key={s.id} className={`rounded-full transition-all ${s.id === currentStep ? "w-5 h-2 bg-indigo-500" : s.id < currentStep ? "w-2 h-2 bg-emerald-400" : "w-2 h-2 bg-slate-200"}`} />
                  ))}
                </div>

                {currentStep < STEPS.length ? (
                  <div onClick={goNext} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer transition-all shadow-sm shadow-indigo-200">
                    Next <ChevronRight className="w-4 h-4" />
                  </div>
                ) : (
                  <button type="submit" disabled={isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm
                      ${isSubmitting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"}`}>
                    {isSubmitting ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Registering...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Complete Registration</>
                    )}
                  </button>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}