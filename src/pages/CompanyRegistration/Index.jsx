import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ChevronRight, ChevronLeft, Check, Loader2, Trash2 } from "lucide-react";

import { adminApi, authApi, companyApi } from "../../api/index";
import { STEPS, DEFAULT_BRANCH } from "./constants";

import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";
import Step6 from "./steps/Step6";

const buildCompanyPayload = (data) => ({
  companyName: data.companyName,
  legalName: data.legalName,
  registrationNo: data.registrationNo,
  gst: data.gst || "",
  pan: data.pan,
  industry: data.industry,
  companySize: data.companySize,
  website: data.website || "",
  companyEmail: data.companyEmail,
  companyPhone: data.companyPhone,
  timezone: data.timezone,
  currency: data.currency,
  bankAccountHolder: data.bankAccountHolder,
  bankName: data.bankName,
  bankAccountNumber: data.bankAccountNumber,
  bankIfsc: data.bankIfsc,
  bankBranchName: data.bankBranchName || "",
  bankAccountType: data.bankAccountType,
  bankMicr: data.bankMicr || "",
  upiId: data.upiId || "",
  payrollCycle: data.payrollCycle,
  lateMarkAfter: Number(data.lateMarkAfter) || 0,
  autoHalfDayAfter: Number(data.autoHalfDayAfter) || 0,
  casualHolidaysTotal: Number(data.casualHolidaysTotal) || 0,
  casualHolidaysPerMonth: Number(data.casualHolidaysPerMonth) || 0,
  casualHolidayNotice: Number(data.casualHolidayNotice) || 0,
  compOffMinHours: Number(data.compOffMinHours) || 0,
  compOffExpiryDays: Number(data.compOffExpiryDays) || 0,
  casualCarryForwardLimit: Number(data.casualCarryForwardLimit) || 0,
  casualCarryForwardExpiry: Number(data.casualCarryForwardExpiry) || 0,
});

const buildBranchPayload = (branch) => ({
  branchName: branch.branchName,
  branchCode: branch.branchCode,
  branchCity: branch.branchCity,
  branchState: branch.branchState,
  branchCountry: branch.branchCountry,
  postalCode: branch.postalCode,
  addressLine1: branch.addressLine1,
  addressLine2: branch.addressLine2 || "",
  branchEmail: branch.branchEmail || "",
  branchPhone: branch.branchPhone || "",
  latitude: Number(branch.latitude) || 0,
  longitude: Number(branch.longitude) || 0,
  geoRadius: Number(branch.geoRadius) || 0,
});

const buildShiftPayload = (shift, companyId, branchId) => ({
  companyId,
  branchId,
  shiftName: shift.shiftName,
  shiftCode: shift.shiftCode,
  startTime: shift.startTime,
  endTime: shift.endTime,
  graceTime: Number(shift.graceTime) || 0,
  halfDayHours: Number(shift.halfDayHours) || 4,
  fullDayHours: Number(shift.fullDayHours) || 8,
  nightShift: !!shift.nightShift,
});

const STEP1_FIELDS = [
  "companyName", "legalName", "registrationNo", "pan",
  "industry", "companySize", "companyEmail", "companyPhone",
  "timezone", "currency",
  "bankAccountHolder", "bankName", "bankAccountNumber",
  "bankAccountNumberConfirm", "bankIfsc", "bankAccountType", "payrollCycle",
];

const branchFieldNames = (branches = []) =>
  branches.flatMap((_, i) => [
    `branches.${i}.branchName`,
    `branches.${i}.branchCode`,
    `branches.${i}.addressLine1`,
    `branches.${i}.branchCity`,
    `branches.${i}.branchState`,
    `branches.${i}.postalCode`,
    `branches.${i}.branchCountry`,
  ]);

const shiftFieldNames = (shifts = []) =>
  shifts.flatMap((_, i) => [
    `shifts.${i}.shiftName`,
    `shifts.${i}.shiftCode`,
  ]);

