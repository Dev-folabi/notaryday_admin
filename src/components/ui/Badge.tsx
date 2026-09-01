import { cn } from "@/lib/utils";

type Tone = "slate" | "blue" | "amber" | "teal" | "red" | "indigo";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  red: "bg-red-50 text-red-700 border-red-200",
  indigo: "bg-indigo-50 text-admin-indigo border-indigo-200",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
