const SIZE = {
  sm: { padding: '6px 16px', fontSize: 'var(--text-sm)', height: '32px' },
  md: { padding: '10px 24px', fontSize: 'var(--text-base)', height: '44px' },
  lg: { padding: '14px 32px', fontSize: 'var(--text-lg)', height: '52px' },
};

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <circle
        cx="8" cy="8" r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="20 12"
      />
    </svg>
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  style,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`btn-${variant}`}
      style={{
        ...SIZE[size],
        borderRadius: 'var(--radius-md)',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: isDisabled ? 0.55 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
