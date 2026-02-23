import { redirect } from 'next/navigation';

export default function HospitalsPage() {
  redirect('/?audience=hospital');
}
