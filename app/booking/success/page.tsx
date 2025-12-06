import Link from 'next/link';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface SuccessParams {
  searchParams: { bookingId?: string };
}

export default async function BookingSuccessPage({ searchParams }: SuccessParams) {
  const bookingId = searchParams.bookingId;
  if (!bookingId) {
    return <ErrorState message="Missing booking reference." />;
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return <ErrorState message="We could not find that booking." />;
  }

  if (booking.status !== 'CONFIRMED') {
    return <ErrorState message="Your payment is still pending. Please try again." />;
  }

  return (
    <section className="section-shell text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-3xl border border-emerald-100 bg-white p-10 shadow-2xl">
        <CheckCircle className="h-14 w-14 text-emerald-500" />
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-500">Payment Confirmed</p>
          <h1 className="font-display text-3xl text-slate-900">Thank you, {booking.name}!</h1>
          <p className="mt-3 text-sm text-slate-600">
            We received your booking for <span className="font-semibold text-slate-900">{booking.packageType.replace('_', ' ')}</span>. Your
            confirmation ID is <span className="font-mono text-emerald-700">{booking.id.slice(0, 8).toUpperCase()}</span>.
          </p>
        </div>
        <Link href="/" className="button-primary">
          Back to Home
        </Link>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="section-shell text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-3xl border border-rose-100 bg-white p-10 shadow-2xl">
        <AlertTriangle className="h-14 w-14 text-rose-500" />
        <div>
          <h1 className="font-display text-3xl text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600">{message}</p>
        </div>
        <Link href="/booking" className="button-secondary">
          Try Again
        </Link>
      </div>
    </section>
  );
}
