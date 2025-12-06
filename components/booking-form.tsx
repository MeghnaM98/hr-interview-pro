'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPaymentOrder, submitBooking } from '@/app/actions';

interface ActionState {
  success: boolean;
  message: string;
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
  };
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const INTERVIEW_PRICE = 100;

export function BookingForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>({ success: false, message: '' });
  const [isPending, startTransition] = useTransition();
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setState({ success: false, message: 'Unable to load Razorpay checkout.' });
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

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
        const orderResult = await createPaymentOrder(INTERVIEW_PRICE);
        if (!orderResult.success || !orderResult.order) {
          throw new Error(orderResult.message ?? 'Unable to start payment. Please try again.');
        }

        if (typeof window === 'undefined' || !window.Razorpay) {
          throw new Error('Payment gateway is not ready. Refresh and try once more.');
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency,
          name: 'HR Interview Pro',
          description: 'Mock Interview Charge',
          order_id: orderResult.order.id,
          prefill: {
            name: String(formData.get('name') ?? ''),
            email: String(formData.get('email') ?? ''),
            contact: String(formData.get('phone') ?? '')
          },
          theme: {
            color: '#3b82f6'
          },
          modal: {
            ondismiss: () => {
              setState({ success: false, message: 'Payment cancelled. Please complete the payment to confirm.' });
            }
          },
          handler: async (response: RazorpaySuccessResponse) => {
            formData.set('razorpay_payment_id', response.razorpay_payment_id);
            formData.set('razorpay_order_id', response.razorpay_order_id);
            formData.set('razorpay_signature', response.razorpay_signature);

            const result = await submitBooking(formData);
            setState(result);
            if (result.success) {
              formEl.reset();
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
          setState({
            success: false,
            message: response?.error?.description ?? 'Payment failed. Please try again or use another method.'
          });
        });
        rzp.open();
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
        <label className="text-sm font-medium text-slate-700">
          Resume Upload (PDF)
          <input type="file" name="resume" accept="application/pdf" required className="mt-1 w-full rounded-2xl border border-dashed border-brand-primary/40 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          JD Upload (PDF)
          <input type="file" name="jd" accept="application/pdf" required className="mt-1 w-full rounded-2xl border border-dashed border-brand-primary/40 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Preferred Slot
          <input type="datetime-local" name="scheduledAt" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <button type="submit" className="button-primary w-full justify-center" disabled={isPending || !scriptReady}>
          {isPending ? 'Processing...' : `Pay ₹${INTERVIEW_PRICE} & Confirm`}
        </button>
        {!scriptReady && <p className="text-center text-xs text-slate-400">Loading payment gateway…</p>}
      </form>
    </div>
  );
}
