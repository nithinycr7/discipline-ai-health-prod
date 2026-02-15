'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'kn', name: 'Kannada' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'en', name: 'English' },
];

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Arthritis', 'Thyroid', 'Cholesterol',
];

export default function PatientInfoPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    preferredName: '',
    age: '',
    phone: '',
    preferredLanguage: 'hi',
    digitalTier: 2,
    healthConditions: [] as string[],
    hasGlucometer: false,
    hasBPMonitor: false,
    preferredVoiceGender: 'female' as 'male' | 'female',
  });

  const toggleCondition = (condition: string) => {
    setForm((prev) => ({
      ...prev,
      healthConditions: prev.healthConditions.includes(condition)
        ? prev.healthConditions.filter((c) => c !== condition)
        : [...prev.healthConditions, condition],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const patientData = {
        ...form,
        age: parseInt(form.age),
      };

      const patient = await patientsApi.create(patientData, token!);
      const patientId = patient._id || patient.id;
      router.push(`/dashboard/patients/${patientId}/medicines/add?onboarding=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border/50">
        <CardHeader>
          <CardTitle>Add Your Parent</CardTitle>
          <CardDescription>Step {step} of 3</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent's Full Name</label>
                <Input
                  placeholder="e.g., Ramesh Sharma"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What does your family call them?
                </label>
                <Input
                  placeholder='e.g., "Bauji", "Amma", "Papa"'
                  value={form.preferredName}
                  onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Our AI will use this name in every call
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Language</label>
                <div className="grid grid-cols-4 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      className={`p-2 text-sm rounded border transition-colors ${
                        form.preferredLanguage === lang.code
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setForm({ ...form, preferredLanguage: lang.code })}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Health Conditions</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((condition) => (
                    <button
                      key={condition}
                      className={`p-3 text-sm rounded border transition-colors text-left ${
                        form.healthConditions.includes(condition.toLowerCase())
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleCondition(condition.toLowerCase())}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
              {form.healthConditions.includes('diabetes') && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.hasGlucometer}
                    onChange={(e) => setForm({ ...form, hasGlucometer: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">Has a glucometer at home</label>
                </div>
              )}
              {form.healthConditions.includes('hypertension') && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.hasBPMonitor}
                    onChange={(e) => setForm({ ...form, hasBPMonitor: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm">Has a BP monitor at home</label>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Voice</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Which voice should the AI use when calling {form.preferredName || 'your parent'}?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(['female', 'male'] as const).map((gender) => (
                    <button
                      key={gender}
                      className={`p-4 rounded border text-center transition-colors ${
                        form.preferredVoiceGender === gender
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setForm({ ...form, preferredVoiceGender: gender })}
                    >
                      <p className="font-medium capitalize">{gender}</p>
                      <p className="text-xs mt-1 opacity-80">
                        {gender === 'female' ? 'Recommended' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Digital Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 2, label: 'WhatsApp' },
                    { value: 1, label: 'Feature Phone' },
                    { value: 0, label: 'No Phone' },
                  ].map((tier) => (
                    <button
                      key={tier.value}
                      className={`p-3 text-sm rounded border transition-colors ${
                        form.digitalTier === tier.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setForm({ ...form, digitalTier: tier.value })}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Patient Profile'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
