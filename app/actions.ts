'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { persistUpload } from '@/lib/storage';
import { sendBookingNotification } from '@/lib/mailer';
import { getRazorpay } from '@/lib/razorpay';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Phone number is required'),
  course: z.string().min(2, 'Course is required'),
  packageType: z.enum(['MOCK_INTERVIEW', 'PDF_ONLY', 'BUNDLE']),
  amountPaid: z.number().int().min(1),
  scheduledAt: z.date().optional()
});

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

type OrderResponse =
  | { success: true; order: { id: string; amount: number; currency: string } }
  | { success: false; message: string };

export async function createPaymentOrder(amountInRupees: number): Promise<OrderResponse> {
  try {
    const safeAmount = Math.max(Math.round(amountInRupees), 1);
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: safeAmount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    return {
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    };
  } catch (error) {
    console.error('Failed to create Razorpay order', error);
    return {
      success: false,
      message: 'Unable to connect to the payment gateway. Please try again later.'
    };
  }
}

function extractPaymentFields(formData: FormData) {
  const paymentId = formData.get('razorpay_payment_id');
  const orderId = formData.get('razorpay_order_id');
  const signature = formData.get('razorpay_signature');

  if (typeof paymentId !== 'string' || typeof orderId !== 'string' || typeof signature !== 'string') {
    throw new Error('Payment confirmation not found. Please retry the checkout.');
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Payment verification is unavailable. Contact support.');
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Payment verification failed. Please contact support with your payment ID.');
  }

  return { paymentId, orderId };
}

function extractFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === 'string' || typeof (value as Blob).arrayBuffer !== 'function') {
    return null;
  }

  return value as Blob & { name?: string; size: number };
}

export async function submitBooking(formData: FormData) {
  try {
    const packageType = String(formData.get('packageType') ?? 'MOCK_INTERVIEW') as 'MOCK_INTERVIEW' | 'PDF_ONLY' | 'BUNDLE';
    const amountPaid = Number(formData.get('amountPaid') ?? 100);

    const scheduledAtInput = formData.get('scheduledAt');
    const scheduledDate = scheduledAtInput ? new Date(String(scheduledAtInput)) : undefined;

    if (packageType !== 'PDF_ONLY' && (!scheduledDate || Number.isNaN(scheduledDate.getTime()))) {
      throw new Error('Please choose a valid date and time.');
    }

    const parsed = bookingSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      course: formData.get('course'),
      packageType,
      amountPaid,
      scheduledAt: packageType === 'PDF_ONLY' ? undefined : scheduledDate
    });

    const paymentInfo = extractPaymentFields(formData);

    const resumeFile = extractFile(formData.get('resume'));
    const jdFile = extractFile(formData.get('jd'));

    if (packageType !== 'PDF_ONLY' && (!resumeFile || !jdFile)) {
      throw new Error('Resume and JD are required for mock interview bookings.');
    }

    const [resumePath, jdPath] = await Promise.all([
      resumeFile ? persistUpload(resumeFile, 'resume') : Promise.resolve<string | null>(null),
      jdFile ? persistUpload(jdFile, 'jd') : Promise.resolve<string | null>(null)
    ]);

    await prisma.booking.create({
      data: {
        ...parsed,
        resumePath,
        jdPath,
        scheduledAt: parsed.packageType === 'PDF_ONLY' ? new Date() : parsed.scheduledAt,
        paymentId: paymentInfo.paymentId,
        orderId: paymentInfo.orderId
      }
    });

    try {
      await sendBookingNotification({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        course: parsed.course,
        scheduledAt: parsed.packageType === 'PDF_ONLY'
          ? new Date()
          : (parsed.scheduledAt as Date),
        packageType: parsed.packageType
      });
    } catch (emailError) {
      console.error('Failed to send booking notification email', emailError);
    }

    revalidatePath('/');

    return { success: true, message: 'Booking confirmed! Check your email for next steps.' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message ?? 'Invalid input' };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Something went wrong.' };
  }
}

export async function submitContact(formData: FormData) {
  try {
    const parsed = contactSchema.parse({
      name: formData.get('contactName'),
      email: formData.get('contactEmail'),
      message: formData.get('contactMessage')
    });

    await Promise.all([
      prisma.contact.create({ data: parsed }),
      prisma.contactMessage.create({ data: parsed })
    ]);
    revalidatePath('/');

    return { success: true, message: 'Thanks for reaching out! We will reply shortly.' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message ?? 'Invalid input' };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Something went wrong.' };
  }
}
