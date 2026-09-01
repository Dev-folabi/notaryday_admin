import { cn } from "@/lib/utils";

/** NotaryDay arc mark. `onDark` renders white strokes (for navy backgrounds). */
export function LogoMark({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <line
        x1="40"
        y1="140"
        x2="160"
        y2="140"
        stroke={onDark ? "rgba(255,255,255,0.25)" : "#E2E8F0"}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M44 140 C 44 68, 156 68, 156 140"
        fill="none"
        stroke={onDark ? "#FFFFFF" : "url(#logoGrad)"}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="44" cy="140" r="9" fill={onDark ? "#FFFFFF" : "#0F2C4E"} />
      <circle cx="100" cy="60" r="12" fill="#FBBF24" />
      <circle cx="156" cy="140" r="9" fill="#0E7B6C" />
      {!onDark && (
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F2C4E" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

/** Brand lockup: mark + "NotaryDay" wordmark. */
export function Logo({
  onDark = false,
  className,
  markClassName,
}: {
  onDark?: boolean;
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark onDark={onDark} className={cn("h-8 w-8", markClassName)} />
      <div className="leading-tight">
        <p
          className={cn(
            "text-sm font-bold",
            onDark ? "text-white" : "text-navy"
          )}
        >
          Notary<span className="text-admin-indigo">Day</span>
        </p>
        {onDark && (
          <p className="text-[10px] uppercase tracking-widest text-white/50">
            Admin Console
          </p>
        )}
      </div>
    </div>
  );
}
