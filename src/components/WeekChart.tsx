import { formatMinutesShort } from "@/lib/format";

export interface WeekChartDay {
  label: string;
  minutes: number;
}

/**
 * Biểu đồ thời gian học 7 ngày gần nhất.
 *
 * Số phút hiển thị ngay trên đầu mỗi cột chứ không giấu trong tooltip: ứng dụng
 * dùng chủ yếu trên điện thoại, mà điện thoại không hover được nên tooltip coi
 * như không tồn tại — nhìn cột suông thì không biết chênh nhau bao nhiêu.
 *
 * Trục cũng co giãn theo ngày cao nhất thật, không neo cứng ở 60 phút. Neo cứng
 * khiến những tuần học dưới một tiếng mỗi ngày cho ra 7 cột thấp gần bằng nhau,
 * đúng lúc cần so sánh nhất thì lại không phân biệt được.
 */
export function WeekChart({
  data,
  size = "sm",
}: {
  data: WeekChartDay[];
  /** "sm" cho ô nhỏ ở trang chủ, "lg" cho khu biểu đồ rộng ở trang lịch sử. */
  size?: "sm" | "lg";
}) {
  const max = Math.max(1, ...data.map((d) => d.minutes));
  const barsHeight = size === "lg" ? "h-[200px]" : "h-20";
  const valueText = size === "lg" ? "text-xs" : "text-[10px]";
  const labelText = size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <div>
      <div className={`flex items-end gap-1.5 ${barsHeight}`}>
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          const isBest = d.minutes > 0 && d.minutes === max;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span
                className={`font-display font-extrabold ${valueText} whitespace-nowrap ${
                  d.minutes === 0 ? "text-ink-faint" : "text-ink"
                }`}
              >
                {formatMinutesShort(d.minutes)}
              </span>
              <div
                className={`w-full rounded-t-md ${
                  d.minutes === 0
                    ? "bg-track"
                    : isBest || isToday
                      ? "bg-yellow"
                      : "bg-yellow-pill"
                }`}
                // Cột 0 phút vẫn để lại một vạch mỏng để hàng cột không bị khuyết.
                style={{ height: `${Math.max(3, (d.minutes / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className={`flex gap-1.5 mt-2 font-bold ${labelText} text-ink-muted text-center`}>
        {data.map((d, i) => (
          <span
            key={i}
            className={`flex-1 ${i === data.length - 1 ? "text-ink font-extrabold" : ""}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
