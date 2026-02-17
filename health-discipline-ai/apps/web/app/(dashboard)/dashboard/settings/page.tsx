'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/use-auth';
import { usersApi } from '@/lib/api/users';
import { patientsApi } from '@/lib/api/patients';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    weekly: true,
    daily: false,
    alerts: true,
  });
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if ((user as any).notificationPreferences) {
        setNotifications((user as any).notificationPreferences);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    patientsApi.list(token).then((res) => setPatients(res.data || res || [])).catch(() => {});
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await usersApi.updateMe({ name, notificationPreferences: notifications }, token);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {user?.phone ? 'WhatsApp Number' : 'Email'}
            </label>
            <Input defaultValue={user?.phone || user?.email} disabled className="rounded-lg" />
            <p className="text-xs text-muted-foreground">Contact support to change this</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Timezone</label>
            <Input defaultValue={user?.timezone || 'Asia/Kolkata'} disabled className="rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Post-call reports</p>
              <p className="text-sm text-muted-foreground">Get WhatsApp message after each call</p>
            </div>
            <button
              onClick={() => handleToggle('daily')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.daily ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.daily ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Weekly summary</p>
              <p className="text-sm text-muted-foreground">Comprehensive report every Sunday</p>
            </div>
            <button
              onClick={() => handleToggle('weekly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.weekly ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.weekly ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Missed medicine alerts</p>
              <p className="text-sm text-muted-foreground">Immediate alert when critical medicine is missed</p>
            </div>
            <button
              onClick={() => handleToggle('alerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.alerts ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.alerts ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="rounded-lg">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved successfully</span>}
      </div>

      {/* Subscription */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>Current plan status for your patients</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="space-y-3">
              {patients.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">{p.preferredName}</p>
                    <p className="text-xs text-muted-foreground">{p.fullName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.subscriptionStatus === 'active' ? 'success' : p.subscriptionStatus === 'trial' ? 'secondary' : 'warning'}>
                      {p.subscriptionStatus || 'trial'}
                    </Badge>
                    {p.trialEndsAt && p.subscriptionStatus === 'trial' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Trial ends {new Date(p.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No patients added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Export Data</p>
              <p className="text-sm text-muted-foreground">Download all your data (DPDP Act compliance)</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg">Export</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" className="rounded-lg">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
