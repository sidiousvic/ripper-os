import type { ComparisonContext } from "../../lib/exercises/comparison-context";

export default function ComparisonContextControls({ context, onReset }: { context: ComparisonContext; onReset?: () => void }) {
  return <div className="comparison-context" aria-label="Load comparison context">
    <div><span className="eyebrow">Comparison context</span><p>{context.equipmentInstance ?? "Source-specific setup"} · {context.loadBasis} · {context.mode}</p></div>
    <span className={`data-pill ${context.comparable ? "is-ready" : ""}`}>{context.comparable ? "Comparable series" : "Kept separate"}</span>
    {onReset && <button className="button secondary" type="button" onClick={onReset}>Reset</button>}
  </div>;
}
