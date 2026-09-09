interface ProgressBarProps {
  percent: number;
  heightClassName?: string;
  trackClassName?: string;
  fillClassName?: string;
}

export function ProgressBar({
  percent,
  heightClassName = "h-2",
  trackClassName = "bg-track",
  fillClassName = "bg-yellow",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`w-full ${heightClassName} ${trackClassName} rounded-full overflow-hidden`}>
      <div
        className={`h-full ${fillClassName} rounded-full transition-[width]`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
