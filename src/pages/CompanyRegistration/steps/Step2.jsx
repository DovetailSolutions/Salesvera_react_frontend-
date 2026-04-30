import { useState, useEffect } from "react";
import { MapPin, Mail, Phone, ChevronRight, Trash2, Plus, Map } from "lucide-react";
import { useFieldArray, useWatch } from "react-hook-form";
import Field from "../ui/Field";
import { SectionTitle, SubSection } from "../ui/SectionTitle";
<<<<<<< HEAD
import { inputCls, selectCls } from "../ui/inputStyles";
import { DEFAULT_BRANCH } from "../Constants";
import MapPicker from "./MapPicker";
=======
import { inputCls, selectCls } from "../ui/InputStyles";
import { DEFAULT_BRANCH } from "../Constants";
>>>>>>> 865fa3d2c0ed0db61a651e436c665412bdf65a06

// ─── Put your Google Maps API key here (or pass it via env) ───────────────────
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

// Helper: build a geocode-friendly address string from branch form values
function buildAddress(branch = {}) {
  return [
    branch.addressLine1,
    branch.addressLine2,
    branch.branchCity,
    branch.branchState,
    branch.postalCode,
    branch.branchCountry,
  ]
    .filter(Boolean)
    .join(", ");
}

// Per-branch map visibility state lives outside the component to survive re-renders
const Step2 = ({ register, errors, control, setValue }) => {
  const [countries, setCountries] = useState([]);
  const [headOfficeIdx, setHeadOfficeIdx] = useState(0);
  const [mapOpen, setMapOpen] = useState({});   // { [idx]: boolean }

  const { fields, append, remove } = useFieldArray({ control, name: "branches" });

  // Watch all branches so we can rebuild the geocode address reactively
  const branchValues = useWatch({ control, name: "branches" });

  useEffect(() => {
    fetch("https://date.nager.at/api/v3/AvailableCountries")
      .then((r) => r.json())
      .then(setCountries)
      .catch((err) => console.error("Failed to load countries", err));
  }, []);

  const handleRemove = (idx) => {
    remove(idx);
    if (headOfficeIdx === idx) setHeadOfficeIdx(0);
    setMapOpen((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const toggleMap = (idx) =>
    setMapOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const handleMapChange = (idx, { lat, lng }) => {
    setValue(`branches.${idx}.latitude`, lat, { shouldValidate: true });
    setValue(`branches.${idx}.longitude`, lng, { shouldValidate: true });
  };

  return (
    <div>
      <SectionTitle
        icon={MapPin}
        title="Branch / Office Setup"
        subtitle="Add all your office locations with their complete addresses. Mark one as the Head Office."
      />

      {fields.map((field, idx) => {
        const branch = branchValues?.[idx] ?? {};
        const geocodeAddress = buildAddress(branch);
        const isMapOpen = !!mapOpen[idx];

        return (
          <div
            key={field.id}
            className="mb-6 rounded-2xl border-2 transition-all custom-border"
          >
            {/* ── Card header ── */}
            <div className="flex items-center justify-between px-5 py-3.5 rounded-t-2xl custom-border-bottom custom-border-top">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm
                    ${headOfficeIdx === idx
                      ? "bg-violet-600 text-white"
                      : "bg-white border border-slate-200 text-slate-500"}`}
                >
                  {idx + 1}
                </div>
                <div>
                  <span className="text-sm font-bold text">
                    {branch.branchName || `Branch ${idx + 1}`}
                  </span>
                  {headOfficeIdx === idx && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-600 dark:text-violet-100 text-violet-600 text-[10px] font-bold uppercase tracking-wide">
                      Head Office
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setHeadOfficeIdx(idx)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all
                    ${headOfficeIdx === idx
                      ? "border-violet-400 bg-violet-100 text-violet-700"
                      : "border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600"}`}
                >
                  {headOfficeIdx === idx ? "✓ Head Office" : "Set as Head Office"}
                </div>
                {fields.length > 1 && (
                  <div
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Card body ── */}
            <div className="p-5 space-y-5">

              {/* Branch Identity */}
              <div>
                <SubSection title="Branch Identity" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Branch Name" required error={errors.branches?.[idx]?.branchName?.message}>
                    <input
                      {...register(`branches.${idx}.branchName`, { required: "Required" })}
                      className={inputCls(errors.branches?.[idx]?.branchName)}
                      placeholder="Mumbai HQ"
                    />
                  </Field>
                  <Field label="Branch Code" required error={errors.branches?.[idx]?.branchCode?.message}>
                    <input
                      {...register(`branches.${idx}.branchCode`, { required: "Required" })}
                      className={inputCls(errors.branches?.[idx]?.branchCode)}
                      placeholder="MUM-01"
                    />
                  </Field>
                  <Field label="Branch Email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        {...register(`branches.${idx}.branchEmail`)}
                        className={`${inputCls(false)} pl-9`}
                        placeholder="mumbai@acme.com"
                      />
                    </div>
                  </Field>
                  <Field label="Branch Phone">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        {...register(`branches.${idx}.branchPhone`)}
                        className={`${inputCls(false)} pl-9`}
                        placeholder="+91 22 1234 5678"
                      />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Full Address */}
              <div>
                <SubSection title="Full Address" />
                <div className="grid grid-cols-1 gap-3">
                  <Field label="Address Line 1" required error={errors.branches?.[idx]?.addressLine1?.message}>
                    <input
                      {...register(`branches.${idx}.addressLine1`, { required: "Required" })}
                      className={inputCls(errors.branches?.[idx]?.addressLine1)}
                      placeholder="Building name, Street / Road"
                    />
                  </Field>
                  <Field label="Address Line 2">
                    <input
                      {...register(`branches.${idx}.addressLine2`)}
                      className={inputCls(false)}
                      placeholder="Area, Locality (optional)"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <Field label="City" required error={errors.branches?.[idx]?.branchCity?.message}>
                    <input
                      {...register(`branches.${idx}.branchCity`, { required: "Required" })}
                      className={inputCls(errors.branches?.[idx]?.branchCity)}
                      placeholder="Mumbai"
                    />
                  </Field>
                  <Field label="State / Province" required error={errors.branches?.[idx]?.branchState?.message}>
                    <input
                      {...register(`branches.${idx}.branchState`, { required: "Required" })}
                      className={inputCls(errors.branches?.[idx]?.branchState)}
                      placeholder="Maharashtra"
                    />
                  </Field>
                  <Field label="Postal / ZIP Code" required error={errors.branches?.[idx]?.postalCode?.message}>
                    <input
                      {...register(`branches.${idx}.postalCode`, { required: "Required" })}
                      className={inputCls(errors.branches?.[idx]?.postalCode)}
                      placeholder="400001"
                    />
                  </Field>
                  <Field label="Country" required error={errors.branches?.[idx]?.branchCountry?.message}>
                    <div className="relative">
                      <select
                        {...register(`branches.${idx}.branchCountry`, { required: "Required" })}
                        className={selectCls(errors.branches?.[idx]?.branchCountry)}
                      >
                        <option value="">Select country</option>
                        {countries.map((c) => (
                          <option key={c.countryCode} value={c.countryCode}>{c.name}</option>
                        ))}
                        <option key="India" value="India">India</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </Field>
                </div>
              </div>

              {/* Geo-fencing ─────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SubSection title="Geo-fencing" />
                  <button
                    type="button"
                    onClick={() => toggleMap(idx)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
                      ${isMapOpen
                        ? "bg-violet-100 border-violet-400 text-violet-700"
                        : "border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600"}`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    {isMapOpen ? "Hide Map" : "Pick on Map"}
                  </button>
                </div>

                {/* Lat / Lng / Radius inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Latitude">
                    <input
                      type="number"
                      step="any"
                      {...register(`branches.${idx}.latitude`)}
                      className={inputCls(false)}
                      placeholder="19.0760"
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      type="number"
                      step="any"
                      {...register(`branches.${idx}.longitude`)}
                      className={inputCls(false)}
                      placeholder="72.8777"
                    />
                  </Field>
                  <Field label="Radius (metres)">
                    <input
                      type="number"
                      {...register(`branches.${idx}.geoRadius`)}
                      className={inputCls(false)}
                      placeholder="100"
                    />
                  </Field>
                </div>

                {/* Map — conditionally rendered */}
                {isMapOpen && (
                  <div className="mt-4">
                    <MapPicker
                      apiKey={MAPS_API_KEY}
                      address={geocodeAddress}
                      lat={branch.latitude}
                      lng={branch.longitude}
                      onChange={(pos) => handleMapChange(idx, pos)}
                    />
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Employees must be within this radius to clock in at this branch.
                  {!isMapOpen && " Use Pick on Map to pinpoint coordinates visually."}
                </p>
              </div>
              {/* ───────────────────────────────────────────────────────────── */}

            </div>
          </div>
        );
      })}

      <div
        onClick={() => append({ ...DEFAULT_BRANCH })}
        className="w-full py-3 rounded-xl bg-violet-600 cursor-pointer transition-all flex items-center justify-center gap-2 text-white font-semibold"
      >
        <Plus className="w-4 h-4" /> Add Another Branch
      </div>
    </div>
  );
};

export default Step2;