import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-body">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-soft">{description}</p>
      )}
    </div>
  );
}
