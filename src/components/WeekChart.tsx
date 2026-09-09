export function WeekChart({ data }: { data: { label: string; minutes: number }[] }) {
  const max = Math.max(60, ...data.map((d) => d.minutes));
  return (
    <div>
      <div className="flex items-end gap-[7px] h-20">
        {data.map((d, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[6px] ${d.minutes / max >= 0.8 ? "bg-yellow" : "bg-track"}`}
            style={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }}
            title={`${d.label}: ${d.minutes} phút`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 font-bold text-[11px] text-ink-muted">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
