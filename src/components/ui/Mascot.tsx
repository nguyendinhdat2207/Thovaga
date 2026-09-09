import Image from "next/image";

interface MascotProps {
  size: number;
  variant?: "pair" | "alt";
  className?: string;
  focusTop?: boolean;
  priority?: boolean;
}

// Ảnh linh vật nền trắng không trong suốt -> luôn đặt trong khung tròn viền nâu.
export function Mascot({
  size,
  variant = "pair",
  className = "",
  focusTop = true,
  priority = false,
}: MascotProps) {
  const src = variant === "pair" ? "/mascots/mascot-pair.png" : "/mascots/mascot-alt.png";
  return (
    <div
      className={`rounded-full border-2 border-mascot-border overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt="Thỏ và Gà"
        width={size * 1.3}
        height={size * 1.3}
        priority={priority}
        className="object-cover"
        style={{
          width: focusTop ? "130%" : "100%",
          height: focusTop ? "130%" : "100%",
          objectPosition: focusTop ? "center 22%" : "center",
        }}
      />
    </div>
  );
}
