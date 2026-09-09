export type ButtonVariant = "solid" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[13px] rounded-[11px]",
  md: "px-5 py-3 text-[15px] rounded-xl",
  lg: "px-7 py-3.5 text-[16px] rounded-2xl",
};

const SIZE_SHADOW: Record<ButtonSize, string> = {
  sm: "shadow-[0_3px_0_var(--btn-shadow)] active:shadow-[0_1px_0_var(--btn-shadow)]",
  md: "shadow-[0_4px_0_var(--btn-shadow)] active:shadow-[0_1px_0_var(--btn-shadow)]",
  lg: "shadow-[0_5px_0_var(--btn-shadow)] active:shadow-[0_1px_0_var(--btn-shadow)]",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid: "bg-yellow border-2 border-yellow-shadow text-ink",
  danger: "bg-orange border-2 border-[#D93F1F] text-white",
  ghost: "bg-white border-2 border-border text-ink",
};

export function buttonClassName(
  variant: ButtonVariant = "solid",
  size: ButtonSize = "md",
  className = ""
) {
  return `inline-flex items-center justify-center font-display font-extrabold whitespace-nowrap transition-transform active:translate-y-1 disabled:opacity-50 disabled:pointer-events-none ${SIZE_CLASSES[size]} ${SIZE_SHADOW[size]} ${VARIANT_CLASSES[variant]} ${className}`;
}

export function buttonShadowVar(variant: ButtonVariant = "solid") {
  if (variant === "solid") return { "--btn-shadow": "#D98D00" } as React.CSSProperties;
  if (variant === "danger") return { "--btn-shadow": "#D93F1F" } as React.CSSProperties;
  return { "--btn-shadow": "#EDE7DD" } as React.CSSProperties;
}
