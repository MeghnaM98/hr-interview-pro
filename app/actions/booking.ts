'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { persistUpload } from '@/lib/storage';

const bookingSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(8, 'Phone number is required'),
    course: z.string().min(2, 'Course is required'),
    packageType: z.enum(['MOCK_INTERVIEW', 'PDF_ONLY', 'BUNDLE']),
    scheduledAt: z.date().optional()
  })
  .superRefine((data, ctx) => {
    if (data.packageType !== 'PDF_ONLY' && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please choose a preferred slot for your mock interview.'
      });
    }
  });

const PACKAGE_CONFIG = {
  MOCK_INTERVIEW: { label: 'Mock Interview Only', amount: 100 },
  PDF_ONLY: { label: 'Question Bank PDF Only', amount: 50 },
  BUNDLE: { label: 'Ultimate Bundle', amount: 130 }
} as const;

type PackageKey = keyof typeof PACKAGE_CONFIG;

type ActionResponse = { success: boolean; url?: string; message?: string };

function extractFile(value: FormDataEntryValue | null) {
  if (!value || typeof value === 'string' || typeof (value as Blob).arrayBuffer !== 'function') {
    return null;
  }
  return value as Blob & { name?: string; size: number };
}

export async function createBooking(formData: FormData): Promise<ActionResponse> {
  try {
    const packageType = String(formData.get('packageType') ?? 'MOCK_INTERVIEW') as PackageKey;
    const scheduledAtInput = formData.get('scheduledAt');
    const scheduledDate = scheduledAtInput ? new Date(String(scheduledAtInput)) : undefined;

    const parsed = bookingSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      course: formData.get('course'),
      packageType,
      scheduledAt: packageType === 'PDF_ONLY' ? undefined : scheduledDate
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const resumeFile = extractFile(formData.get('resume'));
    const jdFile = extractFile(formData.get('jd'));

    if (packageType !== 'PDF_ONLY' && (!resumeFile || !jdFile)) {
      return { success: false, message: 'Resume and JD are required for mock interview bookings.' };
    }

    const [resumePath, jdPath] = await Promise.all([
      resumeFile ? persistUpload(resumeFile, 'resume') : Promise.resolve<string | null>(null),
      jdFile ? persistUpload(jdFile, 'jd') : Promise.resolve<string | null>(null)
    ]);

    const packageConfig = PACKAGE_CONFIG[packageType];

    const booking = await prisma.booking.create({
      data: {
        ...parsed.data,
        resumePath,
        jdPath,
        scheduledAt: parsed.data.packageType === 'PDF_ONLY' ? new Date() : parsed.data.scheduledAt,
        amountPaid: packageConfig.amount,
        status: 'PENDING'
      }
    });

    const redirectUrl = `/mock-payment?bookingId=${booking.id}&amount=${packageConfig.amount}&package=${encodeURIComponent(
      packageConfig.label
    )}`;

    return { success: true, url: redirectUrl };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Something went wrong.' };
  }
}
