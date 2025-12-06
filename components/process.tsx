const steps = [
  {
    title: 'Book Mock Call (30-45 mins)',
    description: 'Share your JD/resume, choose a slot, and hop on a real HR-style video call.'
  },
  {
    title: 'Get Feedback (Strengths + Red Flags)',
    description: 'Actionable notes across communication, storytelling, and JD alignment within 24 hours.'
  },
  {
    title: 'Practice (Question Bank)',
    description: 'Download the curated 60-question bank with STAR templates to rehearse confidently.'
  }
];

export function Process() {
  return (
    <section id="process" className="section-shell">
      <div className="space-y-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">How it works</p>
          <h2 className="mt-3 font-display text-3xl text-slate-900">A focused 3-step routine</h2>
          <p className="mt-3 text-slate-600">We blend HR rigour with friendly coaching so you walk into placements calm and prepared.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="glass-panel relative flex flex-col gap-4 p-6 text-left"
            >
              <span className="text-sm font-semibold text-brand-primary">Step {index + 1}</span>
              <h3 className="font-display text-xl text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
