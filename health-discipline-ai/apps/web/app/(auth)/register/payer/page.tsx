'use client';

import { Suspense, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, RecaptchaVerifier } from '@/lib/firebase';
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
  const { loginWithOtp } = useAuth();

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

  const startResendTimer = useCallback(() => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
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
