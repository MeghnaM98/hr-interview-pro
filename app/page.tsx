export const dynamic = 'force-dynamic';

import { Hero } from '@/components/hero';
import { About } from '@/components/about';
import { Process } from '@/components/process';
import { Pricing } from '@/components/pricing';
import { Testimonials } from '@/components/testimonials';
import { BookingForm } from '@/components/booking-form';
import { ContactCard } from '@/components/contact-card';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Hero />
      <About />
      <Process />
      <Pricing />
      <Testimonials />
      <div className="section-shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <BookingForm />
        <ContactCard />
      </div>
      <footer className="section-shell border-t border-slate-200 text-sm text-slate-600">
        <div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} HR Interview Pro. Mock HR Interview • Placement Guidance • JD Feedback.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="#pricing" className="hover:text-slate-900">
              Services
            </a>
            <a href="#booking" className="hover:text-slate-900">
              Book Now
            </a>
            <a href="mailto:hello@hrinterviewpro.com" className="hover:text-slate-900">
              hello@hrinterviewpro.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
