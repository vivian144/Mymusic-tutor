import * as Dialog from '@radix-ui/react-dialog';

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = '480px',
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 26, 26, 0.5)',
            zIndex: 900,
            animation: 'fadeIn 0.15s ease',
          }}
        />

        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `min(${maxWidth}, calc(100vw - 32px))`,
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            zIndex: 901,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'slideUp 0.18s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: title || description ? 'var(--space-6)' : 0,
              gap: 'var(--space-4)',
            }}
          >
            <div>
              {title && (
                <Dialog.Title
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-xl)',
                    color: 'var(--color-black)',
                    marginBottom: description ? '4px' : 0,
                  }}
                >
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {description}
                </Dialog.Description>
              )}
            </div>

            <Dialog.Close asChild>
              <button
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-black)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Named exports for Trigger usage ─────────────────────── */
Modal.Trigger = Dialog.Trigger;
