# Redesign Inspiration Research

Source brief reviewed:

- `/home/kepler/.gemini/antigravity/brain/bef2ff10-34c1-4ef4-ada0-471fbbaee768/redesign_proposal.md.resolved`

Research goal:

- find public sites that match the planned shift from an academic/document-like
  interface to a premium dark developer-tool UI
- prioritize references that show dark mode, split panes, status-rich panels,
  code or terminal surfaces, AI workflow cues, and a command-center feel

## Design Filter

The redesign brief points to this visual direction:

- premium dark mode by default
- modern developer-tool identity rather than a reading app or blog
- subtle glassmorphism, not heavy frosted-glass novelty
- split-pane or workspace layout instead of one long scroll of generic cards
- strong code, logs, validation, and system-status surfaces
- AI-first interaction cues, but still serious and technically credible

## Best-Fit Shortlist

These are the strongest references to study first.

### 1. Linear

- URL: [https://linear.app/](https://linear.app/)
- Why it matches:
  - The homepage is built around a dense, product-first interface instead of an
    abstract marketing story.
  - It presents a high-end dark product surface with agent workflows, activity,
    dashboards, and PR review states all visible in one system.
  - The interface hierarchy feels quiet, fast, and precise.
- Borrow:
  - thin dividers and low-noise panel framing
  - large headline + real product UI immediately under the fold
  - muted dark surfaces with just enough contrast to separate regions
  - compact status chips and progress states
- Avoid:
  - copying its very low-contrast small text too literally; your app needs to
    stay readable in a classroom demo

### 2. Cursor

- URL: [https://cursor.com/](https://cursor.com/)
- Why it matches:
  - The product framing is explicitly about AI-assisted coding, parallel work,
    and agent autonomy.
  - The page shows editor, agent, and CLI surfaces together rather than as
    isolated marketing fragments.
  - Its messaging strongly supports the “AI command center” direction.
- Borrow:
  - layered editor, agent, and terminal compositions
  - visible autonomy states, model selectors, and task-progress cues
  - the feeling that work is happening across multiple coordinated panes
- Avoid:
  - scenic or painterly backdrops if you want a stricter DevOps/control-plane tone

### 3. Warp

- URL: [https://www.warp.dev/terminal](https://www.warp.dev/terminal)
- Why it matches:
  - Warp is explicitly framed as “the best terminal to build with agents.”
  - It emphasizes block-based navigation, code review, file trees, and terminal
    panes, which is very close to the desired command-center feel.
  - It shows how to make a technically dense product feel premium instead of raw.
- Borrow:
  - terminal-first composition and stacked work surfaces
  - file tree + terminal + review panel relationships
  - subtle layered-window treatment for glass-like depth
  - the “prompt to production” narrative for actions and outcomes
- Avoid:
  - letting atmosphere or gradients dominate the functional UI

### 4. Railway

- URL: [https://railway.com/](https://railway.com/)
- Why it matches:
  - Railway is a strong reference for dark cloud-control-plane layout.
  - The page prominently shows architecture, activity, logs, observability, and
    deployment state rather than generic hero art.
  - It demonstrates how infrastructure UI can look calm, premium, and legible.
- Borrow:
  - service-topology and activity-timeline composition
  - logs and metrics cards as first-class visual elements
  - infrastructure maps and deploy-state panels in the hero section
- Avoid:
  - making too many cards equal priority; keep one obvious focal pane

### 5. GitHub Copilot

- URL: [https://github.com/features/copilot](https://github.com/features/copilot)
- Why it matches:
  - The page is explicitly organized around code, command line, agents, and
    workflow acceleration.
  - It frames AI as a practical accelerator across editor, terminal, and cloud
    tasks instead of a vague assistant.
  - It has a strong “command your craft” posture that suits your product.
- Borrow:
  - command-oriented copy and strong action verbs
  - side-by-side editor, agent, and terminal visual storytelling
  - tight integration between workflow stages and AI assistance
- Avoid:
  - inheriting GitHub’s very broad navigation complexity or brand-specific feel

## Strong Supporting References

These are not the top five, but they are useful for specific parts of the redesign.

### 6. Supabase

- URL: [https://supabase.com/](https://supabase.com/)
- Best for:
  - restrained accent color in a dark product brand
  - modular dark card systems
  - “developer platform” tone that still feels approachable
- Borrow:
  - clean dark product framing with one strong accent color
  - modular panels that can hold code, logs, and status without feeling heavy
- Avoid:
  - a purely centered marketing layout if you want more of an IDE/control-room feel

### 7. Retool

- URL: [https://retool.com/](https://retool.com/)
- Best for:
  - prompt-to-production framing
  - combining prompt, canvas, and code into one surface
  - AI assistance that still feels governed and enterprise-ready
- Borrow:
  - treating the prompt box as a powerful primary control
  - framing the app as one unified workspace instead of stacked independent sections
- Avoid:
  - glossy abstract hero art if you want a sharper operator-tool aesthetic

### 8. Vercel

- URL: [https://vercel.com/](https://vercel.com/)
- Best for:
  - layout precision
  - spacing discipline
  - crisp controls, pills, and typography hierarchy
- Borrow:
  - the structural cleanliness and grid rigor
  - the way CTAs, labels, and microcopy feel polished without feeling loud
- Avoid:
  - using Vercel as the color reference; the redesign brief is much darker and more ops-oriented

## Secondary Watch List

These are worth reviewing if you want more directions after the core shortlist:

- Zed: premium product-first editor presentation and type contrast
- Sentry: diagnostic panel layouts and investigation-sidecar patterns
- Pulumi Cloud: control-plane framing for infrastructure workflows
- HashiCorp Cloud Platform: brand-adjacent cues for Terraform credibility and enterprise restraint

## What To Borrow By Surface

### Hero and first impression

- Best references: Linear, Railway, GitHub Copilot
- Borrow:
  - one big confident heading
  - immediate product UI in view, not abstract filler
  - visible workflow states above the fold

### Prompt area and AI interaction

- Best references: Cursor, Retool, GitHub Copilot
- Borrow:
  - a clearly primary prompt surface
  - visible agent state and model or workflow cues
  - action-oriented phrasing around running, reviewing, and delivering work

### Code, logs, and validation workspace

- Best references: Warp, Railway, Cursor
- Borrow:
  - tabs or segmented panes for code, logs, and findings
  - terminal-style density with clean grouping and spacing
  - visually distinct success, warning, and failure states

### Overall polish and system feel

- Best references: Linear, Vercel, Supabase
- Borrow:
  - disciplined spacing and typography
  - careful use of accent color
  - premium but restrained motion and hover behavior

## Recommended Blend For This Project

If you want one coherent direction instead of a collage, this is the strongest mix:

- Base layout: Linear
- AI workflow cues: Cursor + GitHub Copilot
- Terminal and logs treatment: Warp
- Infrastructure and observability composition: Railway
- Accent restraint and dark card system: Supabase
- Spacing and polish discipline: Vercel

This combination maps well to the redesign proposal because it would produce:

- a dark command-center shell instead of a document layout
- a split-pane workflow with sticky prompt controls on the left
- a right-side workspace for Terraform, validation logs, and Checkov findings
- clearer step-based status progression for generation, validation, security,
  and GitOps delivery
- a more premium developer-tool identity without drifting into flashy concept art

## Practical UI Moves To Explore Next

Based on the references above, the redesign should likely test these moves first:

1. Replace the current centered top-to-bottom rhythm with a two-column workspace.
2. Move the prompt composer into a sticky left pane with stronger visual priority.
3. Turn the right side into a tabbed or segmented output workspace for Terraform,
   validation logs, and security findings.
4. Add a thin workflow rail across the top of the output region for
   `Generation -> Validation -> Security -> Delivery`.
5. Shift the palette to near-black surfaces with Terraform-purple and AI-cyan accents,
   keeping green and rose reserved for pass/fail semantics.
6. Treat the shared shell like a product control plane rather than a project site:
   tighter header, quieter footer, stronger system signals.

## Suggested Review Order

If you only want to study a few sites before redesigning, look at them in this order:

1. Linear
2. Cursor
3. Warp
4. Railway
5. GitHub Copilot
6. Supabase

That sequence moves from overall product polish to AI workflow cues to terminal
and infrastructure-specific layout ideas.

## Notes

- These references are for inspiration, pattern study, and visual benchmarking.
- Use them to shape layout, hierarchy, motion, and tone, not to directly copy
  branded assets or proprietary UI details.