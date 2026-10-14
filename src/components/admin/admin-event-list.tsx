import { Pencil, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";
import { formatDate, formatPrice } from "@/lib/format";
import type {
  AdminEvent,
  AdminEventQuery,
  AdminEventsResponse,
} from "@/lib/types";
import styles from "./admin.module.css";
export function AdminEventList({
  events,
  pagination,
  query,
  onQueryChange,
  onEdit,
  loading,
  error,
  pending,
  onToggle,
  onRetry,
  onCreate,
}: {
  events: AdminEvent[];
  pagination: AdminEventsResponse["pagination"];
  query: AdminEventQuery;
  onQueryChange: (values: Partial<AdminEventQuery>) => void;
  onEdit: (event: AdminEvent) => void;
  loading: boolean;
  error: string;
  pending: number[];
  onToggle: (event: AdminEvent) => void;
  onRetry: () => void;
  onCreate: () => void;
}) {
  return (
    <section className={styles.listPanel} aria-label="Manage events">
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search admin events"
            type="search"
            maxLength={200}
            placeholder="Search by title, city or category"
            value={query.q}
            onChange={(event) => onQueryChange({ q: event.target.value })}
          />
        </label>
        <select
          aria-label="Filter event status"
          value={query.status}
          onChange={(event) =>
            onQueryChange({
              status: event.target.value as AdminEventQuery["status"],
            })
          }
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          aria-label="Sort events"
          value={query.sort}
          onChange={(event) =>
            onQueryChange({
              sort: event.target.value as AdminEventQuery["sort"],
            })
          }
        >
          <option value="date-asc">Date: earliest first</option>
          <option value="date-desc">Date: latest first</option>
          <option value="title-asc">Title: A–Z</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      {loading ? (
        <div className={styles.state} role="status">
          Loading events…
        </div>
      ) : error && !events.length ? (
        <div className={styles.state}>
          <h2>Events couldn’t load</h2>
          <button className={styles.secondary} onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : !events.length ? (
        <div className={styles.state}>
          <span aria-hidden="true">▦</span>
          <h2>
            {pagination.total || query.q || query.status !== "all"
              ? "No matching events"
              : "Your first event starts here"}
          </h2>
          <p>
            {pagination.total || query.q || query.status !== "all"
              ? "Try another search or status."
              : "Publish an event to add it to your community board."}
          </p>
          {!query.q && query.status === "all" && (
            <button className={styles.primary} onClick={onCreate}>
              Create event
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Date & time</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td data-label="Event">
                      <strong>{event.title}</strong>
                      <small>
                        {event.category} <span aria-hidden="true">·</span>{" "}
                        {event.city}
                      </small>
                    </td>
                    <td data-label="Date & time">
                      <time dateTime={event.startsAt}>
                        {formatDate(event.startsAt)}
                      </time>
                    </td>
                    <td data-label="Price">{formatPrice(event.price)}</td>
                    <td data-label="Status">
                      <span
                        className={`${styles.status} ${event.active ? styles.active : styles.inactive}`}
                      >
                        <i aria-hidden="true" />
                        {event.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td data-label="Action">
                      <div className={styles.rowActions}>
                        <button
                          className={`${styles.rowAction} ${styles.iconAction}`}
                          onClick={() => onEdit(event)}
                          aria-label={`Edit ${event.title}`}
                          title="Edit event"
                          disabled={pending.includes(event.id)}
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button
                          className={`${styles.rowAction} ${styles.iconAction}`}
                          disabled={pending.includes(event.id)}
                          onClick={() => onToggle(event)}
                          aria-label={`${event.active ? "Deactivate" : "Activate"} ${event.title}`}
                          title={event.active ? "Make inactive" : "Make active"}
                          aria-busy={pending.includes(event.id)}
                        >
                          {pending.includes(event.id) ? (
                            <LoaderCircle
                              size={17}
                              className={styles.spinning}
                              aria-hidden="true"
                            />
                          ) : event.active ? (
                            <EyeOff size={17} aria-hidden="true" />
                          ) : (
                            <Eye size={17} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} events
          </div>
          <div className={styles.pagination}>
            <Pagination
              pagination={pagination}
              label="Admin event pages"
              onPageChange={(page) => onQueryChange({ page })}
            />
            <label>
              Rows per page
              <select
                aria-label="Rows per page"
                value={query.pageSize}
                onChange={(event) =>
                  onQueryChange({ pageSize: Number(event.target.value) })
                }
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
        </>
      )}
    </section>
  );
}
