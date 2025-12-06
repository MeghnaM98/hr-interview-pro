'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { sendBookingNotification, sendBookingUpdateNotification } from '@/lib/mailer';

const bookingUpdateSchema = z.object({
  bookingId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.coerce.number().int().min(15).max(180).default(45),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  meetingLink: z.string().url().optional().or(z.literal('').transform(() => undefined))
});

const uploadRoot = path.resolve(process.env.UPLOAD_DIR || '/data/uploads');

type ActionResponse = { success: boolean; message: string };

export async function updateBookingAction(formData: FormData): Promise<ActionResponse> {
  const data = bookingUpdateSchema.safeParse({
    bookingId: formData.get('bookingId'),
    scheduledAt: formData.get('scheduledAt'),
    duration: formData.get('duration'),
    status: formData.get('status'),
    meetingLink: formData.get('meetingLink')
  });

  if (!data.success) {
    return { success: false, message: data.error.errors[0]?.message ?? 'Invalid input' };
  }

  const { bookingId, scheduledAt, duration, status, meetingLink } = data.data;

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      scheduledAt: new Date(scheduledAt),
      duration,
      status,
      meetingLink: meetingLink ?? null
    }
  });

  await sendBookingUpdateNotification({
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    course: booking.course,
    scheduledAt: booking.scheduledAt,
    status: booking.status,
    meetingLink: booking.meetingLink,
    packageType: booking.packageType
  }).catch((error) => {
    console.error('Booking update email failed', error);
  });

  revalidatePath('/admin');
  revalidatePath('/');

  return { success: true, message: 'Booking updated successfully.' };
}

export async function deleteBookingFile(bookingId: string, fileType: 'resume' | 'jd'): Promise<ActionResponse> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  const targetPath = fileType === 'resume' ? booking.resumePath : booking.jdPath;
  if (!targetPath) {
    return { success: false, message: 'File already removed.' };
  }

  const resolvedTarget = path.resolve(targetPath);
  if (resolvedTarget.startsWith(uploadRoot)) {
    try {
      await fs.unlink(resolvedTarget);
    } catch (error) {
      console.error('Failed to delete file', error);
    }
  }

  if (fileType === 'resume') {
    await prisma.booking.update({ where: { id: bookingId }, data: { resumePath: null } });
  } else {
    await prisma.booking.update({ where: { id: bookingId }, data: { jdPath: null } });
  }

  revalidatePath('/admin');

  return { success: true, message: `${fileType.toUpperCase()} file removed.` };
}

export async function resendQuestionBank(bookingId: string): Promise<ActionResponse> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  if (booking.packageType !== 'PDF_ONLY' && booking.packageType !== 'BUNDLE') {
    return { success: false, message: 'This booking does not include the question bank.' };
  }

  try {
    await sendBookingNotification({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      course: booking.course,
      scheduledAt: booking.scheduledAt ?? new Date(),
      packageType: booking.packageType
    });
    return { success: true, message: 'Question bank sent successfully.' };
  } catch (error) {
    console.error('Failed to resend question bank', error);
    return { success: false, message: 'Unable to resend question bank. Try again.' };
  }
}
