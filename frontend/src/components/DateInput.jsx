import { useEffect, useRef, useState } from "react";

function DateInput({
  name,
  value,
  onChange,
  required = false
}) {
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    if (value) {
      const parts = value.split("-");

      setYear(parts[0] || "");
      setMonth(parts[1] || "");
      setDay(parts[2] || "");
    } else {
      setYear("");
      setMonth("");
      setDay("");
    }
  }, [value]);

  const sendChange = (newYear, newMonth, newDay) => {
    if (
      newYear.length === 4 &&
      newMonth.length === 2 &&
      newDay.length === 2
    ) {
      onChange({
        target: {
          name,
          value: `${newYear}-${newMonth}-${newDay}`
        }
      });
    } else if (
      newYear === "" &&
      newMonth === "" &&
      newDay === ""
    ) {
      onChange({
        target: {
          name,
          value: ""
        }
      });
    }
  };

  const handleYearChange = (event) => {
    const input = event.target.value.replace(/\D/g, "").slice(0, 4);

    setYear(input);
    sendChange(input, month, day);

    if (input.length === 4) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (event) => {
    let input = event.target.value.replace(/\D/g, "").slice(0, 2);

    if (input.length === 2) {
      const monthNumber = Number(input);

      if (monthNumber < 1 || monthNumber > 12) {
        return;
      }

      dayRef.current?.focus();
    }

    setMonth(input);
    sendChange(year, input, day);
  };

  const handleDayChange = (event) => {
    let input = event.target.value.replace(/\D/g, "").slice(0, 2);

    if (input.length === 2) {
      const dayNumber = Number(input);

      if (dayNumber < 1 || dayNumber > 31) {
        return;
      }
    }

    setDay(input);
    sendChange(year, month, input);
  };

  const handleKeyDown = (event, previousRef) => {
    if (
      event.key === "Backspace" &&
      event.target.value === ""
    ) {
      previousRef?.current?.focus();
    }
  };

  return (
    <div
      className="flex w-full items-center rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white transition focus-within:border-lime-400"
    >
      <input
        ref={yearRef}
        type="text"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(event) => handleKeyDown(event, null)}
        placeholder="YYYY"
        inputMode="numeric"
        maxLength={4}
        required={required}
        className="w-12 bg-transparent text-center text-sm text-white outline-none placeholder:text-slate-600 cursor-text"
        aria-label="Year"
      />

      <span className="px-1 text-slate-500">-</span>

      <input
        ref={monthRef}
        type="text"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(event) => handleKeyDown(event, yearRef)}
        placeholder="MM"
        inputMode="numeric"
        maxLength={2}
        className="w-8 bg-transparent text-center text-sm text-white outline-none placeholder:text-slate-600 cursor-text"
        aria-label="Month"
      />

      <span className="px-1 text-slate-500">-</span>

      <input
        ref={dayRef}
        type="text"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(event) => handleKeyDown(event, monthRef)}
        placeholder="DD"
        inputMode="numeric"
        maxLength={2}
        className="w-8 bg-transparent text-center text-sm text-white outline-none placeholder:text-slate-600 cursor-text"
        aria-label="Day"
      />

      <span className="ml-auto pl-2 text-slate-500">
        📅
      </span>
    </div>
  );
}

export default DateInput;