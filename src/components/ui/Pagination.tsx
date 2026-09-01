import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Meta } from "@/types";

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: Pick<Meta, "page" | "totalPages" | "total">;
  onPageChange: (page: number) => void;
}) {
  if (meta.total === 0) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-xs text-slate-soft">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
