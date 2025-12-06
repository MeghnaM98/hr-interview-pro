'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { updateBookingAction } from '@/app/admin/actions';
import type { AdminBooking } from './admin-dashboard';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

type DialogState = {
  scheduledAt: string;
  duration: number;
  meetingLink: string;
  status: string;
};

interface Props {
  booking: AdminBooking | null;
  open: boolean;
  onClose: () => void;
}

function toInputValue(dateISO: string) {
  const date = new Date(dateISO);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function BookingDialog({ booking, open, onClose }: Props) {
  const [dialogState, setDialogState] = useState<DialogState>({
    scheduledAt: '',
    duration: 45,
    meetingLink: '',
    status: 'PENDING'
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (booking) {
      setDialogState({
        scheduledAt: toInputValue(booking.scheduledAt),
        duration: booking.duration ?? 45,
        meetingLink: booking.meetingLink ?? '',
        status: booking.status
      });
      setActionMessage(null);
    }
  }, [booking]);

  const meetingLinkPreview = useMemo(() => {
    if (!dialogState.meetingLink) {
      return null;
    }
    const href = dialogState.meetingLink.startsWith('http')
      ? dialogState.meetingLink
      : `https://${dialogState.meetingLink}`;
    return href;
  }, [dialogState.meetingLink]);

  if (!open || !booking) {
    return null;
  }

  const handleSave = () => {
    if (!dialogState.scheduledAt) {
      setActionMessage('Please select a date and time.');
      return;
    }
    const formData = new FormData();
    formData.append('bookingId', booking.id);
    formData.append('scheduledAt', new Date(dialogState.scheduledAt).toISOString());
    formData.append('duration', String(dialogState.duration));
    formData.append('status', dialogState.status);
    formData.append('meetingLink', dialogState.meetingLink.trim());

    startTransition(async () => {
      const result = await updateBookingAction(formData);
      setActionMessage(result.message);
      if (result.success) {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-primary">Booking Details</p>
            <h3 className="font-display text-2xl text-slate-900">{booking.name}</h3>
            <p className="text-sm text-slate-500">{booking.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="text-sm font-medium text-slate-700">
            Slot
            <input
              type="datetime-local"
              value={dialogState.scheduledAt}
              onChange={(e) => setDialogState((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Duration (mins)
            <input
              type="number"
              min={15}
              max={180}
              value={dialogState.duration}
              onChange={(e) => setDialogState((prev) => ({ ...prev, duration: Number(e.target.value) }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Meeting Link
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              value={dialogState.meetingLink}
              onChange={(e) => setDialogState((prev) => ({ ...prev, meetingLink: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
            {meetingLinkPreview && (
              <a
                href={meetingLinkPreview}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center text-sm text-brand-primary underline"
              >
                Open meeting link
              </a>
            )}
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={dialogState.status}
              onChange={(e) => setDialogState((prev) => ({ ...prev, status: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {actionMessage && (
          <p className={`mt-4 text-sm ${actionMessage.includes('successfully') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {actionMessage}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="button-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isPending} className="button-primary px-4 py-2 text-sm">
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
