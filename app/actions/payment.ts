'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { sendBookingNotification } from '@/lib/mailer';

export async function processMockPayment(bookingId: string, status: 'SUCCESS' | 'FAILURE') {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  if (status === 'SUCCESS') {
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentId: booking.paymentId ?? `mock_${Date.now()}`,
        orderId: booking.orderId ?? `mock-${bookingId}`
      }
    });

    await sendBookingNotification({
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      course: updated.course,
      scheduledAt: updated.scheduledAt ?? new Date(),
      packageType: updated.packageType
    }).catch((error) => console.error('Mock payment email failed', error));

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'PAYMENT_FAILED' }
  });
  revalidatePath('/admin');
  return { success: false };
}
