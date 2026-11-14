import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

export function Button({ className, variant = "primary", children, ...props }: Props) {
  const variants = {
    primary: "bg-bronze text-iron hover:bg-bronze-light",
    secondary: "border border-bronze/40 bg-graphite text-parchment hover:border-bronze",
    ghost: "text-sand hover:bg-white/5",
    danger: "bg-danger text-white hover:bg-danger/80"
  };
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-bronze disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
