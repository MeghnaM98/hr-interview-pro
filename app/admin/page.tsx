export const dynamic = 'force-dynamic';

import { promises as fs } from 'fs';
import { prisma } from '@/lib/prisma';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getFinancialReport } from '@/app/actions/admin';
import { getQuestionBankStoragePath } from '@/lib/paths';

const slotFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata'
});

export default async function AdminPage() {
  const [bookings, messages, testimonials, financialReport] = await Promise.all([
    prisma.booking.findMany({
      where: {
        packageType: { not: 'PDF_ONLY' }
      },
      orderBy: { scheduledAt: 'asc' }
    }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } }),
    getFinancialReport()
  ]);

  const questionBankPath = getQuestionBankStoragePath();
  const questionBank = await fs
    .stat(questionBankPath)
    .then((stats) => ({
      exists: true,
      size: stats.size,
      updatedAt: stats.mtime.toISOString()
    }))
    .catch(() => ({
      exists: false,
      size: null,
      updatedAt: null
    }));

  const serializedBookings = bookings.map((booking) => ({
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
    stripeSessionId: booking.stripeSessionId,
    packageType: booking.packageType,
    amountPaid: booking.amountPaid,
    scheduledAt: booking.scheduledAt.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    slotLabel: slotFormatter.format(booking.scheduledAt)
  }));

  const serializedMessages = messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString()
  }));

  const serializedTestimonials = testimonials.map((testimonial) => ({
    ...testimonial,
    createdAt: testimonial.createdAt.toISOString()
  }));

  return (
    <AdminDashboard
      bookings={serializedBookings}
      messages={serializedMessages}
      testimonials={serializedTestimonials}
      financialReport={financialReport}
      questionBank={questionBank}
    />
  );
}