// ─── Local Storage Key ────────────────────────────────────────────────────────
const DRAFT_KEY = "company_register_draft";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompanyRegister() {
  // --- Initialization from Local Storage ---
  const draftString = localStorage.getItem(DRAFT_KEY);
  let initialDraft = null;
  if (draftString) {
    try {
      initialDraft = JSON.parse(draftString);
    } catch (e) {
      console.error("Failed to parse draft data");
    }
  }

  const [currentStep, setCurrentStep] = useState(initialDraft?.meta?.currentStep || 1);
  const [submitted, setSubmitted] = useState(false);

  // Per-step save state
  const [stepLoading, setStepLoading] = useState(false);
  const [stepError, setStepError] = useState(null);

  // IDs returned by APIs – needed by later steps
  const [companyId, setCompanyId] = useState(initialDraft?.meta?.companyId || null);
  const [branchIds, setBranchIds] = useState(initialDraft?.meta?.branchIds || []);
  const [adminId, setAdminId] = useState(initialDraft?.meta?.adminId || null); // <-- NEW: Track Admin ID

  // Which steps have already been persisted to the backend
  const [savedSteps, setSavedSteps] = useState(new Set(initialDraft?.meta?.savedSteps || []));

  const {
    register,
    trigger,
    getValues,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: initialDraft?.formData || {
      country: "IN",
      branches: [{ ...DEFAULT_BRANCH }],
      shifts: [],
      departments: [],
      leaveTypes: [],
      holidays: [],
    },
  });

  // ── Auto-Save to Local Storage ─────────────────────────────────────────────

  const saveToLocalStorage = (formData) => {
    const meta = {
      currentStep,
      savedSteps: Array.from(savedSteps), // Sets aren't JSON serializable directly
      companyId,
      branchIds,
      adminId, // <-- NEW: Persist Admin ID
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, meta }));
  };

  // Watch for form data changes
  useEffect(() => {
    const subscription = watch((value) => saveToLocalStorage(value));
    return () => subscription.unsubscribe();
  }, [watch, currentStep, savedSteps, companyId, branchIds, adminId]);

  // Watch for meta state changes (step navigation, API IDs)
  useEffect(() => {
    saveToLocalStorage(getValues());
  }, [currentStep, savedSteps, companyId, branchIds, adminId]);

  // ── Clear Draft Logic ──────────────────────────────────────────────────────

  const handleClearDraft = () => {
    if (!window.confirm("Are you sure you want to clear all existing data? You will need to start over.")) return;

    localStorage.removeItem(DRAFT_KEY);

    // Reset React Hook Form
    reset({
      country: "IN",
      branches: [{ ...DEFAULT_BRANCH }],
      shifts: [],
      departments: [],
      leaveTypes: [],
      holidays: [],
    });

    // Reset Component State
    setCurrentStep(1);
    setSavedSteps(new Set());
    setCompanyId(null);
    setBranchIds([]);
    setAdminId(null); // <-- NEW: Reset Admin ID
    setStepError(null);
  };

  // ── Per-step save functions ───────────────────────────────────────────────

  const saveStep1 = async () => {
    const valid = await trigger(STEP1_FIELDS);
    if (!valid) return false;

    if (savedSteps.has(1)) return true; // already saved, just advance

    setStepLoading(true);
    setStepError(null);
    try {
      const values = getValues();

      // 1. Build and fire the User Registration Payload
      const userPayload = {
        email: values.companyEmail,
        password: values.password,
        firstName: values.companyName,
        lastName: values.legalName,
        role: "admin",
        dob: "1990-01-01", // Standard placeholder date as requested
        phone: values.companyPhone,
      };

      // Extract adminId from the registration response
      const authRes = await authApi.register(userPayload);
      const newAdminId = authRes.data?.data?.item?.id;

      if (newAdminId) {
        setAdminId(newAdminId);
      }

      // 2. Build and fire the Company Registration Payload (injecting adminId)
      const res = await companyApi.addCompany({
        ...buildCompanyPayload(values),
        adminId: newAdminId
      });

      const newCompanyId = res.data?.data?.id;
      setCompanyId(newCompanyId);

      // 3. Build and fire the Bank Details Payload
      if (values.banks && values.banks.length > 0) {
        // Strip frontend-only fields (like confirm account number) before sending
        const formattedBanks = values.banks.map(bank => {
          const { bankAccountNumberConfirm, ...apiBankData } = bank;
          return apiBankData;
        });

        await companyApi.addBanks({
          companyId: newCompanyId,
          banks: formattedBanks
        });
      }

      setSavedSteps((prev) => new Set([...prev, 1]));
      return true;
    } catch (err) {
      console.error(err);
      setStepError(err?.response?.data?.message || "Failed to save company, user, and bank info. Please try again.");
      return false;
    } finally {
      setStepLoading(false);
    }
  };

  const saveStep2 = async () => {
    const branches = getValues("branches") || [];
    const valid = await trigger(branchFieldNames(branches));
    if (!valid) return false;

    if (savedSteps.has(2)) return true;

    setStepLoading(true);
    setStepError(null);
    try {
      const results = await Promise.all(
        branches.map((branch) => companyApi.addBranch({
          ...buildBranchPayload(branch),
          adminId // <-- NEW: Passed to Branch API
        }))
      );
      setBranchIds(results.map((r) => r.data?.data?.id));
      setSavedSteps((prev) => new Set([...prev, 2]));
      return true;
    } catch (err) {
      setStepError(err?.response?.data?.message || "Failed to save branch info. Please try again.");
      return false;
    } finally {
      setStepLoading(false);
    }
  };

  const saveStep3 = async () => {
    const shifts = getValues("shifts") || [];

    if (shifts.length > 0) {
      const valid = await trigger(shiftFieldNames(shifts));
      if (!valid) return false;
    }

    if (savedSteps.has(3)) return true;

    if (shifts.length === 0) {
      setSavedSteps((prev) => new Set([...prev, 3]));
      return true;
    }

    setStepLoading(true);
    setStepError(null);
    try {
      await Promise.all(
        shifts.map((shift) =>
          companyApi.addShift({
            ...buildShiftPayload(shift, companyId, branchIds[0]),
            // adminId // <-- NEW: Passed to Shift API
          })
        ),
      );
      setSavedSteps((prev) => new Set([...prev, 3]));
      return true;
    } catch (err) {
      setStepError(err?.response?.data?.message || "Failed to save shift info. Please try again.");
      return false;
    } finally {
      setStepLoading(false);
    }
  };

  const saveStep4 = async () => {
    const departments = getValues("departments") || [];
    if (savedSteps.has(4)) return true;

    if (departments.length === 0) {
      setSavedSteps((prev) => new Set([...prev, 4]));
      return true;
    }

    setStepLoading(true);
    setStepError(null);
    try {
      await Promise.all(
        departments.map((dept) =>
          companyApi.addDepartment({
            ...dept,
            companyId,
            // adminId // <-- NEW: Passed to Department API 
          })
        ),
      );
      setSavedSteps((prev) => new Set([...prev, 4]));
      return true;
    } catch (err) {
      setStepError(err?.response?.data?.message || "Failed to save departments. Please try again.");
      return false;
    } finally {
      setStepLoading(false);
    }
  };

  const saveStep5 = async () => {
    const leaveTypes = getValues("leaveTypes") || [];
    if (savedSteps.has(5)) return true;

    if (leaveTypes.length === 0) {
      setSavedSteps((prev) => new Set([...prev, 5]));
      return true;
    }

    setStepLoading(true);
    setStepError(null);
    try {
      const payload = {
        leaveTypes: leaveTypes.map((leave) => ({
          leaveName: leave.leaveName,
          leaveCode: leave.leaveCode,
          leavesPerYear: Number(leave.leavesPerYear) || 0,
          carryForward: !!leave.carryForward,
          carryForwardLimit: Number(leave.carryForwardLimit) || 0,
          managerApproval: !!leave.managerApproval,
        })),
        companyId: companyId,
        branchId: branchIds[0],
        adminId: adminId, // <-- NEW: Passed to LeaveType API
      };

      await companyApi.addLeaveType(payload);

      setSavedSteps((prev) => new Set([...prev, 5]));
      return true;
    } catch (err) {
      setStepError(
        err?.response?.data?.message ||
        "Failed to save leave types. Please try again."
      );
      return false;
    } finally {
      setStepLoading(false);
    }
  };

  const saveStep6 = async () => {
    const holidays = getValues("holidays") || [];
    if (savedSteps.has(6)) return true;

    if (holidays.length === 0) {
      setSavedSteps((prev) => new Set([...prev, 6]));
      return true;
    }

    setStepLoading(true);
    setStepError(null);

    try {
      const formattedHolidays = holidays.map((holiday) => {
        let selectedBranchIds = [];

        if (Array.isArray(holiday.branchId) && holiday.branchId.length > 0) {
          selectedBranchIds = holiday.branchId;
        } else if (holiday.branchId && holiday.branchId !== "All") {
          selectedBranchIds = [parseInt(holiday.branchId, 10)];
        } else {
          selectedBranchIds = branchIds;
        }

        selectedBranchIds = selectedBranchIds.filter(id => id != null && !isNaN(id));

        return {
          holidayName: holiday.holidayName,
          holidayDate: holiday.holidayDate,
          holidayType: holiday.holidayType,
          branchId: selectedBranchIds,
          description: holiday.description || ""
        };
      });

      const payload = {
        companyId: companyId,
        adminId: adminId, // <-- NEW: Passed to Holiday API
        holidays: formattedHolidays
      };

      await companyApi.addHoliday(payload);

      setSavedSteps((prev) => new Set([...prev, 6]));
      return true;
    } catch (err) {
      setStepError(err?.response?.data?.message || "Failed to save holidays. Please try again.");
      return false;
    } finally {
      setStepLoading(false);
    }
  };

  // ── Master Next handler ───────────────────────────────────────────────────

  const handleNext = async () => {
    setStepError(null);

    let ok = false;
    switch (currentStep) {
      case 1: ok = await saveStep1(); break;
      case 2: ok = await saveStep2(); break;
      case 3: ok = await saveStep3(); break;
      case 4: ok = await saveStep4(); break;
      case 5: ok = await saveStep5(); break;
      default: ok = true;
    }

    if (ok && currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  /**
   * Final submit on Step 6.
   * Clears Local Storage upon successful completion.
   */
  const handleFinalSubmit = async () => {
    const ok = await saveStep6();
    if (ok) {
      setSubmitted(true);
      localStorage.removeItem(DRAFT_KEY); // Data completely removed here
    }
  };

  const goPrev = () => {
    setStepError(null);
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center translucent">
        <div className="popuprounded-3xl shadow-xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full translucent-inner flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Company Registered!</h2>
          <p className="text-slate-500">
            Your organisation has been set up successfully. You can now start managing your team.
          </p>
          <div
            onClick={() => {
              setSubmitted(false);
              reset({
                country: "IN",
                branches: [{ ...DEFAULT_BRANCH }],
                shifts: [],
                departments: [],
                leaveTypes: [],
                holidays: [],
              });
              setCurrentStep(1);
              setSavedSteps(new Set());
              setCompanyId(null);
              setBranchIds([]);
              setAdminId(null); // <-- NEW: Reset Admin ID
            }}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 cursor-pointer transition-colors inline-block"
          >
            Register Another
          </div>
        </div>
      </div>
    );
  }

  const StepComponents = [Step1, Step2, Step3, Step4, Step5, Step6];
  const StepComponent = StepComponents[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="min-h-screen translucent">
      <div className="p-4 md:p-0 mx-auto">

        {/* Page header with Clear Data Button */}
        <div className="mb-4  rounded-xl custom-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text tracking-tight">Company Registration</h1>
            <p className="text-slate-400 text-sm mt-1">
              Complete all 6 sections to set up your organisation on the platform.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearDraft}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 font-semibold rounded-lg hover:bg-rose-100 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Clear Existing Data
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="lg:w-72 shrink-0">
            <div className="rounded-xl custom-border p-3 sticky top-6">
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isDone = savedSteps.has(step.id);
                const isReached = step.id <= currentStep;

                return (
                  <div
                    key={step.id}
                    onClick={() => isReached && !stepLoading && setCurrentStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm
                      transition-all mb-0.5
                      ${isActive ? "text font-semibold cursor-pointer translucent custom-border"
                        : isDone ? "font-medium cursor-pointer"
                          : isReached ? "text cursor-pointer"
                            : "text-slate-300 cursor-not-allowed"}`}
                  >
                    {/* Circle badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                        text-xs font-bold transition-all
                        ${isActive ? "bg-indigo-600 text-white "
                          : isDone ? "bg-emerald-100 text-emerald-600"
                            : "bg-indigo-400  text-white "}`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="leading-tight block">{step.label}</span>
                      {/* Sub-label shows save / loading state */}
                      {isDone && !isActive && (
                        <span className="text-[10px] text-emerald-500 font-semibold">Saved</span>
                      )}
                      {isActive && stepLoading && (
                        <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving…
                        </span>
                      )}
                    </div>

                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto text-indigo-400 shrink-0" />
                    )}
                  </div>
                );
              })}

              {/* Progress bar */}
              <div className="mt-3 mx-3 mb-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{savedSteps.size} / {STEPS.length} saved</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full      rounded-full transition-all duration-500"
                    style={{ width: `${(savedSteps.size / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Form ── */}
          <main className="flex-1 min-w-0">
            <div className="rounded-2xl custom-border p-6 lg:p-8 mb-4 min-h-[500px]">
              <StepComponent
                register={register}
                errors={errors}
                control={control}
                watch={watch}
              />
            </div>

            {/* Error banner */}
            {stepError && (
              <div className="mb-4 flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium">
                <span>⚠ {stepError}</span>
                <button
                  type="button"
                  onClick={() => setStepError(null)}
                  className="shrink-0 opacity-60 hover:opacity-100 leading-none"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">

              {/* Previous */}
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStep === 1 || stepLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all
                  ${currentStep === 1 || stepLoading
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"}`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-full transition-all duration-300
                      ${s.id === currentStep ? "w-5 h-2 bg-indigo-500"
                        : savedSteps.has(s.id) ? "w-2 h-2 bg-emerald-400"
                          : "w-2 h-2 bg-slate-200"}`}
                  />
                ))}
              </div>

              {/* Next / Complete */}
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={stepLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Complete Registration
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={stepLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm
                    ${stepLoading
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 cursor-pointer"}`}
                >
                  {stepLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      {savedSteps.has(currentStep) ? "Next" : "Save & Next"}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}