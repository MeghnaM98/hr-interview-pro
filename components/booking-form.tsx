'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '@/app/actions/booking';
import { cn } from '@/lib/utils';

interface ActionState {
  success: boolean;
  message: string;
}

const PACKAGES = {
  MOCK_INTERVIEW: { label: 'Mock Interview Only', amount: 100, badge: 'Standard' },
  PDF_ONLY: { label: 'Question Bank PDF Only', amount: 50, badge: 'Instant Download' },
  BUNDLE: { label: 'Ultimate Bundle', amount: 130, badge: 'Best Value - Save ₹20' }
} as const;

export function BookingForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ success: false, message: '' });
  const [isPending, startTransition] = useTransition();
  const [selectedPackage, setSelectedPackage] = useState<keyof typeof PACKAGES>('MOCK_INTERVIEW');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ success: false, message: '' });
    const formEl = formRef.current;
    if (!formEl) {
      return;
    }

    if (!formEl.reportValidity()) {
      return;
    }

    const formData = new FormData(formEl);

    startTransition(async () => {
      try {
        formData.set('packageType', selectedPackage);

        const result = await createBooking(formData);
        if (result.success && result.url) {
          formEl.reset();
          router.push(result.url);
        } else if (!result.success && result.message) {
          setState({ success: false, message: result.message });
        }
      } catch (error) {
        setState({
          success: false,
          message: error instanceof Error ? error.message : 'Unable to initiate payment right now.'
        });
      }
    });
  };

  return (
    <div id="booking" className="glass-panel grid gap-8 p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Booking form</p>
        <h2 className="mt-3 font-display text-3xl text-slate-900">Reserve your mock HR slot</h2>
        <p className="mt-4 text-slate-600">
          Upload your resume and JD so we can customise the interview and feedback. Slots are confirmed within 12 hours.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          <li>• Mock interview hosted on Google Meet</li>
          <li>• Feedback summary + next steps in 24 hours</li>
          <li>• Bundle add-on: get the question bank for ₹50</li>
        </ul>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {state.message && (
          <p className={`rounded-2xl px-3 py-2 text-sm ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {state.message}
          </p>
        )}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Select your package</p>
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(PACKAGES) as Array<keyof typeof PACKAGES>).map((pkgKey) => {
              const pkg = PACKAGES[pkgKey];
              const active = selectedPackage === pkgKey;
              return (
                <button
                  key={pkgKey}
                  type="button"
                  onClick={() => setSelectedPackage(pkgKey)}
                  className={cn(
                    'flex h-full flex-col rounded-2xl border p-3 text-left transition',
                    active ? 'border-brand-primary bg-brand-primary/5 shadow' : 'border-slate-200 hover:border-brand-primary/50'
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">{pkg.badge}</span>
                  <span className="mt-1 font-display text-lg text-slate-900">{pkg.label}</span>
                  <span className="text-sm text-slate-600">₹{pkg.amount}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Name
            <input type="text" name="name" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-brand-primary focus:ring-brand-primary" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input type="email" name="email" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-brand-primary focus:ring-brand-primary" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Phone
            <input type="tel" name="phone" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-brand-primary focus:ring-brand-primary" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Course
            <input type="text" name="course" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-brand-primary focus:ring-brand-primary" />
          </label>
        </div>
        {selectedPackage !== 'PDF_ONLY' && (
          <>
            <label className="text-sm font-medium text-slate-700">
              Resume Upload (PDF)
              <input type="file" name="resume" accept="application/pdf" className="mt-1 w-full rounded-2xl border border-dashed border-brand-primary/40 bg-white px-4 py-3 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              JD Upload (PDF)
              <input type="file" name="jd" accept="application/pdf" className="mt-1 w-full rounded-2xl border border-dashed border-brand-primary/40 bg-white px-4 py-3 text-sm" />
            </label>
          </>
        )}
        {selectedPackage !== 'PDF_ONLY' && (
          <label className="text-sm font-medium text-slate-700">
            Preferred Slot
            <input type="datetime-local" name="scheduledAt" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-brand-primary focus:ring-brand-primary" />
          </label>
        )}
        <button type="submit" className="button-primary w-full justify-center" disabled={isPending}>
          {isPending ? 'Processing...' : `Proceed to SecurePay (₹${PACKAGES[selectedPackage].amount})`}
        </button>
        <p className="text-center text-xs text-slate-400">You’ll be redirected to our secure mock gateway to finalize the payment.</p>
      </form>
    </div>
  );
}
