'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';

export default function PayerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: '', name: '', location: '', timezone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await authApi.registerPayer({ ...form, timezone });
      localStorage.setItem('token', response.token);
      router.push('/onboarding/patient-info');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
        <h1 className="text-2xl font-bold tracking-tight">Set Up Health Monitoring</h1>
        <p className="text-muted-foreground text-sm mt-1">Create your account to start monitoring your parent&apos;s medicines</p>
      </div>
      <Card className="glass shadow-card">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
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
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="phone">WhatsApp Number</label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">We'll send daily reports to this number</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="location">Your Location</label>
              <Input
                id="location"
                placeholder="e.g., Chicago, USA"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Continue to Parent Setup'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
