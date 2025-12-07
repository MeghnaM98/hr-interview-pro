import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { promises as fs } from 'fs';
import { getQuestionBankFallbackPath, getQuestionBankFilename, getQuestionBankStoragePath } from './paths';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MY_ADMIN_EMAIL,
  SMTP_FROM
} = process.env;

const hasSmtpConfig = Boolean(SMTP_HOST && SMTP_PORT);

type SMTPOptionsWithFamily = SMTPTransport.Options & { family?: number };

const smtpOptions: SMTPOptionsWithFamily | null = hasSmtpConfig
  ? {
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      // Force IPv4 to prevent timeouts in Docker/Render environments
      family: 4,
      // Avoid hanging forever on unreachable SMTP hosts
      connectionTimeout: 10_000,
      socketTimeout: 10_000
    }
  : null;

// Fallback to STARTTLS on 587 if the configured port (often 465) is blocked in the host
const fallbackOptions: SMTPOptionsWithFamily | null =
  smtpOptions && smtpOptions.port !== 587
    ? {
        ...smtpOptions,
        port: 587,
        secure: false,
        requireTLS: true
      }
    : null;

const transporters: Transporter[] = [smtpOptions, fallbackOptions]
  .filter(Boolean)
  .map((opts) => nodemailer.createTransport(opts as SMTPOptionsWithFamily));

async function sendWithFallback(mailOptions: SendMailOptions) {
  if (!transporters.length) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Email notification skipped: Missing SMTP config.');
    }
    return;
  }

  let lastError: unknown;
  for (const transport of transporters) {
    try {
      await transport.sendMail(mailOptions);
      return;
    } catch (error) {
      lastError = error;
      console.error('SMTP send failed on transporter, trying fallback if available', error);
    }
  }

  throw lastError ?? new Error('SMTP send failed');
}

const QUESTION_PACKAGES = ['PDF_ONLY', 'BUNDLE'];
const PACKAGE_LABELS: Record<string, string> = {
  PDF_ONLY: 'Question Bank PDF',
  MOCK_INTERVIEW: 'Mock Interview',
  BUNDLE: 'Mock Interview + PDF Bundle'
};

interface BookingNotificationPayload {
  bookingId?: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  scheduledAt: Date;
  packageType?: string;
  amountPaid?: number | null;
}

async function getPdfAttachment(packageType?: string) {
  if (!packageType || !QUESTION_PACKAGES.includes(packageType)) {
    return [];
  }

  const candidates = [getQuestionBankStoragePath(), getQuestionBankFallbackPath()];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return [
        {
          filename: getQuestionBankFilename(),
          path: candidate,
          contentType: 'application/pdf'
        }
      ];
    } catch {
      // continue searching
    }
  }

  console.warn('Question bank PDF not found at expected paths:', candidates);
  return [];
}

