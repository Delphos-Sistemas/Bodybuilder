import { ShieldCheck, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Variant = "default" | "focus" | "happy" | "tired" | "leg-day" | "warning" | "achievement";

type Props = {
  variant?: Variant;
  title: string;
  message: string;
  size?: "sm" | "md" | "lg";
  showImage?: boolean;
};

export function MascotMessage({ variant = "default", title, message, size = "md", showImage = true }: Props) {
  const Icon = variant === "achievement" ? Trophy : variant === "warning" ? Zap : ShieldCheck;
  return (
    <Card className={cn("flex items-center gap-4", size === "sm" && "p-3", variant === "warning" && "border-danger/50")}>
      {showImage ? (
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-bronze/40 bg-[linear-gradient(145deg,#171717,#3b2c1d)] font-display text-2xl font-black text-bronze-light">
          BB
        </div>
      ) : (
        <Icon className="text-bronze" />
      )}
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-bronze-light">{title}</p>
        <p className={cn("mt-1 text-sand", size === "lg" && "text-lg")}>{message}</p>
      </div>
    </Card>
  );
}
