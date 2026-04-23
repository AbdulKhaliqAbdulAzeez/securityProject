import { StatusChip } from "@/components/ui/status-chip";
import { bootstrapMilestones, repositorySurfaces } from "@/lib/workflow";

export function WorkflowShell() {
  return (
    <main className="workflow-page">
      <section className="hero-panel">
        <p className="hero-eyebrow">Sprint 0 Dual-Stack Bootstrap</p>
        <h1 className="hero-title">
          Next.js at the edge of the repo. Python at the core of the workflow.
        </h1>
        <p className="hero-copy">
          The frontend root is now free for the App Router while the existing
          Terraform generation and validation logic moves into a dedicated backend
          surface. This sprint sets the structural contract for later API,
          Checkov, and GitOps work.
        </p>
        <div className="hero-actions">
          <span className="hero-primary">Frontend scaffold ready</span>
          <span className="hero-secondary">Backend logic preserved under backend/</span>
        </div>
      </section>

      <section className="workflow-grid" aria-label="Repository transition details">
        <article className="stack-card stack-card--split">
          <p className="section-label">Repository Split</p>
          <h2 className="section-title">One codebase, clearer boundaries.</h2>
          <p className="section-copy">
            Sprint 0 does not replace the backend logic. It makes the root layout
            safe for a long-lived frontend while preserving the tested Python path.
          </p>
          <ul className="stack-list">
            {repositorySurfaces.map((surface) => (
              <li key={surface.title}>
                <div className="stack-row">
                  <div>
                    <p className="stack-row__title">{surface.title}</p>
                    <p className="stack-row__copy">{surface.copy}</p>
                  </div>
                  <StatusChip label={surface.status} tone={surface.tone} />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="stack-card stack-card--milestones">
          <p className="section-label">Bootstrap Milestones</p>
          <h2 className="section-title">What this sprint locks in.</h2>
          <div className="milestone-list">
            {bootstrapMilestones.map((milestone) => (
              <section className="milestone-card" key={milestone.title}>
                <StatusChip label={milestone.badge} tone={milestone.tone} />
                <h3>{milestone.title}</h3>
                <p>{milestone.copy}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}