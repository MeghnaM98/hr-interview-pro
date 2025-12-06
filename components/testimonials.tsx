import { prisma } from '@/lib/prisma';

export async function Testimonials() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  const fallback = [
    {
      content: 'The mock interview felt exactly like a real HR round. I knew what to fix before my final panel.',
      name: 'MBA Student'
    },
    {
      content: 'The ₹50 question bank was gold. The STAR templates made my answers crisp.',
      name: 'BBA Student'
    },
    {
      content: 'Detailed notes on my tone and stories helped me ace my placement within a week.',
      name: 'BTech Student'
    }
  ];

  const list = (testimonials.length > 0 ? testimonials : fallback).map((item, index) => ({
    id: 'id' in item ? item.id : `fallback-${index}`,
    name: item.name,
    content: item.content
  }));

  return (
    <section id="testimonials" className="section-shell">
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Social proof</p>
          <h2 className="mt-3 font-display text-3xl text-slate-900">Students who trusted the process</h2>
          <p className="mt-3 text-slate-600">Swipe through quick wins from recent cohorts.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {list.map((testimonial) => (
            <div key={testimonial.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
              <p className="text-lg text-slate-800">“{testimonial.content}”</p>
              <p className="mt-4 text-sm font-semibold text-brand-primary">— {testimonial.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
