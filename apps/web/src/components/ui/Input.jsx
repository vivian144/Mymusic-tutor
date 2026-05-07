import { useState, useRef, useId } from 'react';

/* ── Text Input ───────────────────────────────────────────── */

const baseInput = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  border: '1.5px solid #E2DDD8',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)',
  color: 'var(--color-black)',
  background: 'var(--color-white)',
  outline: 'none',
  transition: 'border-color 0.18s ease',
};

export function Input({
  label,
  error,
  helper,
  type = 'text',
  id,
  style,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const autoId = useId();
  const inputId = id || autoId;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

  const borderColor = error
    ? 'var(--color-error)'
    : focused
    ? 'var(--color-brown)'
    : '#E2DDD8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-black)',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          type={inputType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...baseInput, borderColor, paddingRight: isPassword ? '44px' : '14px', ...style }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '4px',
              display: 'flex',
            }}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}

      {!error && helper && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {helper}
        </span>
      )}
    </div>
  );
}

/* ── Phone Input ──────────────────────────────────────────── */

export function PhoneInput({ label, error, helper, value = '', onChange, ...props }) {
  const [focused, setFocused] = useState(false);
  const autoId = useId();

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange?.(digits);
  };

  const displayValue = value
    ? value.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim()
    : '';

  const borderColor = error
    ? 'var(--color-error)'
    : focused
    ? 'var(--color-brown)'
    : '#E2DDD8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={autoId}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
        >
          {label}
        </label>
      )}

      <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${borderColor}`, borderRadius: 'var(--radius-md)', background: 'var(--color-white)', transition: 'border-color 0.18s ease', overflow: 'hidden' }}>
        <span style={{ padding: '0 12px', fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', borderRight: '1.5px solid #E2DDD8', height: '44px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
          +91
        </span>
        <input
          id={autoId}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, height: '44px', padding: '0 14px', border: 'none', outline: 'none', fontSize: 'var(--text-base)', background: 'transparent', color: 'var(--color-black)' }}
          {...props}
        />
      </div>

      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
      {!error && helper && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {helper}
        </span>
      )}
    </div>
  );
}

/* ── OTP Input ────────────────────────────────────────────── */

export function OTPInput({ length = 6, value = '', onChange, disabled, error }) {
  const inputRefs = useRef([]);
  const values = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[index] = digit;
    onChange?.(next.join(''));
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange?.(pasted);
    const nextFocus = Math.min(pasted.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            style={{
              width: '48px',
              height: '56px',
              textAlign: 'center',
              fontSize: 'var(--text-xl)',
              fontWeight: 600,
              border: `2px solid ${error ? 'var(--color-error)' : values[i] ? 'var(--color-brown)' : '#E2DDD8'}`,
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              background: 'var(--color-white)',
              color: 'var(--color-black)',
              transition: 'border-color 0.18s ease',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1,
            }}
          />
        ))}
      </div>
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ── Eye icons ────────────────────────────────────────────── */

function Eye({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default Input;