function formatCurrency(amount?: number | null) {
  if (!amount && amount !== 0) {
    return 'To be updated';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function buildInvoiceHtml(payload: BookingNotificationPayload) {
  if (!payload.packageType && !payload.amountPaid) {
    return '';
  }
  const packageLabel = payload.packageType ? PACKAGE_LABELS[payload.packageType] ?? payload.packageType : 'Package';
  return `
    <table style="margin-top:12px;border:1px solid #e2e8f0;border-radius:12px;padding:12px;font-size:14px;">
      <tr>
        <td style="font-weight:600;padding:4px 8px;">Booking ID</td>
        <td style="padding:4px 8px;">${payload.bookingId ?? 'Pending'}</td>
      </tr>
      <tr>
        <td style="font-weight:600;padding:4px 8px;">Package</td>
        <td style="padding:4px 8px;">${packageLabel}</td>
      </tr>
      <tr>
        <td style="font-weight:600;padding:4px 8px;">Amount</td>
        <td style="padding:4px 8px;">${formatCurrency(payload.amountPaid)}</td>
      </tr>
      <tr>
        <td style="font-weight:600;padding:4px 8px;">Status</td>
        <td style="padding:4px 8px;">Paid</td>
      </tr>
    </table>
  `;
}

function buildInvoiceText(payload: BookingNotificationPayload) {
  if (!payload.packageType && !payload.amountPaid) {
    return '';
  }
  const packageLabel = payload.packageType ? PACKAGE_LABELS[payload.packageType] ?? payload.packageType : 'Package';
  return [
    '',
    'Invoice Summary',
    `  Booking ID: ${payload.bookingId ?? 'Pending'}`,
    `  Package: ${packageLabel}`,
    `  Amount: ${formatCurrency(payload.amountPaid)}`,
    '  Status: Paid'
  ].join('\n');
}

function buildFulfilmentMessage(payload: BookingNotificationPayload) {
  if (payload.packageType === 'PDF_ONLY') {
    return 'Attached is your Question Bank PDF. You can start preparing right away!';
  }
  if (payload.packageType === 'BUNDLE') {
    return 'Your mock interview slot is confirmed and the Question Bank PDF is attached for preparation. Meeting link updates will follow once assigned.';
  }
  return 'Your mock interview slot is confirmed. We will share the Google Meet/Zoom link shortly after the coaching team finalises it.';
}

export async function sendBookingNotification(payload: BookingNotificationPayload) {
  const recipients = [payload.email];
  if (MY_ADMIN_EMAIL) {
    recipients.push(MY_ADMIN_EMAIL);
  }

  const formattedDate = payload.scheduledAt.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const textBody = [
    `Hi ${payload.name},`,
    '',
    'Thank you for booking HR Interview Pro. Here are your booking details:',
    `• Course / Role: ${payload.course}`,
    `• Phone: ${payload.phone}`,
    `• Preferred Slot: ${formattedDate}`,
    buildInvoiceText(payload),
    '',
    buildFulfilmentMessage(payload),
    '',
    '— HR Interview Pro'
  ]
    .filter(Boolean)
    .join('\n');

  const attachments = await getPdfAttachment(payload.packageType);

  await sendWithFallback({
    to: recipients.join(', '),
    from: SMTP_FROM || MY_ADMIN_EMAIL || SMTP_USER,
    subject: `Booking confirmed – ${payload.name}`,
    text: textBody,
    attachments,
    html: `
      <div style="font-family: 'Plus Jakarta Sans','Inter',system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
        <p>Hi ${payload.name},</p>
        <p>Thank you for trusting HR Interview Pro. Your booking is confirmed with the following details:</p>
        <ul>
          <li><strong>Course / Role:</strong> ${payload.course}</li>
          <li><strong>Phone:</strong> ${payload.phone}</li>
          <li><strong>Preferred Slot:</strong> ${formattedDate}</li>
        </ul>
        ${buildInvoiceHtml(payload)}
        <p style="margin-top:12px;">${buildFulfilmentMessage(payload)}</p>
        <p>If you have any questions, reply to this email and our team will assist you.</p>
        <p style="margin-top:16px;">Warm regards,<br/>HR Interview Pro</p>
      </div>
    `
  });
}

interface BookingUpdatePayload extends BookingNotificationPayload {
  status: string;
  meetingLink?: string | null;
}

export async function sendBookingUpdateNotification(payload: BookingUpdatePayload) {
  const recipients = [payload.email];
  if (MY_ADMIN_EMAIL) {
    recipients.unshift(MY_ADMIN_EMAIL);
  }

  const formattedDate = payload.scheduledAt.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const attachments = await getPdfAttachment(payload.packageType);

  await sendWithFallback({
    to: recipients.join(', '),
    from: SMTP_FROM || MY_ADMIN_EMAIL || SMTP_USER,
    subject: `Booking updated – ${payload.name} (${payload.status})`,
    attachments,
    html: `
      <h2>Booking Updated</h2>
      <p><strong>Name:</strong> ${payload.name}</p>
      <p><strong>Status:</strong> ${payload.status}</p>
      <p><strong>Preferred Slot:</strong> ${formattedDate}</p>
      <p><strong>Meeting Link:</strong> ${payload.meetingLink ? `<a href="${payload.meetingLink}">${payload.meetingLink}</a>` : 'Not set yet – we will follow up shortly.'}</p>
      ${buildInvoiceHtml(payload)}
    `
  });
}
