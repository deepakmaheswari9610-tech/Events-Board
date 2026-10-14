import type { EventsResponse } from "@/lib/types";
export function Pagination({
  pagination,
  label,
  onPageChange,
}: {
  pagination: EventsResponse["pagination"];
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label={label}>
      <button
        className="secondary-button"
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        ← Previous
      </button>
      <span>
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        className="secondary-button"
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next →
      </button>
    </nav>
  );
}
