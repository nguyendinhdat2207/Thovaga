import type { ButtonHTMLAttributes } from "react";
import { buttonClassName, buttonShadowVar, type ButtonSize, type ButtonVariant } from "./button-styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Nút 3D theo design token: viền dày 2px + bóng đặc dưới, lún xuống khi :active.
export function Button({
  variant = "solid",
  size = "md",
  className = "",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, size, className)}
      style={{ ...buttonShadowVar(variant), ...style } as React.CSSProperties}
      {...props}
    />
  );
}
