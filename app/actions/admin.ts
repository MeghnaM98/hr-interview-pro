'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { sendBookingNotification, sendBookingUpdateNotification } from '@/lib/mailer';
import { getQuestionBankStoragePath } from '@/lib/paths';

export async function getContactMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function markMessageAsRead(id: string) {
  await prisma.contactMessage.update({
    where: { id },
    data: { status: 'READ' }
  });
  revalidatePath('/admin');
}

export async function deleteMessage(id: string) {
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath('/admin');
}

export async function getTestimonials() {
  return prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function toggleTestimonialVisibility(id: string) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) return;
  await prisma.testimonial.update({
    where: { id },
    data: { isVisible: !testimonial.isVisible }
  });
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteTestimonial(id: string) {
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath('/admin');
  revalidatePath('/');
}

const testimonialSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  content: z.string().min(10),
  rating: z.coerce.number().min(1).max(5).default(5)
});

export async function createTestimonial(formData: FormData) {
  const parsed = testimonialSchema.safeParse({
    name: formData.get('name'),
    role: formData.get('role'),
    content: formData.get('content'),
    rating: formData.get('rating')
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? 'Invalid testimonial data' };
  }

  await prisma.testimonial.create({ data: parsed.data });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true, message: 'Testimonial added successfully.' };
}

export async function getFinancialReport() {
  const transactions = await prisma.booking.findMany({
    where: { status: 'CONFIRMED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      paymentId: true,
      stripeSessionId: true,
      name: true,
      email: true,
      packageType: true,
      amountPaid: true,
      createdAt: true
    }
  });

  const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.amountPaid ?? 0), 0);

  return {
    totalRevenue,
    transactions: transactions.map((txn) => ({
      ...txn,
      paymentRef: txn.paymentId ?? txn.stripeSessionId ?? `mock-${txn.id.slice(0, 6)}`
    }))
  };
}

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
    bookingId: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    course: booking.course,
    scheduledAt: booking.scheduledAt,
    status: booking.status,
    meetingLink: booking.meetingLink,
    packageType: booking.packageType,
    amountPaid: booking.amountPaid
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
      bookingId: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      course: booking.course,
      scheduledAt: booking.scheduledAt ?? new Date(),
      packageType: booking.packageType,
      amountPaid: booking.amountPaid
    });
    return { success: true, message: 'Question bank sent successfully.' };
  } catch (error) {
    console.error('Failed to resend question bank', error);
    return { success: false, message: 'Unable to resend question bank. Try again.' };
  }
}

export async function uploadQuestionBankPdf(formData: FormData): Promise<ActionResponse> {
  const file = formData.get('questionBank');
  if (!file || typeof file === 'string' || typeof (file as Blob).arrayBuffer !== 'function') {
    return { success: false, message: 'Please select a PDF file to upload.' };
  }

  const pdf = file as File;
  if (pdf.type && pdf.type !== 'application/pdf') {
    return { success: false, message: 'Only PDF files are allowed.' };
  }
  if (pdf.size === 0) {
    return { success: false, message: 'The uploaded file is empty.' };
  }
  const MAX_SIZE = 10 * 1024 * 1024;
  if (pdf.size > MAX_SIZE) {
    return { success: false, message: 'Please upload a PDF smaller than 10 MB.' };
  }

  const targetPath = getQuestionBankStoragePath();
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const buffer = Buffer.from(await pdf.arrayBuffer());
  await fs.writeFile(targetPath, buffer);

  revalidatePath('/admin');
  return { success: true, message: 'Question bank PDF updated successfully.' };
}
