const BADGE_STYLES = {
  emerging: {
    background: '#F0EDE8',
    color: '#6B6560',
    label: 'Emerging',
  },
  verified: {
    background: '#FBF0EB',
    color: '#A65631',
    label: 'Verified',
  },
  senior: {
    background: '#FDF5F0',
    color: '#C88461',
    label: 'Senior',
  },
  elite: {
    background: '#1A1A1A',
    color: '#FFFFFF',
    label: 'Elite',
  },
  practitioner: {
    background: '#FFF8E6',
    color: '#8B6A00',
    label: 'Practitioner',
  },
};

export default function Badge({ variant = 'emerging', label, style }) {
  const config = BADGE_STYLES[variant] || BADGE_STYLES.emerging;
  const displayLabel = label || config.label;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: config.background,
        color: config.color,
        userSelect: 'none',
        ...style,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
}
