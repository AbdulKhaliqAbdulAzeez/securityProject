"use client";

interface ChatHeroProps {
  onStart: () => void;
  onUsePrompt: () => void;
}

export function ChatHero({ onStart, onUsePrompt }: ChatHeroProps) {
  return (
    <section className="chat-hero" aria-labelledby="chat-hero-title">
      <div className="chat-hero__media" aria-hidden="true" />
      <div className="chat-hero__overlay" aria-hidden="true" />
      <div className="chat-hero__content">
        <p className="chat-hero__eyebrow">AI Terraform Security Agent</p>
        <h1 id="chat-hero-title" className="chat-hero__title">
          Generate secure infrastructure with validation built in.
        </h1>
        <p className="chat-hero__subtitle">
          Describe the cloud architecture you need. The agent generates Terraform,
          validates it, runs Checkov security scanning, repairs blockers, and
          prepares GitOps delivery.
        </p>
        <div className="chat-hero__pills" aria-label="Agent capabilities">
          <span>Terraform generation</span>
          <span>Checkov security gate</span>
          <span>GitOps PR delivery</span>
        </div>
        <div className="chat-hero__actions">
          <button
            type="button"
            className="chat-hero__primary"
            onClick={onStart}
          >
            Start building
          </button>
          <button
            type="button"
            className="chat-hero__secondary"
            onClick={onUsePrompt}
          >
            Use secure VPC prompt
          </button>
        </div>
      </div>
    </section>
  );
}
