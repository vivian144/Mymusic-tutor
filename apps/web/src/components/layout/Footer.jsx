import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/search', label: 'Find a Teacher' },
  { to: '/teach', label: 'Teach & Earn' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms' },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-black)',
        color: 'var(--color-white)',
        paddingTop: 'var(--space-12)',
        paddingBottom: 'var(--space-8)',
      }}
    >
      <div className="container">
        {/* Top row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-10)',
          marginBottom: 'var(--space-10)',
        }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--color-white)' }}>
                MyMusic <span style={{ color: 'var(--color-peach)' }}>Tutor</span>
              </span>
            </Link>
            <p style={{ fontSize: 'var(--text-sm)', color: '#A09A94', lineHeight: 1.7 }}>
              Master Music at Your Home
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: '#A09A94', marginTop: 'var(--space-2)' }}>
              Hyderabad, Telangana
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              {[
                { label: 'Instagram', href: '#' },
                { label: 'YouTube', href: '#' },
                { label: 'Facebook', href: '#' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                    background: '#2A2A2A', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#A09A94', transition: 'color 0.15s, background 0.15s',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-white)'; e.currentTarget.style.background = 'var(--color-brown)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#A09A94'; e.currentTarget.style.background = '#2A2A2A'; }}
                >
                  {label[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-white)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Company
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {FOOTER_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ fontSize: 'var(--text-sm)', color: '#A09A94', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-white)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#A09A94')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-white)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Contact
            </p>
            <a
              href="mailto:support@mymusictutor.in"
              style={{ fontSize: 'var(--text-sm)', color: '#A09A94', textDecoration: 'none', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-white)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#A09A94')}
            >
              support@mymusictutor.in
            </a>
            <p style={{ fontSize: 'var(--text-sm)', color: '#A09A94', marginTop: 'var(--space-3)' }}>
              Mon – Sat, 9 AM – 8 PM IST
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          borderTop: '1px solid #2A2A2A',
          paddingTop: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}>
          <p style={{ fontSize: 'var(--text-xs)', color: '#6B6560', textAlign: 'center' }}>
            © 2026 MyMusic Tutor · Hyderabad, Telangana · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
