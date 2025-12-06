import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section id="hero" className="section-shell relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-gradient" />
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-primary">
            💼 Trusted by MBA/BTech placement cells
          </span>
          <div>
            <h1 className="font-display text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Ace Your HR Interview With Confidence – Personalized Mock HR Interviews for Students
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Real HR-style practice, JD-based feedback, and curated question banks.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="#booking" className="button-primary">
              Book Mock Interview ₹100
            </Link>
            <Link href="#pricing" className="button-secondary">
              Download Question Bank ₹50
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
            <div>
              Rated 4.9/5 across 200+ mock interviews
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              48-hour turnaround on tailored feedback
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="glass-panel relative p-6">
            <Image
              src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80"
              alt="Student preparing for HR interview"
              width={900}
              height={900}
              className="rounded-2xl object-cover"
              priority
            />
            <div className="absolute -bottom-6 left-1/2 w-52 -translate-x-1/2 rounded-2xl border border-white/50 bg-white/90 p-4 text-center shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Trusted By</p>
              <p className="font-display text-lg text-slate-900">MBA • BTech • BBA</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
