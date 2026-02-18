'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';
import { PhoneInput } from '@/components/ui/phone-input';

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
  const [customCondition, setCustomCondition] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    preferredName: '',
    age: '',
    phone: '+91',
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[400px] translate-y-1/4 -translate-x-1/4 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <Card className="w-full max-w-lg glass shadow-card">
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input
                  type="number"
                  placeholder="72"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <PhoneInput
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Language</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Other condition (e.g., Asthma)"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customCondition.trim()) {
                        e.preventDefault();
                        const val = customCondition.trim().toLowerCase();
                        if (!form.healthConditions.includes(val)) {
                          setForm((prev) => ({ ...prev, healthConditions: [...prev.healthConditions, val] }));
                        }
                        setCustomCondition('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (customCondition.trim()) {
                        const val = customCondition.trim().toLowerCase();
                        if (!form.healthConditions.includes(val)) {
                          setForm((prev) => ({ ...prev, healthConditions: [...prev.healthConditions, val] }));
                        }
                        setCustomCondition('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {form.healthConditions.filter((c) => !CONDITIONS.map((x) => x.toLowerCase()).includes(c)).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.healthConditions.filter((c) => !CONDITIONS.map((x) => x.toLowerCase()).includes(c)).map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground"
                      >
                        {c}
                        <button onClick={() => toggleCondition(c)} className="hover:opacity-70">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
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
                <label className="text-sm font-medium">Parent has access to</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: 'Phone' },
                    { value: 2, label: 'WhatsApp' },
                    { value: 3, label: 'Both' },
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
