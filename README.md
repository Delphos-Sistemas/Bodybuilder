import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-lg border border-white/10 bg-iron px-3 py-2 text-parchment outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/30",
        className
      )}
      {...props}
    />
  );
}
