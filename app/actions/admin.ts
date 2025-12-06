'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
