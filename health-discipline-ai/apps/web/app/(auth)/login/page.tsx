'use client';

import { Suspense, useState, useRef, useCallback } from 'react';
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

type LoginMode = 'phone' | 'email';
type OtpStep = 'phone-input' | 'otp-input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';
  const { login, loginWithOtp, loginWithSocial } = useAuth();

  const [mode, setMode] = useState<LoginMode>('phone');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone-input');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      initRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth, phone, recaptchaVerifierRef.current!,
      );
      confirmationRef.current = confirmation;
      setOtpStep('otp-input');
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
    await handleSendOtp();
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !confirmationRef.current) return;
    setError('');
    setLoading(true);
    try {
      const credential = await confirmationRef.current.confirm(otp);
      const firebaseIdToken = await credential.user.getIdToken();
      const result = await loginWithOtp(firebaseIdToken);

      if (result.needsRegistration) {
        // New user — phone verified but needs to complete registration
        router.push('/register/payer?verified=true&phone=' + encodeURIComponent(phone));
      } else {
        router.push('/dashboard');
      }
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseIdToken = await result.user.getIdToken();
      const response = await loginWithSocial(firebaseIdToken, 'google');
      if (response.isNewUser) {
        router.push('/onboarding/patient-info');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const firebaseIdToken = await result.user.getIdToken();
      const response = await loginWithSocial(firebaseIdToken, 'apple');
      if (response.isNewUser) {
        router.push('/onboarding/patient-info');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Apple sign-in failed. Please try again.');
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to monitor your family&apos;s health</p>
        </div>
        <Card className="glass shadow-card">
          {mode === 'phone' ? (
            <CardContent className="space-y-4 pt-6">
              {sessionExpired && (
                <div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-lg">
                  Your session has expired. Please sign in again.
                </div>
              )}
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}

              {otpStep === 'phone-input' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    className="w-full rounded-lg"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </>
              )}

              {otpStep === 'otp-input' && (
                <>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      OTP sent to <span className="font-medium text-foreground">{phone}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setOtpStep('phone-input'); setOtp(''); setError(''); }}
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
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
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
                </>
              )}
            </CardContent>
          ) : (
            <form onSubmit={handleEmailLogin}>
              <CardContent className="space-y-4 pt-6">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">Password</label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </CardContent>
            </form>
          )}
          <CardFooter className="flex flex-col gap-3 pb-6">
            {/* Social login divider and buttons */}
            <div className="w-full flex items-center gap-3 pt-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 border-t" />
            </div>
            <div className="w-full flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={handleGoogleLogin}
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
                onClick={handleAppleLogin}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </Button>
            </div>
            <div className="w-full border-t pt-4">
              {mode === 'phone' ? (
                <p className="text-sm text-muted-foreground text-center">
                  Hospital admin?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('email'); setError(''); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in with email
                  </button>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Family member?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('phone'); setError(''); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in with phone
                  </button>
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{' '}
              <Link href="/register/payer" className="text-primary hover:underline font-medium">
                Sign up as Family
              </Link>
              {' or '}
              <Link href="/register/hospital" className="text-primary hover:underline font-medium">
                Hospital
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
