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
  scheduledAt: z.date({ required_error: 'Please select a date and time' })
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

function extractFile(value: FormDataEntryValue | null, label: string) {
  if (!value || typeof value === 'string' || typeof (value as Blob).arrayBuffer !== 'function') {
    throw new Error(`${label} file is required.`);
  }

  return value as Blob & { name?: string; size: number };
}

export async function submitBooking(formData: FormData) {
  try {
    const scheduledAtInput = formData.get('scheduledAt');
    const scheduledDate = scheduledAtInput ? new Date(String(scheduledAtInput)) : undefined;

    if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      throw new Error('Please choose a valid date and time.');
    }

    const parsed = bookingSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      course: formData.get('course'),
      scheduledAt: scheduledDate
    });

    const paymentInfo = extractPaymentFields(formData);

    const resumeFile = extractFile(formData.get('resume'), 'Resume');
    const jdFile = extractFile(formData.get('jd'), 'JD');

    const [resumePath, jdPath] = await Promise.all([
      persistUpload(resumeFile, 'resume'),
      persistUpload(jdFile, 'jd')
    ]);

    await prisma.booking.create({
      data: {
        ...parsed,
        resumePath,
        jdPath,
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
        scheduledAt: parsed.scheduledAt
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
