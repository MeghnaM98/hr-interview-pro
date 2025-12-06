'use client';

import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type Event, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { AdminBooking } from './admin-dashboard';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales
});

const statusColors: Record<string, string> = {
  PENDING: '#facc15',
  CONFIRMED: '#22c55e',
  COMPLETED: '#94a3b8',
  CANCELLED: '#f87171'
};

interface CalendarEvent extends Event {
  resource: AdminBooking;
}

interface Props {
  bookings: AdminBooking[];
  onSelectBooking: (booking: AdminBooking) => void;
}

export function AdminCalendar({ bookings, onSelectBooking }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  const events = useMemo<CalendarEvent[]>(() => {
    return bookings.map((booking) => {
      const start = new Date(booking.scheduledAt);
      const end = addMinutes(start, booking.duration ?? 45);
      return {
        title: `${booking.name} · ${booking.status}`,
        start,
        end,
        resource: booking
      };
    });
  }, [bookings]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
      <Calendar
        localizer={localizer}
        events={events}
        view={currentView}
        date={currentDate}
        views={['month', 'week', 'day']}
        style={{ height: 700 }}
        onSelectEvent={(event) => onSelectBooking(event.resource)}
        onNavigate={(date) => setCurrentDate(date)}
        onView={(nextView) => setCurrentView(nextView)}
        eventPropGetter={(event) => {
          const color = statusColors[event.resource.status] || '#3b82f6';
          return {
            style: {
              backgroundColor: color,
              borderRadius: '12px',
              border: 'none',
              color: event.resource.status === 'PENDING' ? '#0f172a' : '#fff'
            }
          };
        }}
      />
    </div>
  );
}
