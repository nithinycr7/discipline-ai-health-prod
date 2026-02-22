'use client';

import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithPhoneNumber, signInWithPopup, ConfirmationResult } from 'firebase/auth';
import { auth, RecaptchaVerifier, googleProvider, appleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';

type Step = 'info' | 'otp';

function PayerRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alreadyVerified = searchParams.get('verified') === 'true';
  const prefilledPhone = searchParams.get('phone') || '';
  const { loginWithOtp, loginWithSocial } = useAuth();

  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState({
    phone: prefilledPhone || '+91',
    name: '',
    location: '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const initRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) return;
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      initRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth, form.phone, recaptchaVerifierRef.current!,
      );
      confirmationRef.current = confirmation;
      setStep('otp');
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtp('');
    recaptchaVerifierRef.current = null;
    // Re-trigger OTP send
    setLoading(true);
    try {
      initRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth, form.phone, recaptchaVerifierRef.current!,
      );
      confirmationRef.current = confirmation;
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  // Complete registration when user already verified phone from login page
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Get fresh ID token from existing Firebase session
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Phone verification expired. Please try again.');
        router.push('/login');
        return;
      }
      const firebaseIdToken = await currentUser.getIdToken();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await loginWithOtp(firebaseIdToken, {
        name: form.name,
        location: form.location,
        timezone: timezone || 'Asia/Kolkata',
      });

      router.push('/onboarding/patient-info');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !confirmationRef.current) return;
    setError('');
    setLoading(true);
    try {
      const credential = await confirmationRef.current.confirm(otp);
      const firebaseIdToken = await credential.user.getIdToken();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await loginWithOtp(firebaseIdToken, {
        name: form.name,
        location: form.location,
        timezone: timezone || 'Asia/Kolkata',
      });

      router.push('/onboarding/patient-info');
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please try again.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);
    try {
      const authProvider = provider === 'google' ? googleProvider : appleProvider;
      const result = await signInWithPopup(auth, authProvider);
      const firebaseIdToken = await result.user.getIdToken();
      const response = await loginWithSocial(firebaseIdToken, provider);
      if (response.isNewUser) {
        router.push('/onboarding/patient-info');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || `${provider === 'google' ? 'Google' : 'Apple'} sign-up failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div id="recaptcha-container" />
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[400px] translate-y-1/4 -translate-x-1/4 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set Up Daily Wellness Check-ins</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account to start knowing how your parent is really doing</p>
        </div>
        <Card className="glass shadow-card">
          {step === 'info' ? (
            <form onSubmit={alreadyVerified ? handleCompleteRegistration : handleSendOtp}>
              <CardContent className="space-y-4 pt-6">
                {alreadyVerified && (
                  <div className="p-3 text-sm text-primary bg-primary/10 rounded-lg text-center">
                    Phone verified! Just fill in your details to complete signup.
                  </div>
                )}
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">Your Name</label>
                  <Input
                    id="name"
                    placeholder="e.g., Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                {!alreadyVerified && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <PhoneInput
                      value={form.phone}
                      onChange={(phone) => setForm({ ...form, phone })}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">We&apos;ll send an OTP to verify this number</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="location">Country</label>
                  <select
                    id="location"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  >
                    <option value="">Select country</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? (alreadyVerified ? 'Creating Account...' : 'Sending OTP...')
                    : (alreadyVerified ? 'Create Account' : 'Send OTP & Continue')
                  }
                </Button>
                {/* Social signup divider and buttons */}
                <div className="w-full flex items-center gap-3">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-muted-foreground">or sign up with</span>
                  <div className="flex-1 border-t" />
                </div>
                <div className="w-full flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => handleSocialSignup('google')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => handleSocialSignup('apple')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4 pt-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  OTP sent to <span className="font-medium text-foreground">{form.phone}</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setStep('info'); setOtp(''); setError(''); }}
                  className="text-xs text-primary hover:underline"
                >
                  Change number
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Enter 6-digit OTP</label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                className="w-full rounded-lg"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Creating Account...' : 'Verify & Create Account'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {resendTimer > 0 ? (
                  <>Resend OTP in {resendTimer}s</>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function PayerRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PayerRegisterForm />
    </Suspense>
  );
}
