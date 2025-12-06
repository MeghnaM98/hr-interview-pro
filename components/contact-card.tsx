'use client';

import { useRef, useState, useTransition } from 'react';
import { CheckCircle2, SendHorizonal } from 'lucide-react';
import { submitContactMessage } from '@/app/actions/contact';

export function ContactCard() {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitContactMessage(formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Message sent! You will hear from us shortly.' });
        formRef.current?.reset();
      } else {
        setFeedback({ type: 'error', message: result.message ?? 'Something went wrong. Please try again.' });
      }
    });
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-brand-primary/10 p-2 text-brand-primary">
          <SendHorizonal className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-slate-900">Need quick guidance?</h3>
          <p className="text-sm text-slate-600">Drop a note and we will revert in under 24 hours.</p>
        </div>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-4">
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {feedback.message}
          </div>
        )}
        <label className="text-sm font-medium text-slate-700">
          Name
          <input name="name" type="text" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Message
          <textarea name="message" rows={4} required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <button type="submit" disabled={isPending} className="button-secondary w-full justify-center">
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
