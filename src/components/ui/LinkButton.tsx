import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClassName, buttonShadowVar, type ButtonSize, type ButtonVariant } from "./button-styles";

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function LinkButton({
  variant = "solid",
  size = "md",
  className = "",
  style,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={buttonClassName(variant, size, className)}
      style={{ ...buttonShadowVar(variant), ...style } as React.CSSProperties}
      {...props}
    />
  );
}
