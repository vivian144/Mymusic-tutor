import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';

/* ── Images ───────────────────────────────────────────────── */
const IMG = {
  guitar: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
  drums: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800',
  keyboard: 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=800',
  hero: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
  student: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800',
  teacherStudent: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=800',
};

/* ── Grade data ───────────────────────────────────────────── */
const GRADES = ['Basics', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

const GRADE_DATA = {
  Basics: {
    time: '1-2 months',
    skills: ['Hold instrument correctly', 'Basic notes and scales', 'Simple rhythms', 'Reading basic music notation'],
    techniques: ['Correct posture and hand position', 'Reading basic music notation', 'Simple rhythms and timing', 'First notes on your instrument'],
    exam: 'No exam — this is your foundation',
  },
  'Grade 1': {
    time: '2-3 months',
    skills: ['Simple melodies', 'Basic chords', 'Music theory introduction', 'Counting beats'],
    techniques: ['Single note melodies', 'Basic chord shapes', 'Picking and strumming technique', 'Playing in steady tempo'],
    exam: 'Trinity Grade 1 or Rockschool Grade 1',
  },
  'Grade 2': {
    time: '2-3 months',
    skills: ['Intermediate melodies', 'Chord progressions', 'Dynamics (loud/soft)', 'Musical expression'],
    techniques: ['Chord transitions', 'Strumming patterns', 'Basic scales', 'Dynamics — loud and soft'],
    exam: 'Trinity Grade 2 or Rockschool Grade 2',
  },
  'Grade 3': {
    time: '3-4 months',
    skills: ['Advanced techniques', 'Multiple chord positions', 'Music reading fluency', 'Performance skills'],
    techniques: ['Barre chords and fingerpicking', 'Music theory fundamentals', 'Sight reading basics', 'Musical phrasing and expression'],
    exam: 'Trinity Grade 3 or Rockschool Grade 3',
  },
  'Grade 4': {
    time: '3-4 months',
    skills: ['Complex rhythms', 'Scale mastery', 'Sight reading', 'Performance confidence'],
    techniques: ['Advanced scale patterns', 'Chord inversions', 'Complex rhythms', 'Performance confidence'],
    exam: 'Trinity Grade 4 or Rockschool Grade 4',
  },
  'Grade 5': {
    time: '4-5 months',
    skills: ['Professional techniques', 'Improvisation basics', 'Advanced theory', 'Stage presence'],
    techniques: ['Improvisation foundations', 'Advanced instrument techniques', 'Aural training', 'Stage presence'],
    exam: 'Trinity Grade 5 or Rockschool Grade 5',
  },
  'Grade 6': {
    time: '4-5 months',
    skills: ['Concert-level playing', 'Complex compositions', 'Advanced improvisation', 'Teaching ability'],
    techniques: ['Concert-level performance', 'Complex compositions', 'Advanced music theory', 'Teaching foundational skills'],
    exam: 'Trinity Grade 6 or Rockschool Grade 6',
  },
  'Grade 7': {
    time: '5-6 months',
    skills: ['Near-professional level', 'Original compositions', 'Advanced performance', 'Music leadership'],
    techniques: ['Near-professional technique', 'Original musical interpretation', 'Advanced aural skills', 'Leadership in music'],
    exam: 'Trinity Grade 7 or Rockschool Grade 7',
  },
  'Grade 8': {
    time: '5-6 months',
    skills: ['Professional musician level', 'Complete Trinity certification', 'Performance mastery', 'Qualify to teach'],
    techniques: ['Full professional standard', 'Complete Trinity certification level', 'Recital-ready performance', 'Qualified to teach others'],
    exam: 'Trinity Grade 8 or Rockschool Grade 8 — professional level',
  },
};

/* ── Static data ──────────────────────────────────────────── */
const INSTRUMENTS = [
  { name: 'Guitar', img: IMG.guitar, desc: 'Acoustic or electric. Classical technique or modern chords. Beginners to Grade 8.' },
  { name: 'Drums', img: IMG.drums, desc: 'Acoustic kit or practice pad. Rhythm, coordination, and full performance training.' },
  { name: 'Keyboard', img: IMG.keyboard, desc: 'Piano technique on a keyboard. Theory, classical pieces, and modern songs.' },
];

const PACKAGES = [
  { duration: '1 Month', price: 5000, sessions: 8, badge: null, popular: false },
  { duration: '3 Months', price: 14000, sessions: 24, badge: 'Most Popular', popular: true },
  { duration: '6 Months', price: 26600, sessions: 48, badge: '5% off', popular: false },
  { duration: '12 Months', price: 50400, sessions: 96, badge: '10% off', popular: false },
];

const TRUST_STATS = [
  'Trinity & Rockschool Certified',
  'Background Checked Teachers',
  "Hyderabad's First Music Tutor App",
];

/* ── Animation helper ─────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
});

/* ── Small icons ──────────────────────────────────────────── */
function CheckGreen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="#16A34A" fillOpacity="0.12" />
      <path d="M8 12l3 3 5-6" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckWhite() {
  return (
    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function MusicNote() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function LandingPage() {
  const [activeGrade, setActiveGrade] = useState('Basics');
  const [hoveredCard, setHoveredCard] = useState(null);
  const grade = GRADE_DATA[activeGrade];

  return (
    <>
      <style>{CSS}</style>

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Hero
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-white)', padding: '72px 0 64px' }}>
        <div className="container hero-grid">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Live badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-gray)', borderRadius: 'var(--radius-full)', padding: '5px 14px', marginBottom: '28px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-black)' }}>Now live in Hyderabad</span>
            </div>

            {/* Heading */}
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px, 5vw, 52px)', fontWeight: 900, color: 'var(--color-black)', lineHeight: 1.1, marginBottom: '24px' }}>
              Learn Guitar, Drums<br />
              or Keyboard<br />
              <span style={{ color: 'var(--color-brown)' }}>at Home</span>
            </h1>

            {/* Subtext */}
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', lineHeight: 1.75, marginBottom: '36px', maxWidth: '440px' }}>
              A qualified music teacher comes to your home.<br className="hide-mobile" />
              Book your first class today.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <Link to="/search">
                <Button variant="primary" size="lg">Find a Teacher</Button>
              </Link>
              <Link to="/teach">
                <Button variant="secondary" size="lg">Teach &amp; Earn</Button>
              </Link>
            </div>

            {/* Trust stats */}
            <div className="trust-stats">
              {TRUST_STATS.map((stat) => (
                <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{stat}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — image collage */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.12 }}
            className="hero-collage"
          >
            <div className="collage-container" style={{ position: 'relative' }}>
              {/* Top image: teacher with student */}
              <img
                src={IMG.teacherStudent}
                alt="Teacher with student"
                loading="eager"
                style={{ position: 'absolute', top: 0, left: '8%', width: '86%', height: '58%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
              />
              {/* Bottom left: instrument */}
              <img
                src={IMG.guitar}
                alt="Guitar"
                loading="eager"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '46%', height: '46%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
              />
              {/* Bottom right: student learning */}
              <img
                src={IMG.student}
                alt="Student learning"
                loading="eager"
                style={{ position: 'absolute', bottom: '3%', right: 0, width: '46%', height: '46%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — How It Works
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-off-white)', padding: '80px 0' }}>
        <div className="container">
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--color-black)' }}>
              Three steps to your first class
            </h2>
          </motion.div>

          <div className="three-grid">
            {[
              { num: '1', title: 'Pick your instrument', desc: 'Guitar, Drums, or Keyboard. Tell us your current level and what you want to learn.' },
              { num: '2', title: 'Choose a verified teacher', desc: 'Browse teachers near you. Every teacher is certified and background checked.' },
              { num: '3', title: 'They come to your home', desc: 'Your teacher arrives at your door, ready to teach. Everything is handled for you.' },
            ].map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                {...fadeUp(i * 0.1)}
                style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', border: '1px solid var(--color-gray)' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900, color: 'var(--color-black)' }}>{num}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-black)', marginBottom: 'var(--space-3)' }}>{title}</h3>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — Instruments
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-white)', padding: '80px 0' }}>
        <div className="container">
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--color-black)' }}>
              What do you want to learn?
            </h2>
          </motion.div>

          <div className="three-grid">
            {INSTRUMENTS.map(({ name, img, desc }, i) => (
              <motion.div
                key={name}
                {...fadeUp(i * 0.1)}
                onMouseEnter={() => setHoveredCard(name)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-gray)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.22s ease, transform 0.22s ease',
                  boxShadow: hoveredCard === name ? '0 8px 32px rgba(0,0,0,0.10)' : 'none',
                  transform: hoveredCard === name ? 'translateY(-5px)' : 'translateY(0)',
                  background: 'var(--color-white)',
                }}
              >
                <div style={{ height: 210, overflow: 'hidden' }}>
                  <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', transform: hoveredCard === name ? 'scale(1.05)' : 'scale(1)' }}
                  />
                </div>
                <div style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-black)', marginBottom: 'var(--space-2)' }}>{name}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', lineHeight: 1.7 }}>{desc}</p>
                  <Link to="/search">
                    <Button variant="secondary" size="sm">Explore</Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4 — Music Journey (Interactive)
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-off-white)', padding: '80px 0' }}>
        <div className="container">
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--color-black)', marginBottom: '12px' }}>
              Your music journey, grade by grade
            </h2>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', maxWidth: '520px', margin: '0 auto' }}>
              Most parents ask how long it takes. Here is an honest answer.
            </p>
          </motion.div>

          {/* Grade tabs */}
          <motion.div {...fadeUp(0.1)} style={{ marginTop: '44px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid var(--color-gray)', minWidth: 'max-content' }}>
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGrade(g)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 18px',
                    fontSize: 'var(--text-sm)',
                    fontWeight: activeGrade === g ? 700 : 500,
                    color: activeGrade === g ? 'var(--color-brown)' : 'var(--color-text-muted)',
                    borderBottom: `2px solid ${activeGrade === g ? 'var(--color-brown)' : 'transparent'}`,
                    marginBottom: '-2px',
                    transition: 'color 0.15s, font-weight 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Grade content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGrade}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ marginTop: '36px' }}
            >
              <div className="grade-grid">
                {/* Left col */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Timeline */}
                  <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', border: '1px solid var(--color-gray)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ width: 10, height: 10, background: 'var(--color-brown)', borderRadius: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Estimated time</p>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-black)' }}>{grade.time}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', border: '1px solid var(--color-gray)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-black)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>What you learn</p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {grade.skills.map((skill) => (
                        <li key={skill} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: 'var(--text-base)', color: 'var(--color-black)', lineHeight: 1.5 }}>
                          <CheckGreen />
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right col */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Techniques */}
                  <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', border: '1px solid var(--color-gray)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-black)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Techniques you will develop</p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {grade.techniques.map((technique) => (
                        <li key={technique} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: 'var(--text-base)', color: 'var(--color-black)', lineHeight: 1.5 }}>
                          <CheckGreen />
                          {technique}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exam */}
                  <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', border: '1px solid var(--color-gray)', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: 38, height: 38, background: '#FBF0EB', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-black)', marginBottom: '6px' }}>Exam option</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{grade.exam}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom message */}
          <motion.div
            {...fadeUp(0.1)}
            style={{ marginTop: '44px', background: 'var(--color-white)', border: '1px solid var(--color-gray)', borderLeft: '4px solid var(--color-brown)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)' }}
          >
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-black)', lineHeight: 1.85 }}>
              Reaching Grade 8 takes 3 to 5 years of consistent practice. That is a Trinity-certified musician. Every session builds on the last — and the progress you make compounds over time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5 — Progress Tracking Preview
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-white)', padding: '80px 0' }}>
        <div className="container progress-grid">

          {/* Left */}
          <motion.div {...fadeUp()}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, color: 'var(--color-black)', marginBottom: '20px', lineHeight: 1.2 }}>
              See exactly where you stand
            </h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '36px' }}>
              Every session is logged. See what was covered, how far you have come, and what is next — all in one place.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {['Progress notes from your teacher', 'Grade progress bar updated live', 'Upcoming and missed classes', 'Your full session history'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-black)' }}>
                  <CheckGreen />
                  {item}
                </li>
              ))}
            </ul>

            <Link to="/how-it-works">
              <Button variant="secondary" size="md">See how it works</Button>
            </Link>
          </motion.div>

          {/* Right — dashboard mockup */}
          <motion.div {...fadeUp(0.15)}>
            <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', boxShadow: '0 4px 28px rgba(0,0,0,0.07)' }}>
              {/* Student header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#FBF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-gray)' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-brown)' }}>AK</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-black)', marginBottom: '2px' }}>Arjun</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Grade 2 Guitar</p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-black)' }}>Grade 2 Progress</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-brown)' }}>65%</span>
                </div>
                <div style={{ height: 8, background: 'var(--color-gray)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: 'var(--color-brown)', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>

              {/* Next class */}
              <MockRow icon={<CalendarIcon />} label="Next class" value="Tomorrow, 5:00 PM with Priya M." />

              {/* Recent note */}
              <MockRow icon={<NoteIcon />} label="Teacher note" value="Great improvement on chord transitions this week" />

              {/* Sessions remaining */}
              <div style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '16px', marginTop: '4px', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <strong style={{ color: 'var(--color-black)' }}>18 sessions</strong> remaining in current package
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6 — Teach & Earn
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-black)', padding: '80px 0' }}>
        <div className="container teach-grid">

          {/* Left */}
          <motion.div {...fadeUp()}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-peach)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
              For Teachers
            </p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, color: 'var(--color-white)', marginBottom: '20px', lineHeight: 1.2 }}>
              Turn your music skills into a career
            </h2>
            <p style={{ fontSize: 'var(--text-base)', color: '#A09A94', lineHeight: 1.8, marginBottom: '36px' }}>
              Join music teachers across Hyderabad who are building real income on their own schedule. We handle bookings, payments, and reminders. You just teach.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {['Teach from your own schedule', 'Get paid for every session, directly', 'We send the students to you'].map((benefit) => (
                <li key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-white)' }}>
                  <CheckWhite />
                  {benefit}
                </li>
              ))}
            </ul>

            <Link to="/teach">
              <Button variant="primary" size="lg">Apply to Teach</Button>
            </Link>

            <p style={{ fontSize: 'var(--text-sm)', color: '#6B6560', marginTop: '20px', lineHeight: 1.7 }}>
              Trinity and Rockschool certified teachers welcome.<br />
              Experienced teachers welcome too.
            </p>
          </motion.div>

          {/* Right — earnings card */}
          <motion.div {...fadeUp(0.15)}>
            <div style={{ background: '#242424', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', border: '1px solid #333' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#A09A94', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '28px' }}>
                Monthly estimate
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {[
                  ['Students', '4 students'],
                  ['Sessions per student', '8 sessions / month'],
                  ['Total sessions', '32 sessions'],
                  ['Average per session', '₹600'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2F2F2F', paddingBottom: '16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: '#A09A94' }}>{label}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-white)' }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: '#A09A94', marginBottom: '10px' }}>Monthly earnings</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px, 6vw, 52px)', fontWeight: 900, color: 'var(--color-peach)', lineHeight: 1 }}>
                  ₹19,200
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: '#6B6560', marginTop: '10px' }}>per month · 4 students</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7 — Pricing
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-off-white)', padding: '80px 0' }}>
        <div className="container">
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--color-black)', marginBottom: '12px' }}>
              Simple pricing, no surprises
            </h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', maxWidth: '460px', margin: '0 auto' }}>
              All packages include 2 sessions per week at your home. Prices shown for Basics level.
            </p>
          </motion.div>

          <div className="four-grid" style={{ marginTop: '48px' }}>
            {PACKAGES.map(({ duration, price, sessions, badge, popular }, i) => (
              <motion.div
                key={duration}
                {...fadeUp(i * 0.08)}
                style={{
                  background: 'var(--color-white)',
                  borderRadius: 'var(--radius-lg)',
                  border: popular ? '2px solid var(--color-brown)' : '1px solid var(--color-gray)',
                  padding: 'var(--space-8)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  paddingTop: popular ? 'calc(var(--space-8) + 10px)' : 'var(--space-8)',
                }}
              >
                {badge && (
                  <div style={{
                    position: 'absolute',
                    ...(popular
                      ? { top: -13, left: '50%', transform: 'translateX(-50%)' }
                      : { top: 14, right: 14 }),
                    background: popular ? 'var(--color-brown)' : 'var(--color-peach)',
                    color: popular ? 'var(--color-white)' : 'var(--color-black)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    whiteSpace: 'nowrap',
                  }}>
                    {badge}
                  </div>
                )}

                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '10px' }}>{duration}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '32px', fontWeight: 700, color: popular ? 'var(--color-brown)' : 'var(--color-black)', lineHeight: 1, marginBottom: '6px' }}>
                  ₹{price.toLocaleString('en-IN')}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
                  {sessions} sessions · ₹{Math.round(price / sessions)}/session
                </p>

                <div style={{ flex: 1 }} />

                <Link to="/signup" style={{ display: 'block' }}>
                  <Button variant={popular ? 'primary' : 'secondary'} size="md" fullWidth>
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.2)} style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              First class available at ₹583. Separate from packages. One per account.
            </p>
            <Link to="/pricing">
              <Button variant="ghost" size="md">View all pricing →</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 8 — Final CTA
      ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-white)', padding: '100px 0' }}>
        <motion.div {...fadeUp()} className="container" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 900, color: 'var(--color-black)', marginBottom: '16px', lineHeight: 1.1 }}>
            Ready to start?
          </h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', marginBottom: '44px' }}>
            Book your first class today. Your teacher comes to you.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/search">
              <Button variant="primary" size="lg">Find a Teacher</Button>
            </Link>
            <Link to="/teach">
              <Button variant="secondary" size="lg">Teach &amp; Earn</Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

/* ── Dashboard mockup sub-components ─────────────────────── */
function MockRow({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--color-off-white)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <span style={{ color: 'var(--color-brown)', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      <div>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{label}</p>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-black)', lineHeight: 1.5 }}>{value}</p>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

/* ── Responsive CSS ───────────────────────────────────────── */
const CSS = `
  .hero-grid {
    display: grid;
    grid-template-columns: 6fr 4fr;
    gap: 56px;
    align-items: center;
  }
  .collage-container {
    height: 480px;
  }
  .three-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .grade-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .progress-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
  }
  .teach-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
  }
  .four-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .trust-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @media (max-width: 1024px) {
    .four-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .teach-grid {
      gap: 48px;
    }
  }

  @media (max-width: 768px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .collage-container {
      height: 300px;
    }
    .three-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .grade-grid {
      grid-template-columns: 1fr;
    }
    .progress-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .teach-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .trust-stats {
      gap: 8px;
    }
    .hide-mobile {
      display: none;
    }
  }

  @media (max-width: 540px) {
    .four-grid {
      grid-template-columns: 1fr;
    }
    .hero-collage {
      order: -1;
    }
  }
`;
