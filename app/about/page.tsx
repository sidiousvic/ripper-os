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
      <p>Upload MacroFactor, Strong, or Hevy exports and Ripper OS turns them into one longitudinal picture of how you train. It detects the source, normalizes records on this device, and builds shared views for sessions, sets, reps, load, recorded volume, progress, consistency, gaps, and workload.</p>
      <p>You can use the charts and exercise library without an OpenAI account. AI is an optional second layer. It reads the calculated summary and turns it into plain language observations and practical programming prompts. Your raw workbook rows are not sent to OpenAI.</p>
      <h2>How to export from MacroFactor</h2>
      <p>Ripper OS accepts MacroFactor, Strong and Hevy workout exports. In MacroFactor, open <strong>More</strong>, then <strong>Data Management → Data Export</strong>. For the most useful workout history, choose <strong>Granular Export</strong> and include your workout log or exercise data. Strong and Hevy exports should be exported as their original CSV files. Volume values are recorded load × reps where the source provides those fields; machine, assisted and missing-load work is not mechanically comparable.</p>
      <p>Save the file, then drop it into the upload area here. Ripper OS accepts MacroFactor CSV/XLSX, Strong CSV, and Hevy workout CSV. You can select multiple files, add a newer export to the current history, or replace the current history. MacroFactor workbook muscle sheets remain source-reported observations; Strong and Hevy detailed sets power the shared exercise analytics.</p>
      <h2>How to export from Strong</h2>
      <p>In Strong, open <strong>Settings</strong>, choose <strong>Export Data</strong>, and export your workout history as CSV. Keep the original file unchanged, then drop it into Ripper OS. If Strong leaves weight or distance units unlabeled, Ripper will ask you to confirm them before importing.</p>
      <h2>How to export from Hevy</h2>
      <p>In Hevy, open your profile or settings, choose <strong>Export Data</strong>, and export the workout history CSV. Upload that original workout file here; Ripper reads the workout title, timestamps, exercise blocks, set order, reps, load, duration, distance, notes, and RPE when present. Measurement exports are not required for training history.</p>
      <p>For all three sources, empty cells remain unavailable; they are not treated as zero. Ripper resolves known source names automatically and keeps genuinely unknown exercises custom until you choose a mapping.</p>
      <p>Ripper resolves known source names automatically. If an exercise is genuinely unknown, the mapping dialog lets you choose a canonical movement, keep it custom, reset the automatic result, and move through the full queue. Confirmed choices are retained for later imports.</p>
      <h2>Using the dashboard</h2>
      <ol><li>Upload your export. The check mark and loaded-file message confirm that it worked.</li><li>Use Progress to search for an exercise and open its full history.</li><li>Use Consistency for monthly training days, gaps, and attendance. In the heatmap, brighter squares mean more set exposure in that week.</li><li>Use Highlights, Muscles, and Workhorses to spot patterns quickly. A section stays out of the way when there is not enough data to make it useful.</li><li>Use Insights when you want an AI-written readout of the summary.</li></ol>
      <h2>Connecting OpenAI</h2>
      <p>AI is optional. Click <strong>Connect OpenAI</strong>, paste an API key, and connect. Ripper OS checks the key with a quick API health call before showing it as connected. The key lives only in memory for this browser session; it is not put in local storage. It is sent to the Ripper OS server only when the app checks the connection or asks for recommendations.</p>
      <p>To make a key, sign in at <a href="https://platform.openai.com/" target="_blank" rel="noreferrer">platform.openai.com</a>, open API keys, create a secret key, copy it once, and paste it here. Never share it or commit it to GitHub. OpenAI API billing is separate from a ChatGPT subscription, so check your API usage and limits. The rest of Ripper OS still works without AI.</p>
      <h2>How rate limits work</h2>
      <p>Ripper OS limits OpenAI connection checks and recommendation requests from the same network to reduce accidental loops and abuse. If you hit a limit, wait a minute or two and try again. File imports run on your device and do not use a server upload service.</p>
      <p>OpenAI has its own limits for the key or project: request quotas, billing limits, and temporary provider throttling. If OpenAI returns a limit, Ripper OS passes back a friendly error. Ripper OS does not add a country block, although OpenAI availability and network conditions can vary by region. Several people sharing one network, or a key with no remaining quota, can make a first request fail.</p>
      <p>AI is optional, so a rate-limit message does not affect your charts or uploaded analysis. Use one key per person, keep it private, and revoke it immediately if it is exposed.</p>
      <h2>Privacy</h2><p>Your CSV or XLSX file is read and analyzed entirely on this device. The file and its raw rows are never uploaded to Ripper OS or OpenAI. Canonical history and mapping choices are stored locally in this browser. Download a private backup from the loaded-export dialog before clearing browser data. Only when you choose Generate AI insights does a bounded calculated summary go to the Ripper OS server and onward to OpenAI. Your API key is kept in memory for the current page session and is not saved to browser storage.</p>
      <h2>Limitations</h2><p>Ripper OS is a training-data visualization tool, not medical advice. Uploads are limited to 25 MB, CSV exports cannot provide muscle-group analysis unless that data is included, and comparisons are only as reliable as the exercise names, units, and logging consistency in the export.</p>
      <h2>Credits</h2><p>The ambient dumbbell wireframe is based on <strong>FREE MODEL Dumbbell</strong> by <a href="https://sketchfab.com/Anwarali" target="_blank" rel="noreferrer">Anwar Ali</a>, from <a href="https://sketchfab.com/3d-models/free-model-dumbbell-d9822cbffc4c47f89e2213543103e4a0" target="_blank" rel="noreferrer">Sketchfab</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</p>
    </section>
      <Footer />
  </main>;
}
