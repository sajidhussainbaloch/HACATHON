import React, { useRef, useState } from 'react';

/**
 * Six-box OTP input component.
 * @param {{ length?: number, onComplete: (otp: string) => void }} props
 */
export default function OTPInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[idx] = val;
    setValues(next);

    if (val && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }

    const code = next.join('');
    if (code.length === length && next.every(v => v)) {
      onComplete(code);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !values[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setValues(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputs.current[focusIdx]?.focus();
    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none focus:border-indigo-500 transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: val ? '#6366f1' : 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      ))}
    </div>
  );
}
