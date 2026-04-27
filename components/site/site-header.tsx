import { siteConfig } from "@/lib/site";
import { StatusChip } from "@/components/ui/status-chip";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <strong className="site-header__title">{siteConfig.title}</strong>
      </div>
      <div className="site-header__signals" aria-label="Workflow shell signals">
        <StatusChip label="Checkov live" tone="ready" />
        <StatusChip label="GitOps live" tone="ready" />
      </div>
    </header>
  );
}