import { StatusChip } from "@/components/ui/status-chip";
import type { WorkflowStep } from "@/lib/workflow";

type WorkflowStatusListProps = {
  steps: WorkflowStep[];
};

export function WorkflowStatusList({ steps }: WorkflowStatusListProps) {
  return (
    <ul className="status-list" aria-label="Workflow status steps">
      {steps.map((step) => (
        <li className="status-card" key={step.id}>
          <div>
            <p className="status-card__title">{step.label}</p>
            <p className="status-card__copy">{step.detail}</p>
          </div>
          <StatusChip label={step.status} tone={step.tone} />
        </li>
      ))}
    </ul>
  );
}