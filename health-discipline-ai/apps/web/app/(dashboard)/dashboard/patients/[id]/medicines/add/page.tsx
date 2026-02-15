'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { medicinesApi } from '@/lib/api/medicines';

const TIMINGS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

const FOOD_PREFS = [
  { value: 'before', label: 'Before Food' },
  { value: 'after', label: 'After Food' },
  { value: 'with', label: 'With Food' },
  { value: 'anytime', label: 'Anytime' },
];

interface MedicineEntry {
  brandName: string;
  dosage: string;
  timing: string;
  foodPreference: string;
  nicknames: string[];
  linkedCondition: string;
  isCritical: boolean;
}

const emptyMedicine: MedicineEntry = {
  brandName: '',
  dosage: '',
  timing: 'morning',
  foodPreference: 'after',
  nicknames: [],
  linkedCondition: '',
  isCritical: false,
};

export default function AddMedicinePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const { token } = useAuth();

  const [medicines, setMedicines] = useState<MedicineEntry[]>([{ ...emptyMedicine }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const current = medicines[currentIndex];

  const updateCurrent = (updates: Partial<MedicineEntry>) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === currentIndex ? { ...m, ...updates } : m))
    );
  };

  const addNickname = () => {
    if (nickname.trim() && !current.nicknames.includes(nickname.trim())) {
      updateCurrent({ nicknames: [...current.nicknames, nickname.trim()] });
      setNickname('');
    }
  };

  const removeNickname = (n: string) => {
    updateCurrent({ nicknames: current.nicknames.filter((nn) => nn !== n) });
  };

  const addAnotherMedicine = () => {
    setMedicines((prev) => [...prev, { ...emptyMedicine }]);
    setCurrentIndex(medicines.length);
    setNickname('');
  };

  const saveMedicine = async (med: MedicineEntry) => {
    if (!token || !id) return;
    await medicinesApi.create(id as string, med, token);
  };

  const handleSaveAndAddMore = async () => {
    if (!current.brandName.trim()) {
      setError('Please enter the medicine name');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await saveMedicine(current);
      setSavedCount((c) => c + 1);
      addAnotherMedicine();
    } catch (err: any) {
      setError(err.message || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setError('');
    setSaving(true);
    try {
      // Save current if it has a name
      if (current.brandName.trim()) {
        await saveMedicine(current);
        setSavedCount((c) => c + 1);
      }
      if (isOnboarding) {
        router.push('/dashboard');
      } else {
        router.push(`/dashboard/patients/${id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={isOnboarding ? 'min-h-screen flex items-center justify-center bg-muted p-4' : ''}>
      <Card className={isOnboarding ? 'w-full max-w-lg' : ''}>
        <CardHeader>
          <CardTitle>
            {isOnboarding ? 'Add Medicines' : 'Add Medicine'}
          </CardTitle>
          <CardDescription>
            {savedCount > 0
              ? `${savedCount} medicine${savedCount > 1 ? 's' : ''} saved. Add more or finish.`
              : isOnboarding
              ? "Enter your parent's medicines one by one"
              : 'Add a new medicine to the schedule'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Medicine Name *</label>
            <Input
              placeholder="e.g., Telma 40, Metformin 500"
              value={current.brandName}
              onChange={(e) => updateCurrent({ brandName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dosage</label>
            <Input
              placeholder="e.g., 40mg, 500mg"
              value={current.dosage}
              onChange={(e) => updateCurrent({ dosage: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">When to take</label>
            <div className="grid grid-cols-4 gap-2">
              {TIMINGS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`p-2 text-sm rounded border transition-colors ${
                    current.timing === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => updateCurrent({ timing: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Food preference</label>
            <div className="grid grid-cols-4 gap-2">
              {FOOD_PREFS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`p-2 text-sm rounded border transition-colors ${
                    current.foodPreference === f.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => updateCurrent({ foodPreference: f.value })}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nickname <span className="text-muted-foreground">(what your parent calls it)</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder='e.g., "BP wali goli"'
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNickname())}
              />
              <Button type="button" variant="outline" onClick={addNickname}>
                Add
              </Button>
            </div>
            {current.nicknames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {current.nicknames.map((n) => (
                  <Badge key={n} variant="secondary" className="cursor-pointer" onClick={() => removeNickname(n)}>
                    {n} x
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Related condition</label>
            <Input
              placeholder="e.g., diabetes, hypertension"
              value={current.linkedCondition}
              onChange={(e) => updateCurrent({ linkedCondition: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCritical"
              checked={current.isCritical}
              onChange={(e) => updateCurrent({ isCritical: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isCritical" className="text-sm">
              This is a critical medicine (alert if missed)
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (isOnboarding && savedCount === 0) {
                router.back();
              } else if (isOnboarding) {
                router.push('/dashboard');
              } else {
                router.push(`/dashboard/patients/${id}`);
              }
            }}
          >
            {savedCount > 0 ? 'Done' : 'Back'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveAndAddMore} disabled={saving || !current.brandName.trim()}>
              {saving ? 'Saving...' : 'Save & Add More'}
            </Button>
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? 'Saving...' : savedCount > 0 ? 'Finish' : 'Save & Finish'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
