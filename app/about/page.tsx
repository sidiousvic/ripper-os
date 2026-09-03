import Link from "next/link";
import "../globals.css";

export default function AboutPage() {
  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Ripper OS home">
          <span className="brand-mark"><img src="/brand/ripper-os-logo.png" alt="" width="38" height="38" /></span>
          <span>Ripper OS</span>
        </Link>
        <nav aria-label="About navigation"><Link href="/">Back to dashboard</Link></nav>
        <span className="data-pill">About</span>
      </header>

      <section className="hero shell about-hero">
        <div className="hero-copy">
          <p className="eyebrow accent">About Ripper OS</p>
          <h1>Training, <span>understood.</span></h1>
          <p>Ripper OS turns a MacroFactor workout export into a clear, private training review: progress, consistency, exercise history, and practical opportunities.</p>
        </div>
      </section>

      <section className="section shell about-grid">
        <article className="panel about-card">
          <p className="eyebrow accent">What this is</p>
          <h2>A personal training archive</h2>
          <p>Upload the latest MacroFactor Workouts CSV and the app calculates the summaries behind the dashboard. Your plotted data works without AI.</p>
        </article>
        <article className="panel about-card">
          <p className="eyebrow accent">How it works</p>
          <h2>Upload. Analyze. Explore.</h2>
          <p>The file is parsed in the app, grouped by date and exercise, then transformed into charts and comparison metrics. Raw workout rows are not sent to OpenAI; only calculated summaries are used for optional insights.</p>
        </article>
      </section>

      <section className="section shell about-section">
        <div className="section-heading"><div><p className="eyebrow accent">Prepare your data</p><h2>MacroFactor Workouts CSV schema</h2><p>Export your workouts from MacroFactor as CSV. Keep the header names intact so Ripper OS can recognize each field.</p></div></div>
        <div className="panel schema-card">
          <div className="schema-row schema-head"><strong>Column</strong><strong>Required</strong><strong>Used for</strong></div>
          <div className="schema-row"><code>Date</code><span>Yes</span><span>Session dates and attendance</span></div>
          <div className="schema-row"><code>Exercise</code><span>Yes</span><span>Exercise history and progress charts</span></div>
          <div className="schema-row"><code>Weight (kg)</code><span>Recommended</span><span>Load and volume calculations</span></div>
          <div className="schema-row"><code>Reps</code><span>Recommended</span><span>Set, rep, and volume calculations</span></div>
          <div className="schema-row"><code>Workout Duration</code><span>Optional</span><span>Session duration when present</span></div>
        </div>
        <p className="muted about-note">MacroFactor may include additional columns such as Workout ID, Workout, Set Type, Notes, Distance, or Duration. They are preserved by the export but are not required for the current analysis. CSV exports do not include muscle-group set data, so muscle balance views appear when that data is available in a compatible workbook export.</p>
      </section>

      <footer className="shell footer"><p>Built and distributed by SIDIOUSWARE.</p><p className="muted">MIT sidiousvic All Rights Reserved.</p></footer>
    </main>
  );
}
