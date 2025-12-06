'use client';

import { useMemo, useState, useTransition } from 'react';
import { deleteBookingFile } from '@/app/admin/actions';
import { cn } from '@/lib/utils';
import { AdminCalendar } from './admin-calendar';
import { BookingDialog } from './booking-dialog';

export type AdminBooking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
  meetingLink?: string | null;
  duration?: number | null;
  resumePath?: string | null;
  jdPath?: string | null;
  scheduledAt: string;
  createdAt: string;
  slotLabel: string;
};

type FileType = 'resume' | 'jd';

const statusBadges: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  CONFIRMED: 'bg-emerald-100 text-emerald-900',
  COMPLETED: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-rose-100 text-rose-700'
};

export function AdminDashboard({ bookings }: { bookings: AdminBooking[] }) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingDelete, startDeleteTransition] = useTransition();

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [bookings]);

  const handleManage = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handleDeleteFile = (bookingId: string, fileType: FileType) => {
    startDeleteTransition(async () => {
      const result = await deleteBookingFile(bookingId, fileType);
      setActionMessage(result.message);
    });
  };

  return (
    <div className="min-h-screen bg-warm-slate pb-16">
      <div className="section-shell space-y-6">
        <header className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Admin</p>
            <h1 className="font-display text-4xl text-slate-900">Booking Operations</h1>
            <p className="text-slate-600">Toggle between list and calendar views to manage upcoming HR interviews.</p>
          </div>
          <div className="inline-flex self-start rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
            {(['list', 'calendar'] as const).map((mode) => (
              <button
                key={mode}
                className={cn(
                  'rounded-full px-4 py-2 transition',
                  view === mode ? 'bg-brand-primary text-white shadow' : 'text-slate-500'
                )}
                onClick={() => setView(mode)}
              >
                {mode === 'list' ? 'List View' : 'Calendar View'}
              </button>
            ))}
          </div>
          {actionMessage && <p className="text-sm text-slate-500">{actionMessage}</p>}
        </header>

        {view === 'list' ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-warm-sand text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Meeting</th>
                  <th className="px-6 py-3">Files</th>
                  <th className="px-6 py-3">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-warm-sand/60">
                    <td className="px-6 py-4 text-slate-600">{booking.slotLabel}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{booking.name}</div>
                      <div className="text-xs text-slate-500">{booking.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{booking.course}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.phone}</td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', statusBadges[booking.status] ?? 'bg-slate-200 text-slate-700')}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.meetingLink ? (
                        <a href={booking.meetingLink} target="_blank" rel="noreferrer" className="text-brand-primary underline">
                          Join link
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <FileBadge
                        label="Resume"
                        exists={Boolean(booking.resumePath)}
                        onDelete={() => handleDeleteFile(booking.id, 'resume')}
                        disabled={pendingDelete}
                      />
                      <FileBadge
                        label="JD"
                        exists={Boolean(booking.jdPath)}
                        onDelete={() => handleDeleteFile(booking.id, 'jd')}
                        disabled={pendingDelete}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button className="button-secondary px-3 py-1 text-xs" onClick={() => handleManage(booking)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminCalendar bookings={sortedBookings} onSelectBooking={handleManage} />
        )}
      </div>

      <BookingDialog booking={selectedBooking} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function FileBadge({ label, exists, onDelete, disabled }: { label: string; exists: boolean; onDelete: () => void; disabled: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={exists ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
      {exists ? (
        <button onClick={onDelete} disabled={disabled} className="text-rose-600 underline">
          Delete file
        </button>
      ) : (
        <span className="text-slate-300">—</span>
      )}
    </div>
  );
}
