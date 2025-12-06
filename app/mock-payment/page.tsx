'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { processMockPayment } from '@/app/actions/payment';

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MockPaymentClient />
    </Suspense>
  );
}

function MockPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const amount = Number(searchParams.get('amount') ?? '0');
  const packageName = decodeURIComponent(searchParams.get('package') ?? 'Selected Package');

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!bookingId) {
    router.replace('/booking?error=missing_booking');
    return null;
  }

  const handleSubmit = (status: 'SUCCESS' | 'FAILURE') => {
    if (status === 'SUCCESS' && !/^\d{4}$/.test(otp)) {
      setError('Please enter any 4-digit OTP');
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await processMockPayment(bookingId, status);
      if (status === 'SUCCESS' && result.success) {
        router.replace(`/booking/success?bookingId=${bookingId}`);
      } else {
        router.replace('/booking?error=payment_failed');
      }
    });
  };

  return (
    <section className="min-h-screen bg-slate-100 py-16 font-sans">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 shadow-2xl">
        <header className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">SecurePay Gateway</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Bank Authentication</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Lock className="h-4 w-4" /> Secure Transaction
          </div>
        </header>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <SummaryRow label="Merchant" value="HR Interview Pro" />
          <SummaryRow label="Package" value={packageName} />
          <SummaryRow label="Transaction ID" value={`TXN-${bookingId.slice(0, 8).toUpperCase()}`} />
          <p className="flex items-baseline justify-between text-sm text-slate-600">
            <span>Amount</span>
            <span className="text-2xl font-bold text-slate-900">₹{amount.toFixed(2)}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">Scan QR to Pay via UPI</p>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
            alt="Mock UPI QR"
            className="mt-4 h-40 w-40 rounded-lg border border-slate-200 bg-white p-2"
          />
          <p className="mt-2 text-xs text-slate-500">Open any UPI app to scan and pay.</p>
        </div>

        <div className="mt-8 space-y-3">
          <label className="text-sm font-medium text-slate-700">
            Enter One-Time Password (OTP)
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder="1234"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-lg tracking-widest"
            />
          </label>
          <p className="text-xs text-slate-500">Do not close or refresh this window while the transaction is in progress.</p>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit('SUCCESS')}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" /> Approve Payment
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit('FAILURE')}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel Transaction
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">© SecurePay India • Verified by Visa & Mastercard SecureCode</p>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </p>
  );
}

function LoadingState() {
  return (
    <section className="min-h-screen bg-slate-100 py-16 font-sans">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="text-sm text-slate-600">Loading SecurePay gateway…</p>
      </div>
    </section>
  );
}
