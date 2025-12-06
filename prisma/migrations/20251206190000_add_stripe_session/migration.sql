-- Add stripeSessionId column
ALTER TABLE "Booking" ADD COLUMN "stripeSessionId" TEXT;

-- Add unique index if values present
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_stripeSessionId_key" ON "Booking"("stripeSessionId");
