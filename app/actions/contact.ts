'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { sendBookingNotification } from '@/lib/mailer';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Please share a bit more detail so we can help.')
});

export async function submitContactMessage(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get('name') ?? formData.get('contactName'),
    email: formData.get('email') ?? formData.get('contactEmail'),
    message: formData.get('message') ?? formData.get('contactMessage')
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const { name, email, message } = parsed.data;

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      message,
      status: 'UNREAD'
    }
  });

  await sendBookingNotification({
    name,
    email,
    phone: 'N/A',
    course: 'Quick Guidance',
    scheduledAt: new Date(),
    packageType: 'PDF_ONLY'
  }).catch((error) => console.error('Failed to send contact notification', error));

  revalidatePath('/admin');
  return { success: true };
}
