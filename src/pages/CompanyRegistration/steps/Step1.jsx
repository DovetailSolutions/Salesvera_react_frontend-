import { useState, useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { Building2, Globe, Mail, Phone, Landmark, ChevronRight, Upload, Lock, Plus, Trash2 } from "lucide-react";
import Field from "../ui/Field";
import { SectionTitle, SubSection } from "../ui/SectionTitle";
import { inputCls, selectCls } from "../ui/inputStyles";
import { INDUSTRIES, COMPANY_SIZES, TIMEZONES, CURRENCIES, ACCOUNT_TYPES } from "../Constants";

const emptyBankDetails = {
  bankAccountHolder: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountNumberConfirm: "",
  bankIfsc: "",
  bankBranchName: "",
  bankAccountType: "",
  bankMicr: "",
  upiId: ""
};

// NOTE: Make sure to pass `control` from your parent component's useForm hook!
const Step1 = ({ register, errors, control }) => {
  const [logoPreview, setLogoPreview] = useState(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "banks", // Name of the array in your form state
  });

  // Automatically append the first bank account if the array is empty on mount
  useEffect(() => {
    if (fields.length === 0) {
      append(emptyBankDetails, { shouldFocus: false });
    }
  }, [fields.length, append]);

  return (
    <div className="space-y-10">
      {/* ── Basic Info ── */}
      <div>
        <SectionTitle
          icon={Building2}
          title="Company Basic Information"
          subtitle="Core details used to identify your organisation across the platform."
        />

        {/* Logo upload */}
        <Field label="Company Logo">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group mb-4">
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="h-24 object-contain rounded-xl" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                <Upload className="w-7 h-7" />
                <span className="text-xs font-medium">Click to upload logo (PNG, JPG, SVG)</span>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) setLogoPreview(URL.createObjectURL(f));
              }}
            />
          </label>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name" required error={errors.companyName?.message}>
            <input
              {...register("companyName", { required: "Required" })}
              className={inputCls(errors.companyName)}
              placeholder="Acme Corp"
            />
          </Field>

          <Field label="Legal Company Name" required error={errors.legalName?.message}>
            <input
              {...register("legalName", { required: "Required" })}
              className={inputCls(errors.legalName)}
              placeholder="Acme Corporation Pvt. Ltd."
            />
          </Field>

          <Field label="Company Registration Number" required error={errors.registrationNo?.message}>
            <input
              {...register("registrationNo", { required: "Required" })}
              className={inputCls(errors.registrationNo)}
              placeholder="CIN / Reg. No."
            />
          </Field>

          <Field label="GST Number" error={errors.gst?.message}>
            <input {...register("gst")} className={inputCls(false)} placeholder="22AAAAA0000A1Z5" />
          </Field>

          <Field label="PAN Number" required error={errors.pan?.message}>
            <input
              {...register("pan", { required: "Required" })}
              className={inputCls(errors.pan)}
              placeholder="ABCDE1234F"
            />
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
                {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
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
              <input
                {...register("companyEmail", { required: "Required" })}
                className={`${inputCls(errors.companyEmail)} pl-9`}
                placeholder="contact@acme.com"
              />
            </div>
          </Field>

          <Field label="Company Phone" required error={errors.companyPhone?.message}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register("companyPhone", { required: "Required" })}
                className={`${inputCls(errors.companyPhone)} pl-9`}
                placeholder="+91 98765 43210"
              />
            </div>
          </Field>

          {/* Admin Password Field */}
          <Field label="Admin Account Password" required error={errors.password?.message}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                {...register("password", {
                  required: "Required",
                  minLength: { value: 6, message: "Minimum 6 characters required" }
                })}
                className={`${inputCls(errors.password)} pl-9`}
                placeholder="Enter password for admin account"
              />
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

      {/* ── Bank Details ── */}
      <div>
        <SectionTitle
          icon={Landmark}
          title="Bank Account Details"
          subtitle="Primary and secondary company bank accounts used for payroll and transactions."
        />

        {fields.map((item, index) => (
          <div key={item.id} className="relative bg-slate-50 border border-slate-200 p-5 rounded-xl mb-6">
            
            {/* Header / Remove div for multiple accounts */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-slate-700">Bank Account #{index + 1}</h4>
              {index > 0 && (
                <div
                  type="div"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Account Holder Name" required error={errors?.banks?.[index]?.bankAccountHolder?.message}>
                <input
                  {...register(`banks.${index}.bankAccountHolder`, { required: "Required" })}
                  className={inputCls(errors?.banks?.[index]?.bankAccountHolder)}
                  placeholder="Acme Corporation Pvt. Ltd."
                />
              </Field>

              <Field label="Bank Name" required error={errors?.banks?.[index]?.bankName?.message}>
                <input
                  {...register(`banks.${index}.bankName`, { required: "Required" })}
                  className={inputCls(errors?.banks?.[index]?.bankName)}
                  placeholder="State Bank of India"
                />
              </Field>

              <Field label="Account Number" required error={errors?.banks?.[index]?.bankAccountNumber?.message}>
                <input
                  {...register(`banks.${index}.bankAccountNumber`, {
                    required: "Required",
                    pattern: { value: /^\d{9,18}$/, message: "Enter a valid account number" },
                  })}
                  className={inputCls(errors?.banks?.[index]?.bankAccountNumber)}
                  placeholder="012345678901"
                  maxLength={18}
                />
              </Field>

              <Field label="Confirm Account Number" required error={errors?.banks?.[index]?.bankAccountNumberConfirm?.message}>
                <input
                  {...register(`banks.${index}.bankAccountNumberConfirm`, { required: "Required" })}
                  className={inputCls(errors?.banks?.[index]?.bankAccountNumberConfirm)}
                  placeholder="Re-enter account number"
                  maxLength={18}
                />
              </Field>

              <Field label="IFSC Code" required error={errors?.banks?.[index]?.bankIfsc?.message}>
                <input
                  {...register(`banks.${index}.bankIfsc`, {
                    required: "Required",
                    pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Enter valid IFSC" },
                  })}
                  className={inputCls(errors?.banks?.[index]?.bankIfsc)}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  style={{ textTransform: "uppercase" }}
                />
              </Field>

              <Field label="Bank Branch Name">
                <input
                  {...register(`banks.${index}.bankBranchName`)}
                  className={inputCls(false)}
                  placeholder="Andheri West Branch"
                />
              </Field>

              <Field label="Account Type" required error={errors?.banks?.[index]?.bankAccountType?.message}>
                <div className="relative">
                  <select
                    {...register(`banks.${index}.bankAccountType`, { required: "Required" })}
                    className={selectCls(errors?.banks?.[index]?.bankAccountType)}
                  >
                    <option value="">Select type</option>
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </Field>

              <Field label="MICR Code">
                <input
                  {...register(`banks.${index}.bankMicr`)}
                  className={inputCls(false)}
                  placeholder="400002003"
                  maxLength={9}
                />
              </Field>

              <Field label="UPI ID">
                <input
                  {...register(`banks.${index}.upiId`)}
                  className={inputCls(false)}
                  placeholder="acme@sbi"
                />
              </Field>
            </div>
          </div>
        ))}

        {/* Add Another Bank div */}
        <div
          type="div"
          onClick={() => append(emptyBankDetails)}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors border border-indigo-100"
        >
          <Plus className="w-4 h-4" /> Add Another Bank Account
        </div>

        <div className="mt-10">
          <SubSection title="Additional Payment Info" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
    </div>
  );
};

export default Step1;