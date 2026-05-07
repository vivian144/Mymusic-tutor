import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../ui/Avatar';

const NAV_LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/instruments', label: 'Instruments' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/teach', label: 'Teach & Earn' },
];

export default function Navbar() {
  const { isAuthenticated, user, role, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const dashboardLink = role === 'teacher' ? '/teacher' : '/dashboard';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Close mobile menu on resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    logout();
  };

  const navLinkStyle = ({ isActive }) => ({
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: isActive ? 'var(--color-brown)' : 'var(--color-black)',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    padding: '4px 0',
  });

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray)',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <MusicNoteIcon />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--color-black)', lineHeight: 1 }}>
            MyMusic{' '}
            <span style={{ color: 'var(--color-brown)' }}>Tutor</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }} className="desktop-nav">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} style={navLinkStyle}
              onMouseEnter={(e) => { if (e.currentTarget.style.color !== 'var(--color-brown)') e.currentTarget.style.color = 'var(--color-brown)'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = 'var(--color-black)'; }}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} className="desktop-nav">
          {isAuthenticated ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}
              >
                <Avatar src={user?.avatar} name={user?.name} size="sm" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--color-white)', border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  minWidth: 180, zIndex: 300, overflow: 'hidden',
                }}>
                  <DropdownItem to={dashboardLink} onClick={() => setDropdownOpen(false)}>My Dashboard</DropdownItem>
                  <DropdownItem to={`${dashboardLink}/profile`} onClick={() => setDropdownOpen(false)}>My Profile</DropdownItem>
                  <DropdownItem to="/settings" onClick={() => setDropdownOpen(false)}>Settings</DropdownItem>
                  <div style={{ borderTop: '1px solid var(--color-gray)', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={dropdownBtnStyle}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-black)', padding: '8px 16px' }}>
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
                style={{ fontSize: 'var(--text-sm)', fontWeight: 600, padding: '8px 20px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          className="hamburger"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'none', color: 'var(--color-black)' }}
        >
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: 'var(--color-white)', borderTop: '1px solid var(--color-gray)',
          padding: 'var(--space-4) var(--space-4) var(--space-6)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
        }}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              style={{ padding: '12px var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-black)', borderRadius: 'var(--radius-md)' }}>
              {label}
            </Link>
          ))}

          <div style={{ borderTop: '1px solid var(--color-gray)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {isAuthenticated ? (
              <>
                <Link to={dashboardLink} onClick={() => setMobileOpen(false)} style={{ padding: '12px var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 500 }}>My Dashboard</Link>
                <Link to={`${dashboardLink}/profile`} onClick={() => setMobileOpen(false)} style={{ padding: '12px var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 500 }}>My Profile</Link>
                <button onClick={handleLogout} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '12px var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-error)' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary"
                  style={{ textAlign: 'center', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)', display: 'block' }}>
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary"
                  style={{ textAlign: 'center', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)', display: 'block' }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function DropdownItem({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick}
      style={{ display: 'block', padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-black)', textDecoration: 'none', transition: 'background 0.12s ease' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-gray)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </Link>
  );
}

const dropdownBtnStyle = {
  display: 'block', width: '100%', padding: '10px 16px',
  fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-error)',
  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.12s ease',
};

/* ── Icons ────────────────────────────────────────────────── */

function MusicNoteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18V5l12-2v13" stroke="#A65631" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" stroke="#A65631" strokeWidth="2" />
      <circle cx="18" cy="16" r="3" stroke="#A65631" strokeWidth="2" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
