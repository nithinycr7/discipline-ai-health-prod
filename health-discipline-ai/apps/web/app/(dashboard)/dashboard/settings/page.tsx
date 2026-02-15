'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/use-auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input defaultValue={user?.name} className="rounded-lg" />
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
            <Input defaultValue={user?.timezone} disabled className="rounded-lg" />
          </div>
          <Button disabled={saving} className="rounded-lg">{saving ? 'Saving...' : 'Save Changes'}</Button>
        </CardContent>
      </Card>

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
            <input type="checkbox" defaultChecked className="rounded h-4 w-4 accent-primary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Weekly summary</p>
              <p className="text-sm text-muted-foreground">Comprehensive report every Sunday</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded h-4 w-4 accent-primary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Missed medicine alerts</p>
              <p className="text-sm text-muted-foreground">Immediate alert when critical medicine is missed</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded h-4 w-4 accent-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Visit the billing page to manage your subscription, change plans, or cancel.
          </p>
          <Button variant="outline" className="mt-4 rounded-lg">Manage Subscription</Button>
        </CardContent>
      </Card>

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
