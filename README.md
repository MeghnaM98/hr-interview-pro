# HR Interview Pro

A Next.js 14 App Router platform tailored for students to book personalised HR mock interviews, upload resumes/JDs, and pay securely via Razorpay. Built with Prisma + SQLite (Render persistent disk), Tailwind/Shadcn-inspired UI, and an operations-ready admin workspace with calendar scheduling, file clean-up, and booking notifications.

## Features
- **Student experience**: Hero landing page, process/pitch sections, and a Razorpay-powered booking form that saves resumes/JDs into `/data/uploads`.
- **Payments & verification**: Razorpay order creation, checkout popup, HMAC verification, and persisted payment/order IDs.
- **Admin console**: Basic-auth protected `/admin` with list + calendar views (react-big-calendar), booking edit dialogs (status, slot, meeting link), file delete buttons, and email alerts for updates.
- **Infrastructure**: Prisma schema & migrations, Dockerfile/entrypoint tuned for Render (persistent `/data` volume and `prisma migrate deploy` on boot).

## Tech Stack
- Next.js 14 App Router (TypeScript, Server Actions)
- Tailwind CSS + custom tokens (Inter/Plus Jakarta Sans)
- Prisma ORM + SQLite (file:./prisma/dev.db locally / `/data/sqlite` on Render)
- Razorpay payments, Nodemailer alerts
- React Big Calendar + date-fns for admin scheduling

## Getting Started
### Prerequisites
- Node.js 20+
- npm 10+
- SQLite (bundled) and a writable `/data` directory when deploying on Render

### Installation
```bash
npm install
```

### Environment Variables
Create `.env` (excluded from git) with:
```env
DATABASE_URL="file:./prisma/dev.db"
UPLOAD_DIR="./uploads"            # default fallback to /data/uploads in prod
MY_ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="super-secret"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_SECURE="false"                 # true if using TLS 465
SMTP_FROM="HR Interview Pro <alerts@domain.com>"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```

### Database
```bash
npx prisma migrate dev
```
This creates `prisma/dev.db` and applies the migrations for Bookings & Contacts.

### Development
```bash
npm run dev
```
- Visit `http://localhost:3000`
- Admin dashboard at `/admin` (Basic Auth with `ADMIN_PASSWORD`).

### Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
npm run start
```

## Deployment (Render)
1. Mount a persistent disk at `/data` for uploads + SQLite.
2. Configure environment variables (same as `.env`, but set `DATABASE_URL=file:/data/sqlite/prod.db` and `UPLOAD_DIR=/data/uploads`).
3. Dockerfile already handles multi-stage build, installs prod deps, prepares `/data`, and runs `prisma migrate deploy` via `docker-entrypoint.sh` before starting Next.js (`next start`).

## Admin Operations
- **List & calendar views** toggle via UI chips.
- Clicking an event/row opens the dialog: adjust slot/duration/status, paste meeting link, save to trigger DB update + student/admin email.
- Delete resume/JD files to free disk (updates Prisma + removes from `/data/uploads`).

## Folder Structure
```
app/           # Next.js routes, layouts, server actions
components/    # UI sections and admin widgets
lib/           # Prisma client, storage, mailer, Razorpay helper
prisma/        # Schema + migrations (dev DB ignored via .gitignore)
public/        # Static assets (none yet)
```

## Testing Notes
- Razorpay checkout runs in test mode with test keys.
- File uploads use built-in `File` APIs and store to `UPLOAD_DIR`.
- Basic auth middleware sets `admin_auth` cookie for `/admin` & `/api/admin/*`.

## Roadmap Ideas
- Webhook verification for Razorpay payments
- Automated reminder emails/ICS attachments
- Multi-admin roles with OAuth login
- Analytics dashboard for bookings & revenue

## License
Proprietary (not open-sourced yet). Update this section if you intend to publish under a specific license.
