export const repositorySurfaces = [
  {
    title: "Frontend root",
    copy: "The root app/ path is reserved for the Next.js App Router and supporting UI components.",
    status: "Ready",
    tone: "ready" as const,
  },
  {
    title: "Backend runtime",
    copy: "Terraform generation, validation, and the legacy Streamlit workflow now live under backend/.",
    status: "Active",
    tone: "active" as const,
  },
  {
    title: "Test split",
    copy: "Vitest owns the frontend surface while pytest remains scoped to tests/python/.",
    status: "Ready",
    tone: "ready" as const,
  },
];

export const bootstrapMilestones = [
  {
    badge: "Locked",
    title: "Repository boundaries",
    copy: "Frontend and backend naming conflicts are removed so later sprints can add routes and APIs cleanly.",
    tone: "ready" as const,
  },
  {
    badge: "Preserved",
    title: "Terraform workflow safety",
    copy: "The backend remains validation-only and keeps the existing no-apply, no-destroy contract.",
    tone: "active" as const,
  },
  {
    badge: "Next",
    title: "Integration path",
    copy: "A later sprint will replace the temporary frontend placeholder with route handlers and backend execution calls.",
    tone: "active" as const,
  },
];