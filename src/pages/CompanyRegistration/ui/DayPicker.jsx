import { Check } from "lucide-react";
import { ALL_DAYS, DAY_COLORS } from "../Constants";

const DayPicker = ({ selected, onChange }) => {
  const toggle = (day) =>
    onChange(
      selected.includes(day)
        ? selected.filter((d) => d !== day)
        : [...selected, day],
    );

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {ALL_DAYS.map((day) => {
        const active = selected.includes(day);
        return (
          <div
            key={day}
            onClick={() => toggle(day)}
            title={day}
            className={`flex flex-col items-center justify-center py-2.5 px-0.5 rounded-lg border-2 cursor-pointer
              transition-all text-[10px] font-bold
              ${active
                ? `bg-gradient-to-b ${DAY_COLORS[day]} shadow-sm scale-105`
                : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
              }`}
          >
            {active && <Check className="w-2.5 h-2.5 mb-0.5" />}
            {day.slice(0, 2)}
          </div>
        );
      })}
    </div>
  );
};

export default DayPicker;