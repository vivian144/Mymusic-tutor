const SIZE_PX = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_SIZE = {
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '32px',
};

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function Avatar({
  src,
  name,
  size = 'md',
  uploadable = false,
  onUploadClick,
  style,
}) {
  const px = SIZE_PX[size];
  const fs = FONT_SIZE[size];
  const initials = getInitials(name);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          overflow: 'hidden',
          background: src ? 'transparent' : 'var(--color-gray)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '2px solid var(--color-gray)',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: fs,
              fontWeight: 600,
              color: 'var(--color-brown)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1,
            }}
          >
            {initials || '?'}
          </span>
        )}
      </div>

      {uploadable && (
        <button
          type="button"
          onClick={onUploadClick}
          aria-label="Change photo"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.round(px * 0.35),
            height: Math.round(px * 0.35),
            minWidth: 20,
            minHeight: 20,
            borderRadius: '50%',
            background: 'var(--color-brown)',
            color: 'var(--color-white)',
            border: '2px solid var(--color-white)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      )}
    </div>
  );
}
