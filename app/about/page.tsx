import Link from "next/link";
import "../globals.css";

export default function AboutPage() {
  return <main className="about-page">
      <header className="topbar"><Link className="brand" href="/" aria-label="Ripper OS home"><span className="brand-mark"><img src="/brand/ripper-os-logo.png" alt="" width="38" height="38" /></span><span>Ripper OS</span></Link><nav><Link href="/">Back to dashboard</Link></nav><a className="data-pill donate-button" href="https://donate.stripe.com/bJe8wQ18J4so1wSdrKfjG00" target="_blank" rel="noreferrer">Donate</a></header>
    <section className="section shell about-intro"><div className="about-copy"><p className="eyebrow accent">User guide</p><h1>Ripper OS</h1>
    </div></section>
    <section className="section shell about-prose">
      <h2>What Ripper OS does</h2>
      <p>Upload a MacroFactor export and Ripper OS turns the spreadsheet into a picture of how you train. It groups your workouts by date and exercise, then works out sessions, sets, reps, load, volume, progress, consistency, gaps, and training-load intensity.</p>
      <p>You can use the charts and exercise library without an OpenAI account. AI is an optional second layer. It reads the calculated summary and turns it into plain language observations and practical programming prompts. Your raw workbook rows are not sent to OpenAI.</p>
      <h2>How to export from MacroFactor</h2>
      <p>In MacroFactor, open <strong>More</strong>, then <strong>Data Management → Data Export</strong>. For the most useful workout history, choose <strong>Granular Export</strong> and include your workout log or exercise data. If you use <strong>Quick Export</strong>, choose the time period you want and make sure the MacroFactor Workouts data is included.</p>
      <p>Save the file, then drop it into the upload area here. CSV is the simplest option, but Ripper OS also accepts the XLSX workbook export. MacroFactor may include several sheets (Exercises, Muscle Groups, Gym Profiles, nutrition, and more); Ripper OS reads the workout rows and uses muscle-group data when that sheet is present.</p>
      <h2>MacroFactor Workouts CSV schema</h2>
      <p>Keep the original header names. Each row should represent one recorded set or workout entry.</p>
      <div className="schema-card schema-inline"><p><code>Date</code> — required; the workout date.</p><p><code>Exercise</code> — required; the exercise name.</p><p><code>Weight (kg)</code> — recommended; load used for load and volume.</p><p><code>Reps</code> — recommended; repetitions for the set.</p><p><code>Workout Duration</code> — optional; session duration when present.</p></div>
      <p>Extra columns such as Workout ID, Workout, Set Type, Notes, Distance, or Duration are fine. They are optional, so you do not need to clean up the export before uploading it.</p>
      <h2>Using the dashboard</h2>
      <ol><li>Upload your export. The check mark and loaded-file message confirm that it worked.</li><li>Use Progress to search for an exercise and open its full history.</li><li>Use Consistency for monthly sessions, gaps, and attendance. In the heatmap, brighter squares mean more set exposure in that week.</li><li>Use Highlights, Muscles, and Workhorses to spot patterns quickly. A section stays out of the way when there is not enough data to make it useful.</li><li>Use Insights when you want an AI-written readout of the summary.</li></ol>
      <h2>Connecting OpenAI</h2>
      <p>AI is optional. Click <strong>Connect OpenAI</strong>, paste an API key, and connect. Ripper OS checks the key before showing it as connected. The key lives only in memory for this browser session; it is not put in local storage. It is sent to the Ripper OS server only when the app checks the connection or asks for recommendations.</p>
      <p>To make a key, sign in at <a href="https://platform.openai.com/" target="_blank" rel="noreferrer">platform.openai.com</a>, open API keys, create a secret key, copy it once, and paste it here. Never share it or commit it to GitHub. OpenAI API billing is separate from a ChatGPT subscription, so check your API usage and limits. The rest of Ripper OS still works without AI.</p>
      <h2>How rate limits work</h2>
      <p>There are two separate limits. Ripper OS has a small safety limit on uploads, connection checks, and recommendation requests from the same network. It is there to stop accidental loops and abuse. If you hit it, wait a minute or two and try again.</p>
      <p>OpenAI has its own limits for the key or project: request quotas, billing limits, and temporary provider throttling. If OpenAI returns a limit, Ripper OS passes back a friendly error. Ripper OS does not add a country block, although OpenAI availability and network conditions can vary by region. Several people sharing one network, or a key with no remaining quota, can make a first request fail.</p>
      <p>AI is optional, so a rate-limit message does not affect your charts or uploaded analysis. Use one key per person, keep it private, and revoke it immediately if it is exposed.</p>
      <h2>Privacy and limitations</h2><p>The original workbook is processed in the app and is not retained. A rendered summary and generated insights can be kept in this browser so you can come back to the last export; the API key is never stored there. Ripper OS is a training-data visualization tool, not medical advice. Uploads are limited to 25 MB, CSV exports cannot provide muscle-group analysis unless that data is included, and comparisons are only as reliable as the exercise names, units, and logging consistency in the export.</p>
    </section>
    <footer className="shell footer"><p><a href="https://github.com/sidiousvic/ripper-os/issues/new?title=Bug%3A%20&body=%23%23%20What%20happened%3F%0A%0A%23%23%20How%20can%20we%20reproduce%20it%3F%0A%0A%23%23%20Browser%20and%20device%0A" target="_blank" rel="noreferrer">Report a bug</a></p><p className="muted">© All Rights Reserved.</p></footer>
  </main>;
}
