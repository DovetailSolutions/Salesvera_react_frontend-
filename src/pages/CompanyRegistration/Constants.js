import {
  Building2, MapPin, Clock, CalendarDays, Umbrella, Layers,
} from "lucide-react";

export const STEPS = [
  { id: 1, label: "Company Info",        icon: Building2   },
  { id: 2, label: "Branches & Offices",  icon: MapPin      },
  { id: 3, label: "Shifts & Attendance", icon: Clock       },
  { id: 4, label: "Departments",         icon: Layers      },
  { id: 5, label: "Leaves & Time Off",   icon: Umbrella    },
  { id: 6, label: "Holiday Calendar",    icon: CalendarDays },
];

export const ALL_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export const DAY_COLORS = {
  Monday:    "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
  Tuesday:   "from-violet-50 to-violet-100 border-violet-200 text-violet-700",
  Wednesday: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
  Thursday:  "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
  Friday:    "from-rose-50 to-rose-100 border-rose-200 text-rose-700",
  Saturday:  "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
  Sunday:    "from-slate-50 to-slate-100 border-slate-200 text-slate-600",
};

export const INDUSTRIES = [
  "Technology", "Manufacturing", "Retail", "Healthcare", "Finance",
  "Education", "Hospitality", "Construction", "Logistics", "Other",
];

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];

export const TIMEZONES = [
  "Asia/Kolkata", "UTC", "America/New_York", "America/Los_Angeles",
  "Europe/London", "Asia/Tokyo", "Australia/Sydney",
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

export const ACCOUNT_TYPES = ["Current", "Savings", "Overdraft", "Cash Credit"];

export const LEAVE_TYPE_PRESETS = [
  "Casual Leave", "Sick Leave", "Paid Leave", "Unpaid Leave", "Maternity Leave",
];

export const DEPT_PRESETS = [
  { deptName: "Engineering",     deptCode: "ENG",  workingDaysInherit: true  },
  { deptName: "Human Resources", deptCode: "HR",   workingDaysInherit: true  },
  { deptName: "Finance",         deptCode: "FIN",  workingDaysInherit: true  },
  { deptName: "Sales",           deptCode: "SALE", workingDaysInherit: true  },
  { deptName: "Operations",      deptCode: "OPS",  workingDaysInherit: true  },
  { deptName: "Support",         deptCode: "SUP",  workingDaysInherit: false },
];

export const PRESET_HOLIDAYS = [
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

export const HOLIDAY_TYPES = [
  "National Holiday", "Festival Holiday", "Optional Holiday", "Company Holiday",
];

export const EXAMPLE_SHIFTS = [
  { shiftName: "Morning Shift", shiftCode: "MORN", startTime: "09:00", endTime: "18:00" },
  { shiftName: "Night Shift",   shiftCode: "NGHT", startTime: "22:00", endTime: "06:00" },
];

export const DEFAULT_BRANCH = {
  branchName: "", branchCode: "", addressLine1: "", addressLine2: "",
  branchCity: "", branchState: "", postalCode: "", branchCountry: "IN",
  latitude: "", longitude: "", geoRadius: "",
};

export const DEFAULT_SHIFT = {
  shiftName: "", shiftCode: "", startTime: "", endTime: "",
  graceTime: 15, halfDayHours: 4, fullDayHours: 8, nightShift: false,
};

export const DEFAULT_DEPARTMENT = {
  deptName: "", deptCode: "", deptHead: "", branch: "All",
  defaultShift: "", maxHeadcount: "",
};

export const DEFAULT_LEAVE_TYPE = {
  leaveName: "", leaveCode: "", leavesPerYear: 12,
  carryForward: false, carryForwardLimit: 0, managerApproval: true,
};