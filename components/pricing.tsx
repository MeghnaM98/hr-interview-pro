const tiers = [
  {
    name: 'Mock Interview',
    price: '₹100',
    description: '30-45 min HR-style video call with JD-based questioning and verbal feedback.',
    perks: ['Real HR scenarios', 'Resume + JD alignment', 'Actionable next steps'],
    badge: 'Most Booked'
  },
  {
    name: 'Question Bank PDF',
    price: '₹50',
    description: '60 HR behavioural & situational questions with STAR answer templates.',
    perks: ['Curated by ex-HR', 'Download instantly', 'Editable templates'],
    badge: 'Student Favorite'
  },
  {
    name: 'Bundle: Mock + PDF',
    price: '₹130',
    description: 'Complete prep pack with the live mock interview plus the full question bank.',
    perks: ['Save ₹20', 'Personalized plan', 'Priority scheduling'],
    badge: 'Best Value'
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="section-shell">
      <div className="space-y-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Pricing & Services</p>
          <h2 className="mt-3 font-display text-3xl text-slate-900">Transparent pricing for students</h2>
          <p className="mt-3 text-slate-600">No hidden fees. Pick what you need and start preparing within 24 hours.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.name} className="relative rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <div className="absolute -top-3 right-6 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                {tier.badge}
              </div>
              <h3 className="font-display text-2xl text-slate-900">{tier.name}</h3>
              <p className="mt-2 text-3xl font-bold text-brand-primary">{tier.price}</p>
              <p className="mt-3 text-sm text-slate-600">{tier.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
