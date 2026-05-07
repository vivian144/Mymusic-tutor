const PADDING = {
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-8)',
};

export default function Card({
  children,
  padding = 'md',
  hover = false,
  border = true,
  style,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        padding: PADDING[padding],
        border: border ? '1px solid var(--color-gray)' : 'none',
        transition: hover ? 'box-shadow 0.18s ease, transform 0.18s ease' : undefined,
        cursor: onClick || hover ? 'pointer' : 'default',
        ...(hover && {
          ':hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)',
          },
        }),
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
