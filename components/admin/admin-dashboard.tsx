'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  deleteBookingFile,
  markMessageAsRead,
  deleteMessage,
  toggleTestimonialVisibility,
  deleteTestimonial,
  createTestimonial
} from '@/app/admin/actions';
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

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};

export type AdminTestimonial = {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  isVisible: boolean;
  createdAt: string;
};

type FileType = 'resume' | 'jd';

type Tab = 'bookings' | 'messages' | 'testimonials';

const statusBadges: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  CONFIRMED: 'bg-emerald-100 text-emerald-900',
  COMPLETED: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-rose-100 text-rose-700'
};

const messageBadges: Record<string, string> = {
  UNREAD: 'bg-emerald-100 text-emerald-900',
  READ: 'bg-slate-200 text-slate-600',
  REPLIED: 'bg-blue-100 text-blue-800'
};

export function AdminDashboard({
  bookings,
  messages,
  testimonials
}: {
  bookings: AdminBooking[];
  messages: AdminMessage[];
  testimonials: AdminTestimonial[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [subView, setSubView] = useState<'list' | 'calendar'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingDelete, startDeleteTransition] = useTransition();
  const [messageTransitionPending, startMessageTransition] = useTransition();
  const [testimonialTransitionPending, startTestimonialTransition] = useTransition();
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', content: '', rating: 5 });
  const [testimonialMessage, setTestimonialMessage] = useState<string | null>(null);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [bookings]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages]);

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

  const handleMarkAsRead = (id: string) => {
    startMessageTransition(async () => {
      await markMessageAsRead(id);
      setActionMessage('Message marked as read.');
    });
  };

  const handleDeleteMessage = (id: string) => {
    startMessageTransition(async () => {
      await deleteMessage(id);
      setActionMessage('Message deleted.');
    });
  };

  const handleToggleVisibility = (id: string) => {
    startTestimonialTransition(async () => {
      await toggleTestimonialVisibility(id);
      setActionMessage('Testimonial visibility updated.');
    });
  };

  const handleDeleteTestimonial = (id: string) => {
    startTestimonialTransition(async () => {
      await deleteTestimonial(id);
      setActionMessage('Testimonial deleted.');
    });
  };

  const handleCreateTestimonial = () => {
    const { name, role, content, rating } = testimonialForm;
    const formData = new FormData();
    formData.append('name', name);
    formData.append('role', role);
    formData.append('content', content);
    formData.append('rating', String(rating));

    startTestimonialTransition(async () => {
      const result = await createTestimonial(formData);
      setTestimonialMessage(result.message);
      if (result.success) {
        setShowTestimonialDialog(false);
        setTestimonialForm({ name: '', role: '', content: '', rating: 5 });
      }
    });
  };

  const renderBookings = () => (
    <>
      <div className="inline-flex self-start rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
        {(['list', 'calendar'] as const).map((mode) => (
          <button
            key={mode}
            className={cn('rounded-full px-4 py-2 transition', subView === mode ? 'bg-brand-primary text-white shadow' : 'text-slate-500')}
            onClick={() => setSubView(mode)}
          >
            {mode === 'list' ? 'List View' : 'Calendar View'}
          </button>
        ))}
      </div>

      {subView === 'list' ? (
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
                    <FileBadge label="Resume" exists={Boolean(booking.resumePath)} onDelete={() => handleDeleteFile(booking.id, 'resume')} disabled={pendingDelete} />
                    <FileBadge label="JD" exists={Boolean(booking.jdPath)} onDelete={() => handleDeleteFile(booking.id, 'jd')} disabled={pendingDelete} />
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
    </>
  );

  const renderMessages = () => (
    <div className="space-y-3">
      {sortedMessages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
      {sortedMessages.map((message) => {
        const isOpen = expandedMessage === message.id;
        return (
          <div key={message.id} className="rounded-2xl border border-slate-200 bg-white shadow">
            <button
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpandedMessage(isOpen ? null : message.id)}
            >
              <div>
                <p className="font-semibold text-slate-900">{message.name}</p>
                <p className="text-xs text-slate-500">{message.email}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{new Date(message.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className={cn('rounded-full px-3 py-1 font-semibold', messageBadges[message.status] ?? 'bg-slate-200 text-slate-600')}>
                  {message.status}
                </span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-700">
                <p className="whitespace-pre-line leading-relaxed">{message.message}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    className="button-primary px-4 py-2 text-xs"
                    disabled={message.status !== 'UNREAD' && message.status !== 'REPLIED' ? messageTransitionPending : false}
                    onClick={() => handleMarkAsRead(message.id)}
                  >
                    Mark as Read
                  </button>
                  <button
                    className="button-secondary border-rose-200 text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    Delete Message
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTestimonials = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-slate-900">Testimonials</h2>
        <button className="button-primary text-sm" onClick={() => setShowTestimonialDialog(true)}>
          Add New Testimonial
        </button>
      </div>
      {testimonials.length === 0 && <p className="text-sm text-slate-500">No testimonials captured yet.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </div>
              <span className="text-sm font-semibold text-amber-500">★ {testimonial.rating}</span>
            </div>
            <p className="mt-4 text-sm text-slate-700">{testimonial.content}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                className={cn(
                  'rounded-full px-4 py-1 text-xs font-semibold',
                  testimonial.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                )}
                onClick={() => handleToggleVisibility(testimonial.id)}
              >
                {testimonial.isVisible ? 'Visible' : 'Hidden'}
              </button>
              <button className="text-rose-600 underline" onClick={() => handleDeleteTestimonial(testimonial.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-slate pb-16">
      <div className="section-shell space-y-6">
        <header className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Admin</p>
            <h1 className="font-display text-4xl text-slate-900">Operations Console</h1>
            <p className="text-slate-600">Bookings, quick guidance, and testimonials — all in one workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            {(
              [
                { id: 'bookings', label: 'Bookings' },
                { id: 'messages', label: 'Quick Guidance' },
                { id: 'testimonials', label: 'Testimonials' }
              ] as { id: Tab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                className={cn('rounded-full border px-4 py-2', activeTab === tab.id ? 'border-brand-primary bg-white text-brand-primary shadow' : 'border-transparent text-slate-500')}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {actionMessage && <p className="text-sm text-slate-500">{actionMessage}</p>}
        </header>

        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'testimonials' && renderTestimonials()}
      </div>

      <BookingDialog booking={selectedBooking} open={dialogOpen} onClose={() => setDialogOpen(false)} />

      {showTestimonialDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-slate-900">Add Testimonial</h3>
              <button onClick={() => setShowTestimonialDialog(false)} className="text-slate-500">✕</button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <label className="block font-medium text-slate-700">
                Name
                <input
                  type="text"
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="block font-medium text-slate-700">
                Role / Course
                <input
                  type="text"
                  value={testimonialForm.role}
                  onChange={(e) => setTestimonialForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="block font-medium text-slate-700">
                Content
                <textarea
                  rows={4}
                  value={testimonialForm.content}
                  onChange={(e) => setTestimonialForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="block font-medium text-slate-700">
                Rating (1-5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              {testimonialMessage && <p className="text-sm text-slate-500">{testimonialMessage}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="button-secondary px-4 py-2 text-sm" onClick={() => setShowTestimonialDialog(false)}>
                Cancel
              </button>
              <button
                className="button-primary px-4 py-2 text-sm"
                disabled={testimonialTransitionPending}
                onClick={handleCreateTestimonial}
              >
                {testimonialTransitionPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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
