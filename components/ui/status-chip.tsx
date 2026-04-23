type StatusChipTone = "active" | "ready";

type StatusChipProps = {
  label: string;
  tone: StatusChipTone;
};

export function StatusChip({ label, tone }: StatusChipProps) {
  return <span className={`status-chip status-chip--${tone}`}>{label}</span>;
}