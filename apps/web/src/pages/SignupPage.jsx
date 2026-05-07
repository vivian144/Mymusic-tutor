import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Input, PhoneInput, OTPInput } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/api';

/* ── Helpers ──────────────────────────────────────────────── */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function getPasswordStrength(password) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { label: 'Weak', color: 'var(--color-error)', width: '25%' };
  if (score <= 3) return { label: 'Fair', color: '#F97316', width: '60%' };
  return { label: 'Strong', color: 'var(--color-success)', width: '100%' };
}

/* ── Shared Icons ─────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function IconGradCap() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/>
    </svg>
  );
}

function IconMusic() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

function IconGuitar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

function IconDrum() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="8" rx="10" ry="4"/>
      <path d="M2 8v8c0 2.21 4.48 4 10 4s10-1.79 10-4V8"/>
      <path d="M2 12c0 2.21 4.48 4 10 4s10-1.79 10-4"/>
    </svg>
  );
}

function IconKeyboard() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
    </svg>
  );
}

/* ── Brand Panel ──────────────────────────────────────────── */

function BrandPanel() {
  return (
    <div style={{
      width: '40%',
      minWidth: '340px',
      background: 'var(--color-black)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '64px 48px',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-white)' }}>
          MyMusic
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-brown-light)' }}>
          {' '}Tutor
        </span>
      </div>

      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '40px',
        color: 'var(--color-white)',
        lineHeight: 1.2,
        marginBottom: '40px',
      }}>
        Master Music<br />at Your Home
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          'Verified music teachers',
          'Trinity & Rockschool certified',
          'Classes at your home',
        ].map((point) => (
          <div key={point} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-peach)', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>✓</span>
            <span style={{ color: '#CCCCCC', fontSize: '16px' }}>{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step Indicator ───────────────────────────────────────── */

function StepIndicator({ step, totalSteps }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Step {step} of {totalSteps}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-brown)', fontWeight: 600 }}>
          {Math.round((step / totalSteps) * 100)}%
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--color-gray)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(step / totalSteps) * 100}%`,
          background: 'var(--color-brown)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

/* ── Role Card ────────────────────────────────────────────── */

function RoleCard({ icon, title, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '20px',
        border: `2px solid ${selected ? 'var(--color-brown)' : '#E2DDD8'}`,
        borderRadius: 'var(--radius-lg)',
        background: selected ? '#FDF5F0' : 'var(--color-white)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        transition: 'border-color 0.18s ease, background 0.18s ease',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: 'var(--radius-md)',
        background: selected ? 'var(--color-brown)' : 'var(--color-gray)',
        color: selected ? 'var(--color-white)' : 'var(--color-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.18s ease, color 0.18s ease',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-black)', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </button>
  );
}

/* ── Instrument Card ──────────────────────────────────────── */

function InstrumentCard({ icon, label, selected, onClick, multi }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '16px 12px',
        border: `2px solid ${selected ? 'var(--color-brown)' : '#E2DDD8'}`,
        borderRadius: 'var(--radius-lg)',
        background: selected ? '#FDF5F0' : 'var(--color-white)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-body)',
        transition: 'border-color 0.18s ease, background 0.18s ease',
      }}
    >
      <div style={{ color: selected ? 'var(--color-brown)' : 'var(--color-text-muted)', transition: 'color 0.18s ease' }}>
        {icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: selected ? 'var(--color-brown)' : 'var(--color-black)' }}>
        {label}
      </span>
      {multi && selected && (
        <div style={{
          width: '16px', height: '16px',
          borderRadius: '50%',
          background: 'var(--color-brown)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  );
}

/* ── Radio Option ─────────────────────────────────────────── */

function RadioOption({ value, selected, onChange, children }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      cursor: 'pointer',
      padding: '12px 14px',
      border: `1.5px solid ${selected ? 'var(--color-brown)' : '#E2DDD8'}`,
      borderRadius: 'var(--radius-md)',
      background: selected ? '#FDF5F0' : 'var(--color-white)',
      transition: 'border-color 0.18s ease, background 0.18s ease',
    }}>
      <input
        type="radio"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        style={{ marginTop: '2px', accentColor: 'var(--color-brown)', flexShrink: 0 }}
      />
      <span style={{ fontSize: '14px', color: 'var(--color-black)', lineHeight: 1.5 }}>
        {children}
      </span>
    </label>
  );
}

/* ── File Upload Field ────────────────────────────────────── */

function FileUpload({ label, accept, onChange, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-black)' }}>
          {label}
        </label>
      )}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        border: '1.5px dashed #E2DDD8',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: 'var(--color-white)',
        transition: 'border-color 0.18s ease',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ fontSize: '14px', color: value ? 'var(--color-black)' : 'var(--color-text-muted)' }}>
          {value ? value.name : 'Click to upload (PDF or image)'}
        </span>
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files[0] || null)}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
}

/* ── Section Label ────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
      {children}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const isMobile = useIsMobile();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [basicData, setBasicData] = useState({});

  // Step 3 — Student
  const [instrument, setInstrument] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [grade, setGrade] = useState('');
  const [forWhom, setForWhom] = useState('self');
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');

  // Step 3 — Teacher
  const [teachInstruments, setTeachInstruments] = useState([]);
  const [certType, setCertType] = useState('');
  const [highestGrade, setHighestGrade] = useState('');
  const [certFile, setCertFile] = useState(null);
  const [yearsExp, setYearsExp] = useState('');
  const [proofType, setProofType] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [teachingMode, setTeachingMode] = useState('');
  const [bio, setBio] = useState('');

  // Step 4
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState('');

  // Step 2 phone — PhoneInput is controlled separately from react-hook-form
  const [step2Phone, setStep2Phone] = useState('');
  const [step2PhoneError, setStep2PhoneError] = useState('');

  const totalSteps = 4;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch('password', '');
  const strength = getPasswordStrength(passwordValue);

  const handleGoogleSignup = async () => {
    try {
      const res = await auth.loginWithGoogle();
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      toast.error('Google sign-in is unavailable right now.');
    }
  };

  const onStep2Submit = (data) => {
    if (step2Phone.length !== 10) {
      setStep2PhoneError('Enter a valid 10-digit phone number');
      return;
    }
    setStep2PhoneError('');
    const merged = { ...data, phone: step2Phone };
    setBasicData(merged);
    setRegisteredPhone(step2Phone);
    setStep(3);
  };

  const handleStudentSubmit = async () => {
    if (!instrument) { toast.error('Please select an instrument'); return; }
    if (!goal) { toast.error('Please select a learning goal'); return; }
    if (!level) { toast.error('Please select your current level'); return; }
    if (forWhom === 'child' && !childName.trim()) { toast.error('Please enter the child\'s name'); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...basicData,
        role: 'student',
        instrument,
        goal,
        level,
        grade: level === 'grade' ? grade : undefined,
        forWhom,
        childName: forWhom === 'child' ? childName : undefined,
        parentName: forWhom === 'child' ? parentName : undefined,
      };
      await auth.register(payload);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeacherSubmit = async () => {
    if (teachInstruments.length === 0) { toast.error('Select at least one instrument'); return; }
    if (!certType) { toast.error('Please select your certificate or experience type'); return; }
    if (!teachingMode) { toast.error('Please select a teaching mode'); return; }

    setSubmitting(true);
    try {
      const formPayload = new FormData();
      Object.entries(basicData).forEach(([k, v]) => formPayload.append(k, v));
      formPayload.append('role', 'teacher');
      formPayload.append('instruments', JSON.stringify(teachInstruments));
      formPayload.append('certType', certType);
      formPayload.append('teachingMode', teachingMode);
      formPayload.append('bio', bio);
      if (certType !== 'experience') {
        formPayload.append('highestGrade', highestGrade);
        if (certFile) formPayload.append('certFile', certFile);
      } else {
        formPayload.append('yearsExp', yearsExp);
        formPayload.append('proofType', proofType);
        if (proofFile) formPayload.append('proofFile', proofFile);
      }

      await auth.register(formPayload);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }
    setOtpError('');
    setVerifying(true);
    try {
      const res = await auth.loginWithOTP(registeredPhone, otp);
      login(res.data.user, res.data.token);
      toast.success(role === 'teacher' ? 'Phone verified!' : 'Account created!');
      navigate(role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const toggleTeachInstrument = (name) => {
    setTeachInstruments((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const instruments = [
    { name: 'Guitar', icon: <IconGuitar /> },
    { name: 'Drums', icon: <IconDrum /> },
    { name: 'Keyboard', icon: <IconKeyboard /> },
  ];

  const formPanelStyle = {
    flex: 1,
    background: 'var(--color-off-white)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: isMobile ? '32px 16px' : '48px 32px',
    overflowY: 'auto',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <BrandPanel />}

      <div style={formPanelStyle}>
        {isMobile && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-black)' }}>
              MyMusic
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-brown)' }}>
              {' '}Tutor
            </span>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '460px', paddingBottom: '48px' }}>

          {/* ── STEP 1: Role Selection ── */}
          {step === 1 && (
            <>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', marginBottom: '8px' }}>
                Create your account
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '32px' }}>
                Tell us a bit about yourself
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <RoleCard
                  icon={<IconGradCap />}
                  title="I want to learn"
                  description="Find a verified music teacher near you"
                  selected={role === 'student'}
                  onClick={() => setRole('student')}
                />
                <RoleCard
                  icon={<IconMusic />}
                  title="I want to teach"
                  description="Teach music and earn on your schedule"
                  selected={role === 'teacher'}
                  onClick={() => setRole('teacher')}
                />
              </div>

              <Button
                fullWidth
                disabled={!role}
                onClick={() => setStep(2)}
                style={{ marginBottom: '16px' }}
              >
                Continue
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#E2DDD8' }} />
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#E2DDD8' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                style={{
                  width: '100%', height: '44px',
                  background: 'var(--color-white)',
                  border: '1.5px solid #E2DDD8',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', cursor: 'pointer',
                  fontSize: '15px', fontFamily: 'var(--font-body)', fontWeight: 500,
                  color: 'var(--color-black)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#BCBCBC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2DDD8'; }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '20px' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--color-brown)', fontWeight: 600 }}>Log in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Basic Details ── */}
          {step === 2 && (
            <>
              <StepIndicator step={2} totalSteps={totalSteps} />
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', marginBottom: '8px' }}>
                Your details
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '28px' }}>
                Create your account
              </p>

              <form
                onSubmit={handleSubmit(onStep2Submit)}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <Input
                  label="Full name"
                  placeholder="Aditya Kumar"
                  error={errors.name?.message}
                  {...register('name', { required: 'Full name is required' })}
                />

                <PhoneInput
                  label="Phone number"
                  value={step2Phone}
                  onChange={(val) => { setStep2Phone(val); setStep2PhoneError(''); }}
                  error={step2PhoneError}
                  placeholder="98765 43210"
                />

                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    error={errors.password?.message}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters required' },
                    })}
                  />
                  {passwordValue && strength && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ height: '4px', background: 'var(--color-gray)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease, background 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: strength.color, fontWeight: 500, display: 'block', marginTop: '4px' }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat your password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === passwordValue || 'Passwords do not match',
                  })}
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" fullWidth>
                    Continue
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 3A: Student Details ── */}
          {step === 3 && role === 'student' && (
            <>
              <StepIndicator step={3} totalSteps={totalSteps} />
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', marginBottom: '8px' }}>
                Your music goals
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '28px' }}>
                Help us match you with the right teacher
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Instrument */}
                <div>
                  <SectionLabel>Which instrument?</SectionLabel>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {instruments.map(({ name, icon }) => (
                      <InstrumentCard
                        key={name}
                        icon={icon}
                        label={name}
                        selected={instrument === name}
                        onClick={() => setInstrument(name)}
                      />
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <SectionLabel>Learning goal</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <RadioOption value="grades" selected={goal === 'grades'} onChange={setGoal}>
                      Work toward Trinity / Rockschool grades
                    </RadioOption>
                    <RadioOption value="hobby" selected={goal === 'hobby'} onChange={setGoal}>
                      Learn as a hobby (no exams)
                    </RadioOption>
                  </div>
                </div>

                {/* Level */}
                <div>
                  <SectionLabel>Current level</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <RadioOption value="beginner" selected={level === 'beginner'} onChange={setLevel}>
                      Complete beginner
                    </RadioOption>
                    <RadioOption value="some" selected={level === 'some'} onChange={setLevel}>
                      I have some experience
                    </RadioOption>
                    <RadioOption value="grade" selected={level === 'grade'} onChange={setLevel}>
                      I am on a specific grade
                    </RadioOption>
                  </div>

                  {level === 'grade' && (
                    <div style={{ marginTop: '10px' }}>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        style={{
                          width: '100%', height: '44px', padding: '0 14px',
                          border: '1.5px solid #E2DDD8', borderRadius: 'var(--radius-md)',
                          fontSize: '16px', color: 'var(--color-black)',
                          background: 'var(--color-white)', outline: 'none',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <option value="">Select grade</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* For whom */}
                <div>
                  <SectionLabel>Who are you signing up for?</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <RadioOption value="self" selected={forWhom === 'self'} onChange={setForWhom}>
                      For myself
                    </RadioOption>
                    <RadioOption value="child" selected={forWhom === 'child'} onChange={setForWhom}>
                      For my child
                    </RadioOption>
                  </div>

                  {forWhom === 'child' && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <Input
                        label="Parent name"
                        placeholder="Your name"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                      />
                      <Input
                        label="Child's name"
                        placeholder="Child's name"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button fullWidth loading={submitting} onClick={handleStudentSubmit}>
                  Create Account
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 3B: Teacher Details ── */}
          {step === 3 && role === 'teacher' && (
            <>
              <StepIndicator step={3} totalSteps={totalSteps} />
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', marginBottom: '8px' }}>
                Your teaching profile
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '28px' }}>
                Tell students about yourself
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Instruments (multi-select) */}
                <div>
                  <SectionLabel>Which instruments do you teach?</SectionLabel>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {instruments.map(({ name, icon }) => (
                      <InstrumentCard
                        key={name}
                        icon={icon}
                        label={name}
                        selected={teachInstruments.includes(name)}
                        onClick={() => toggleTeachInstrument(name)}
                        multi
                      />
                    ))}
                  </div>
                </div>

                {/* Certificate type */}
                <div>
                  <SectionLabel>Do you have a grade certificate?</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <RadioOption value="trinity" selected={certType === 'trinity'} onChange={setCertType}>
                      Yes — Trinity College London certificate
                    </RadioOption>
                    <RadioOption value="rockschool" selected={certType === 'rockschool'} onChange={setCertType}>
                      Yes — Rockschool certificate
                    </RadioOption>
                    <RadioOption value="experience" selected={certType === 'experience'} onChange={setCertType}>
                      No — but I have teaching experience
                    </RadioOption>
                  </div>
                </div>

                {/* Certificate fields */}
                {(certType === 'trinity' || certType === 'rockschool') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--color-gray)', borderRadius: 'var(--radius-lg)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                        Highest grade completed
                      </label>
                      <select
                        value={highestGrade}
                        onChange={(e) => setHighestGrade(e.target.value)}
                        style={{
                          width: '100%', height: '44px', padding: '0 14px',
                          border: '1.5px solid #E2DDD8', borderRadius: 'var(--radius-md)',
                          fontSize: '16px', color: 'var(--color-black)',
                          background: 'var(--color-white)', outline: 'none',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <option value="">Select grade</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    <FileUpload
                      label="Upload certificate"
                      accept=".pdf,image/*"
                      value={certFile}
                      onChange={setCertFile}
                    />
                  </div>
                )}

                {/* Experience fields */}
                {certType === 'experience' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--color-gray)', borderRadius: 'var(--radius-lg)' }}>
                    <Input
                      label="Years of experience (min. 2)"
                      type="number"
                      placeholder="e.g. 5"
                      value={yearsExp}
                      onChange={(e) => setYearsExp(e.target.value)}
                    />
                    <div>
                      <SectionLabel>Type of proof</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { value: 'letter', label: 'Letter from music school or institute' },
                          { value: 'video', label: 'Performance or teaching video link' },
                          { value: 'reference', label: 'Reference letter' },
                          { value: 'other', label: 'Other' },
                        ].map(({ value, label }) => (
                          <RadioOption key={value} value={value} selected={proofType === value} onChange={setProofType}>
                            {label}
                          </RadioOption>
                        ))}
                      </div>
                    </div>
                    <FileUpload
                      label="Upload proof document"
                      accept=".pdf,image/*"
                      value={proofFile}
                      onChange={setProofFile}
                    />
                  </div>
                )}

                {/* Teaching mode */}
                <div>
                  <SectionLabel>Teaching mode</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <RadioOption value="home" selected={teachingMode === 'home'} onChange={setTeachingMode}>
                      Home visits only
                    </RadioOption>
                    <RadioOption value="online" selected={teachingMode === 'online'} onChange={setTeachingMode}>
                      Online classes only
                    </RadioOption>
                    <RadioOption value="both" selected={teachingMode === 'both'} onChange={setTeachingMode}>
                      Both home visits and online
                    </RadioOption>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                    Bio <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 300))}
                    placeholder="Tell students about your experience and teaching style"
                    rows={4}
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: '1.5px solid #E2DDD8', borderRadius: 'var(--radius-md)',
                      fontSize: '16px', color: 'var(--color-black)',
                      background: 'var(--color-white)', outline: 'none',
                      resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.5,
                    }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {bio.length}/300
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button fullWidth loading={submitting} onClick={handleTeacherSubmit}>
                  Submit Application
                </Button>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--color-gray)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                textAlign: 'center',
              }}>
                Your profile will be reviewed by our team before you can start accepting students. This usually takes 1–2 business days.
              </div>
            </>
          )}

          {/* ── STEP 4: OTP Verification ── */}
          {step === 4 && (
            <>
              <StepIndicator step={4} totalSteps={totalSteps} />

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '64px', height: '64px',
                  background: role === 'teacher' ? 'var(--color-gray)' : '#FDF5F0',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {role === 'teacher' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )}
                </div>

                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', marginBottom: '8px' }}>
                  {role === 'teacher' ? 'Application submitted!' : 'Account created!'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>
                  We sent a verification code to your phone
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                    Enter OTP
                  </label>
                  <OTPInput value={otp} onChange={setOtp} error={otpError} />
                </div>

                <Button fullWidth loading={verifying} onClick={handleVerifyOTP}>
                  {role === 'teacher' ? 'Verify Phone' : 'Verify and Continue'}
                </Button>

                {role === 'teacher' && (
                  <div style={{
                    padding: '16px',
                    background: 'var(--color-gray)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.6,
                    textAlign: 'center',
                  }}>
                    After verification, your profile will go under review. We'll notify you on WhatsApp once approved.
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
