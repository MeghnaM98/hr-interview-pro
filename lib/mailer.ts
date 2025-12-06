import nodemailer from 'nodemailer';

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

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    })
  : null;

interface BookingNotificationPayload {
  name: string;
  email: string;
  phone: string;
  course: string;
  scheduledAt: Date;
}

export async function sendBookingNotification(payload: BookingNotificationPayload) {
  if (!MY_ADMIN_EMAIL || !transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Email notification skipped: Missing MY_ADMIN_EMAIL or SMTP config.');
    }
    return;
  }

  const formattedDate = payload.scheduledAt.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const textBody = `New HR Interview booking\n\nName: ${payload.name}\nCourse: ${payload.course}\nPhone: ${payload.phone}\nEmail: ${payload.email}\nScheduled: ${formattedDate}`;

  await transporter.sendMail({
    to: MY_ADMIN_EMAIL,
    from: SMTP_FROM || MY_ADMIN_EMAIL,
    subject: `New HR Mock Interview Booking – ${payload.name}`,
    text: textBody,
    html: `
      <h2>New Booking</h2>
      <p><strong>Name:</strong> ${payload.name}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Phone:</strong> ${payload.phone}</p>
      <p><strong>Course:</strong> ${payload.course}</p>
      <p><strong>Preferred Slot:</strong> ${formattedDate}</p>
    `
  });
}

interface BookingUpdatePayload extends BookingNotificationPayload {
  status: string;
  meetingLink?: string | null;
}

export async function sendBookingUpdateNotification(payload: BookingUpdatePayload) {
  if (!transporter) {
    return;
  }

  const recipients = [payload.email];
  if (MY_ADMIN_EMAIL) {
    recipients.unshift(MY_ADMIN_EMAIL);
  }

  const formattedDate = payload.scheduledAt.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  await transporter.sendMail({
    to: recipients.join(', '),
    from: SMTP_FROM || MY_ADMIN_EMAIL || SMTP_USER,
    subject: `Booking updated – ${payload.name} (${payload.status})`,
    html: `
      <h2>Booking Updated</h2>
      <p><strong>Name:</strong> ${payload.name}</p>
      <p><strong>Status:</strong> ${payload.status}</p>
      <p><strong>Preferred Slot:</strong> ${formattedDate}</p>
      <p><strong>Meeting Link:</strong> ${payload.meetingLink ? `<a href="${payload.meetingLink}">${payload.meetingLink}</a>` : 'Not set'}</p>
    `
  });
}
