import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <span className="site-header__eyebrow">Next.js Transition</span>
        <strong className="site-header__title">{siteConfig.title}</strong>
      </div>
      <p className="site-header__meta">
        Root App Router scaffold on the frontend, verified Terraform workflow in the
        Python backend.
      </p>
    </header>
  );
}