import { useRef, useState } from "react";

export default function OtpInput({ length = 6, onChange }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = useRef([]);

  const update = (newVals) => {
    setValues(newVals);
    onChange(newVals.join(""));
  };

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const char = val[val.length - 1];
    const next = [...values];
    next[i] = char;
    update(next);
    if (i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...values];
      if (next[i]) {
        next[i] = "";
        update(next);
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
        next[i - 1] = "";
        update(next);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = Array(length).fill("");
    pasted.split("").forEach((c, idx) => (next[idx] = c));
    update(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-xl font-mono font-semibold rounded-xl border transition-all duration-200
            bg-slate-800/50 text-slate-100 outline-none
            ${val
              ? "border-brand-500 bg-brand-500/10 text-brand-300"
              : "border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            }`}
        />
      ))}
    </div>
  );
}
