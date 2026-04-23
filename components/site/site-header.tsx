import { siteConfig } from "@/lib/site";
import { StatusChip } from "@/components/ui/status-chip";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="site-header__eyebrow">Sprint 1 Workflow Shell</span>
        <strong className="site-header__title">{siteConfig.title}</strong>
      </div>
      <div className="site-header__meta">
        <p>
          One page now stages prompt input, Terraform review, validation state, and
          future security gating without depending on Streamlit layout decisions.
        </p>
        <div className="site-header__signals" aria-label="Workflow shell signals">
          <StatusChip label="Next.js shell" tone="active" />
          <StatusChip label="Backend preserved" tone="ready" />
          <StatusChip label="GitOps disabled" tone="warning" />
        </div>
      </div>
    </header>
  );
}