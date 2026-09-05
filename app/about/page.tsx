import Link from "next/link";
import Footer from "../footer";
import "../globals.css";

export default function AboutPage() {
  return <main className="about-page">
      <header className="topbar"><Link className="brand" href="/" aria-label="Ripper OS home"><span>Ripper OS</span></Link><nav><Link href="/">Back to dashboard</Link></nav><a className="data-pill donate-button" href="https://donate.stripe.com/bJe8wQ18J4so1wSdrKfjG00" target="_blank" rel="noreferrer">Donate</a></header>
    <section className="section shell about-intro"><div className="about-copy"><p className="eyebrow accent">User guide</p><h1>Ripper OS</h1>
    </div></section>
    <section className="section shell about-prose">
      <h2>What Ripper OS does</h2>
      <p>Upload a MacroFactor export and Ripper OS turns the spreadsheet into a picture of how you train. It groups your workouts by date and exercise, then works out sessions, sets, reps, load, volume, progress, consistency, gaps, and training-load intensity.</p>
      <p>You can use the charts and exercise library without an OpenAI account. AI is an optional second layer. It reads the calculated summary and turns it into plain language observations and practical programming prompts. Your raw workbook rows are not sent to OpenAI.</p>
      <h2>How to export from MacroFactor</h2>
      <p>Ripper OS accepts MacroFactor, Strong and Hevy workout exports. In MacroFactor, open <strong>More</strong>, then <strong>Data Management → Data Export</strong>. For the most useful workout history, choose <strong>Granular Export</strong> and include your workout log or exercise data. Strong and Hevy exports should be exported as their original CSV files. Volume values are recorded load × reps where the source provides those fields; machine, assisted and missing-load work is not mechanically comparable.</p>
      <p>Save the file, then drop it into the upload area here. CSV is the simplest option, but Ripper OS also accepts the XLSX workbook export. MacroFactor may include several sheets (Exercises, Muscle Groups, Gym Profiles, nutrition, and more); Ripper OS reads the workout rows and uses muscle-group data when that sheet is present.</p>
      <h2>MacroFactor Workouts CSV schema</h2>
      <p>Keep the original header names. Each row should represent one recorded set or workout entry.</p>
      <div className="schema-card schema-inline"><p><code>Date</code> — required; the workout date.</p><p><code>Exercise</code> — required; the exercise name.</p><p><code>Weight (kg)</code> — recommended; load used for load and volume.</p><p><code>Reps</code> — recommended; repetitions for the set.</p><p><code>Workout Duration</code> — optional; session duration when present.</p></div>
      <p>Extra columns such as Workout ID, Workout, Set Type, Notes, Distance, or Duration are fine. They are optional, so you do not need to clean up the export before uploading it.</p>
      <p>This is the core schema, not a complete list of every column MacroFactor may include. Ripper OS is intentionally forgiving about extra fields, and I plan to support more file types in the future, including FIT files.</p>
      <h2>Using the dashboard</h2>
      <ol><li>Upload your export. The check mark and loaded-file message confirm that it worked.</li><li>Use Progress to search for an exercise and open its full history.</li><li>Use Consistency for monthly training days, gaps, and attendance. In the heatmap, brighter squares mean more set exposure in that week.</li><li>Use Highlights, Muscles, and Workhorses to spot patterns quickly. A section stays out of the way when there is not enough data to make it useful.</li><li>Use Insights when you want an AI-written readout of the summary.</li></ol>
      <h2>Connecting OpenAI</h2>
      <p>AI is optional. Click <strong>Connect OpenAI</strong>, paste an API key, and connect. Ripper OS checks the key with a quick API health call before showing it as connected. The key lives only in memory for this browser session; it is not put in local storage. It is sent to the Ripper OS server only when the app checks the connection or asks for recommendations.</p>
      <p>To make a key, sign in at <a href="https://platform.openai.com/" target="_blank" rel="noreferrer">platform.openai.com</a>, open API keys, create a secret key, copy it once, and paste it here. Never share it or commit it to GitHub. OpenAI API billing is separate from a ChatGPT subscription, so check your API usage and limits. The rest of Ripper OS still works without AI.</p>
      <h2>How rate limits work</h2>
      <p>Ripper OS limits OpenAI connection checks and recommendation requests from the same network to reduce accidental loops and abuse. If you hit a limit, wait a minute or two and try again. File imports run on your device and do not use a server upload service.</p>
      <p>OpenAI has its own limits for the key or project: request quotas, billing limits, and temporary provider throttling. If OpenAI returns a limit, Ripper OS passes back a friendly error. Ripper OS does not add a country block, although OpenAI availability and network conditions can vary by region. Several people sharing one network, or a key with no remaining quota, can make a first request fail.</p>
      <p>AI is optional, so a rate-limit message does not affect your charts or uploaded analysis. Use one key per person, keep it private, and revoke it immediately if it is exposed.</p>
      <h2>Privacy</h2><p>Your CSV or XLSX file is read and analyzed entirely on this device. The file and its raw rows are never uploaded to Ripper OS or OpenAI. A normalized dashboard snapshot and any generated insights may be saved in this browser so you can return to your last export. Clear uploaded data removes that saved snapshot. Only when you choose Generate AI insights does the calculated summary go to the Ripper OS server and onward to OpenAI. Your API key is kept in memory for the current page session and is not saved to browser storage.</p>
      <h2>Limitations</h2><p>Ripper OS is a training-data visualization tool, not medical advice. Uploads are limited to 25 MB, CSV exports cannot provide muscle-group analysis unless that data is included, and comparisons are only as reliable as the exercise names, units, and logging consistency in the export.</p>
      <h2>Credits</h2><p>The ambient dumbbell wireframe is based on <strong>FREE MODEL Dumbbell</strong> by <a href="https://sketchfab.com/Anwarali" target="_blank" rel="noreferrer">Anwar Ali</a>, from <a href="https://sketchfab.com/3d-models/free-model-dumbbell-d9822cbffc4c47f89e2213543103e4a0" target="_blank" rel="noreferrer">Sketchfab</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</p>
    </section>
      <Footer />
  </main>;
}
