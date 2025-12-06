import { prisma } from '@/lib/prisma';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

const slotFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata'
});

export default async function AdminPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: {
      scheduledAt: 'asc'
    }
  });

  const serialized = bookings.map((booking) => ({
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    course: booking.course,
    status: booking.status,
    meetingLink: booking.meetingLink,
    duration: booking.duration,
    resumePath: booking.resumePath,
    jdPath: booking.jdPath,
    scheduledAt: booking.scheduledAt.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    slotLabel: slotFormatter.format(booking.scheduledAt)
  }));

  return <AdminDashboard bookings={serialized} />;
}
