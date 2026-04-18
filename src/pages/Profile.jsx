import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import Step1 from "./CompanyRegistration/steps/Step1";
import Step2 from "./CompanyRegistration/steps/Step2";
import Step3 from "./CompanyRegistration/steps/Step3";
import Step4 from "./CompanyRegistration/steps/Step4";
import Step5 from "./CompanyRegistration/steps/Step5";
import Step6 from "./CompanyRegistration/steps/Step6";
import { authApi, companyApi } from "../api";
import { STEPS, DEFAULT_BRANCH } from "../pages/CompanyRegistration/Constants";
// ------------------ Helpers ------------------

const mapApiToForm = (profile, branches = [], holidays = []) => {
  const company = profile?.company || {};

  return {
    companyName: company.companyName || "",
    legalName: company.legalName || "",
    registrationNo: company.registrationNo || "",
    gst: company.gst || "",
    pan: company.pan || "",
    industry: company.industry || "",
    companySize: company.companySize || "",
    website: company.website || "",
    companyEmail: company.companyEmail || "",
    companyPhone: company.companyPhone || "",
    timezone: company.timezone || "Asia/Kolkata",
    currency: company.currency || "INR",

    branches: branches || [],
    shifts: company.shifts || [],
    departments: company.departments || [],
    leaveTypes: [],

    holidays: holidays.map((h) => ({
      holidayName: h.holidayName,
      holidayDate: h.holidayDate,
      holidayType: h.holidayType,
      branchId: Array.isArray(h.branchId) ? h.branchId : [h.branchId],
      description: h.description || "",
    })),
  };
};

export default function CompanyProfile() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyId, setCompanyId] = useState(null);

  const {
    register,
    control,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      branches: [],
      shifts: [],
      departments: [],
      leaveTypes: [],
      holidays: [],
    },
  });

  // ------------------ Fetch Data ------------------

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const profileRes = await authApi.getProfile();
        const profile = profileRes.data?.data;

        const [branchRes, holidayRes] = await Promise.all([
          companyApi.getBranches?.(),
          companyApi.getHolidays?.(),
        ]);

        const branches = branchRes?.data?.data?.data || [];
        const holidays = holidayRes?.data?.data?.data || [];

        const formData = mapApiToForm(profile, branches, holidays);

        reset(formData);

        setCompanyId(profile?.company?.id);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [reset]);

  // ------------------ Update Handlers ------------------

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = getValues();

      switch (currentStep) {
        case 1:
          await companyApi.updateCompany({
            companyId,
            ...data,
          });
          break;

        case 2:
          await Promise.all(
            data.branches.map((b) =>
              companyApi.updateBranch({ ...b })
            )
          );
          break;

        case 3:
          await Promise.all(
            data.shifts.map((s) =>
              companyApi.updateShift({ ...s, companyId })
            )
          );
          break;

        case 4:
          await Promise.all(
            data.departments.map((d) =>
              companyApi.updateDepartment({ ...d, companyId })
            )
          );
          break;

        case 5:
          await companyApi.updateLeaveTypes({
            leaveTypes: data.leaveTypes,
            companyId,
          });
          break;

        case 6:
          await Promise.all(
            data.holidays.map((h) =>
              companyApi.updateHoliday({ ...h, companyId })
            )
          );
          break;

        default:
          break;
      }

      alert("Saved successfully 🚀");
    } catch (err) {
      console.error(err);
      alert("Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  // ------------------ UI ------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Scrollable Steps */}
      <div className="sticky top-0 z-50 bg-white border-b overflow-x-auto">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {STEPS.map((step) => (
            <div
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                ${
                  currentStep === step.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              <step.icon className="w-4 h-4" />
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="p-6">
        {currentStep === 1 && (
          <Step1 register={register} errors={errors} control={control} />
        )}
        {currentStep === 2 && (
          <Step2 register={register} errors={errors} control={control} />
        )}
        {currentStep === 3 && (
          <Step3 register={register} errors={errors} control={control} />
        )}
        {currentStep === 4 && (
          <Step4 register={register} errors={errors} control={control} />
        )}
        {currentStep === 5 && (
          <Step5 register={register} errors={errors} control={control} />
        )}
        {currentStep === 6 && (
          <Step6 register={register} errors={errors} control={control} />
        )}

        {/* Save div */}
        <div className="mt-8 flex justify-end">
          <div
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </div>
        </div>
      </div>
    </div>
  );
}
