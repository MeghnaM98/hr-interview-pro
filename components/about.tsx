export function About() {
  return (
    <section id="about" className="section-shell">
      <div className="glass-panel grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Founder Story</p>
          <h2 className="mt-3 font-display text-3xl text-slate-900">MBA in Business Analytics, Ex-HR Coordinator</h2>
          <p className="mt-4 text-slate-600">
            I helped orchestrate 200+ HR rounds across multiple campuses. HR Interview Pro blends that playbook with warm, personalised coaching
            so you get the truth about where you stand before facing recruiters.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-lg">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Students Trained</p>
            <p className="text-3xl font-bold text-slate-900">400+</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Specialisations</p>
            <p className="text-lg text-slate-800">MBA, BBA, BTech placements</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Response time</p>
            <p className="text-lg text-slate-800">Under 24 hours</p>
          </div>
        </div>
      </div>
    </section>
  );
}
