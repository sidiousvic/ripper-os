import Link from "next/link";
import "../globals.css";

export default function AboutPage() {
  return <main className="about-page">
      <header className="topbar"><Link className="brand" href="/" aria-label="Ripper OS home"><span className="brand-mark"><img src="/brand/ripper-os-logo.png" alt="" width="38" height="38" /></span><span>Ripper OS</span></Link><nav><Link href="/">Back to dashboard</Link></nav><a className="data-pill donate-button" href="https://donate.stripe.com/bJe8wQ18J4so1wSdrKfjG00" target="_blank" rel="noreferrer">Donate</a></header>
    <section className="section shell about-intro"><div className="about-copy"><p className="eyebrow accent">User guide</p><h1>Ripper OS</h1>
    </div></section>
    <section className="section shell about-prose">
      <h2>What Ripper OS does</h2>
      <p>Ripper OS parses your selected MacroFactor export to calculate sessions, sets, reps, load, volume, progress histories, attendance, gaps, and training-load intensity. The original file is not retained after parsing. The dashboard helps you see the story in your archive instead of scanning a spreadsheet.</p>
      <p>The upload is the first layer. Charts and exercise exploration work without an OpenAI account. If you connect an API key, the second layer asks OpenAI to turn the calculated summary into plain-language insights and practical programming prompts. Raw workbook rows are not sent to OpenAI.</p>
      <h2>How to export from MacroFactor</h2>
      <ol><li>Open MacroFactor and tap <strong>More</strong>.</li><li>Under <strong>Data Management</strong>, tap <strong>Data Export</strong>.</li><li>Choose <strong>Granular Export</strong> for workout detail. Select workout log or exercise data, then tap <strong>Export</strong>.</li><li>With <strong>Quick Export</strong>, choose a time period and include MacroFactor Workouts data.</li><li>Save the spreadsheet, then upload the CSV or XLSX file in Ripper OS. CSV is the simplest format.</li></ol>
      <p>MacroFactor may offer Exercises, Muscle Groups, Gym Profiles, nutrition, and other datasets. Ripper OS currently uses workout rows. CSV provides exercise progress and attendance; muscle-group views require a compatible workbook export containing muscle data.</p>
      <h2>MacroFactor Workouts CSV schema</h2>
      <p>Keep the original header names. One row represents a recorded set or workout entry.</p>
      <div className="schema-card schema-inline"><p><code>Date</code> — required; the workout date.</p><p><code>Exercise</code> — required; the exercise name.</p><p><code>Weight (kg)</code> — recommended; load used for load and volume.</p><p><code>Reps</code> — recommended; repetitions for the set.</p><p><code>Workout Duration</code> — optional; session duration when present.</p></div>
      <p>Extra columns such as Workout ID, Workout, Set Type, Notes, Distance, or Duration are allowed but not required.</p>
      <h2>Using the dashboard</h2>
      <ol><li>Upload your export; the check mark confirms it loaded.</li><li>Use Progress to search every exercise and open its chart.</li><li>Use Consistency for monthly sessions, gaps, and attendance. Brighter squares mean higher daily load relative to that upload.</li><li>Use Highlights, Muscles, and Workhorses when those sections have enough data. Empty sections are intentionally hidden.</li><li>Use Insights to request AI-generated summaries.</li></ol>
      <h2>Connecting OpenAI</h2>
      <p>OpenAI access is optional. Select <strong>Connect OpenAI</strong>, paste an API key, and connect. Ripper OS verifies the key before marking it connected. The key stays only in memory for the current browser session and is not saved to local storage. It is sent to the Ripper OS server only to verify the connection and request an insight on your behalf. API usage is billed by OpenAI separately from ChatGPT, so review your API billing limits.</p>
      <p>To create a key, sign in at <a href="https://platform.openai.com/" target="_blank" rel="noreferrer">platform.openai.com</a>, open API keys, create a secret key, copy it once, and paste it into Ripper OS. Never share the key or commit it to GitHub. Without OpenAI, charts still work.</p>
      <h2>Privacy and limitations</h2><p>Your normalized rendered analysis and generated insights can be kept in this browser for sharing and later visits; the original workbook and API key are never stored. Ripper OS is a training-data visualization tool, not medical advice. Uploads are limited to 25 MB, CSV exports do not provide muscle-group analysis, and comparisons are only as reliable as the names, units, and logging consistency in the export.</p>
    </section>
    <footer className="shell footer"><p><a href="https://github.com/sidiousvic/ripper-os/issues/new?title=Bug%3A%20&body=%23%23%20What%20happened%3F%0A%0A%23%23%20How%20can%20we%20reproduce%20it%3F%0A%0A%23%23%20Browser%20and%20device%0A" target="_blank" rel="noreferrer">Report a bug</a></p><p className="muted">© All Rights Reserved.</p></footer>
  </main>;
}
