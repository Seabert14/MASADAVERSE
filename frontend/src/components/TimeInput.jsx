import { useEffect, useRef, useState } from "react";

function TimeInput({
  name,
  value,
  onChange,
  required = false
}) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

  useEffect(() => {
    if (value) {
      const parts = value.split(":");

      setHour(parts[0] || "");
      setMinute(parts[1]?.substring(0, 2) || "");
    } else {
      setHour("");
      setMinute("");
    }
  }, [value]);

  const sendChange = (newHour, newMinute) => {
    if (
      newHour.length === 2 &&
      newMinute.length === 2
    ) {
      onChange({
        target: {
          name,
          value: `${newHour}:${newMinute}`
        }
      });
    } else if (
      newHour === "" &&
      newMinute === ""
    ) {
      onChange({
        target: {
          name,
          value: ""
        }
      });
    }
  };

  const handleHourChange = (event) => {
    const input = event.target.value
      .replace(/\D/g, "")
      .slice(0, 2);

    if (input.length === 2) {
      const hourNumber = Number(input);

      if (hourNumber < 0 || hourNumber > 23) {
        return;
      }

      minuteRef.current?.focus();
    }

    setHour(input);
    sendChange(input, minute);
  };

  const handleMinuteChange = (event) => {
    const input = event.target.value
      .replace(/\D/g, "")
      .slice(0, 2);

    if (input.length === 2) {
      const minuteNumber = Number(input);

      if (minuteNumber < 0 || minuteNumber > 59) {
        return;
      }
    }

    setMinute(input);
    sendChange(hour, input);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Backspace" &&
      event.target.value === ""
    ) {
      hourRef.current?.focus();
    }
  };

  return (
    <div className="flex w-full items-center rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white transition focus-within:border-lime-400">
      <input
        ref={hourRef}
        type="text"
        value={hour}
        onChange={handleHourChange}
        placeholder="HH"
        inputMode="numeric"
        maxLength={2}
        required={required}
        className="w-8 bg-transparent text-center text-sm text-white outline-none placeholder:text-slate-600 cursor-text"
        aria-label="Hour"
      />

      <span className="px-1 text-slate-500">
        :
      </span>

      <input
        ref={minuteRef}
        type="text"
        value={minute}
        onChange={handleMinuteChange}
        onKeyDown={handleKeyDown}
        placeholder="MM"
        inputMode="numeric"
        maxLength={2}
        className="w-8 bg-transparent text-center text-sm text-white outline-none placeholder:text-slate-600 cursor-text"
        aria-label="Minute"
      />

      <span className="ml-auto pl-2 text-slate-500">
        🕐
      </span>
    </div>
  );
}

export default TimeInput;