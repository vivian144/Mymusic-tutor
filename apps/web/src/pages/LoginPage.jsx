import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Input, PhoneInput, OTPInput } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

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

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState('otp');
  const [otpStep, setOtpStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setSendingOTP(true);
    try {
      await auth.sendOTP(phone);
      setOtpStep('otp');
      setCountdown(30);
      toast.success('OTP sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    setOtpError('');
    setVerifyingOTP(true);
    try {
      const res = await auth.loginWithOTP(phone, otp);
      login(res.data.user, res.data.token);
      toast.success('Logged in!');
      navigate(res.data.user.role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    setOtpError('');
    setSendingOTP(true);
    try {
      await auth.sendOTP(phone);
      setCountdown(30);
      toast.success('OTP resent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const onEmailLogin = async (data) => {
    setLoading(true);
    try {
      const res = await auth.login(data.email, data.password);
      login(res.data.user, res.data.token);
      toast.success('Logged in!');
      navigate(res.data.user.role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await auth.loginWithGoogle();
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      toast.error('Google sign-in is unavailable right now.');
    }
  };

  const maskedPhone = phone.length === 10
    ? `+91 XXXXXX${phone.slice(-4)}`
    : `+91 ${phone}`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <BrandPanel />}

      <div style={{
        flex: 1,
        background: 'var(--color-off-white)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '32px 16px' : '48px 32px',
      }}>
        {isMobile && (
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-black)' }}>
              MyMusic
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-brown)' }}>
              {' '}Tutor
            </span>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '32px',
            color: 'var(--color-black)',
            marginBottom: '8px',
          }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '32px' }}>
            Log in to your account
          </p>

          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            border: '1.5px solid #E2DDD8',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '24px',
            background: 'var(--color-white)',
          }}>
            {[
              { key: 'otp', label: 'Phone OTP' },
              { key: 'email', label: 'Email & Password' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  border: 'none',
                  background: activeTab === key ? 'var(--color-brown)' : 'transparent',
                  color: activeTab === key ? 'var(--color-white)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.18s ease, color 0.18s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Phone OTP tab */}
          {activeTab === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {otpStep === 'phone' ? (
                <>
                  <PhoneInput
                    label="Phone number"
                    value={phone}
                    onChange={setPhone}
                    error={phoneError}
                    placeholder="98765 43210"
                  />
                  <Button fullWidth loading={sendingOTP} onClick={handleSendOTP}>
                    Send OTP
                  </Button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    OTP will be sent to your phone via SMS
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    background: 'var(--color-gray)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                  }}>
                    OTP sent to {maskedPhone}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-black)',
                      marginBottom: '8px',
                    }}>
                      Enter OTP
                    </label>
                    <OTPInput value={otp} onChange={setOtp} error={otpError} />
                  </div>

                  <Button fullWidth loading={verifyingOTP} onClick={handleVerifyOTP}>
                    Verify OTP
                  </Button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    {countdown > 0 ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Resend OTP in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={sendingOTP}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: 0,
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setOtpStep('phone'); setOtp(''); setOtpError(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-brown)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        padding: 0,
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Change number
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Email & Password tab */}
          {activeTab === 'email' && (
            <form
              onSubmit={handleSubmit(onEmailLogin)}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
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
                  placeholder="Your password"
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: '14px', color: 'var(--color-brown)', fontWeight: 500 }}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" fullWidth loading={isSubmitting}>
                Log in
              </Button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2DDD8' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#E2DDD8' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              height: '44px',
              background: 'var(--color-white)',
              border: '1.5px solid #E2DDD8',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              color: 'var(--color-black)',
              transition: 'border-color 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#BCBCBC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2DDD8'; }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-brown)', fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
