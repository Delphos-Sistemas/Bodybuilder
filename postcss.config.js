import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-white/10 bg-graphite/80 p-4 shadow-bronze", className)} {...props}>
      {children}
    </section>
  );
}
