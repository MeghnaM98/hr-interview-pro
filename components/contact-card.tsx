'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitContact } from '@/app/actions';

interface ActionState {
  success: boolean;
  message: string;
}

const initialState: ActionState = { success: false, message: '' };

function ContactButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button-secondary w-full justify-center" disabled={pending}>
      {pending ? 'Sending...' : 'Send Message'}
    </button>
  );
}

export function ContactCard() {
  const [state, formAction] = useFormState<ActionState>(async (_state, formData) => {
    return submitContact(formData);
  }, initialState);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-2xl text-slate-900">Need quick guidance?</h3>
      <p className="mt-2 text-sm text-slate-600">Drop a note and we will revert in under 24 hours.</p>
      <form action={formAction} className="mt-6 space-y-4">
        {state.message && (
          <p className={`rounded-2xl px-3 py-2 text-sm ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {state.message}
          </p>
        )}
        <label className="text-sm font-medium text-slate-700">
          Name
          <input type="text" name="contactName" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input type="email" name="contactEmail" required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Message
          <textarea name="contactMessage" rows={4} required className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 focus:border-brand-primary focus:ring-brand-primary" />
        </label>
        <ContactButton />
      </form>
    </div>
  );
}
