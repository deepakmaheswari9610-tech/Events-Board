"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import { categories } from "@/lib/event-validation";
import { EventsLoading } from "@/components/events-loading";
import type { EventSummary, EventsResponse } from "@/lib/types";
export function EventsBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const search = params.get("q") || "";
  const [draft, setDraft] = useState(search);
  const [result, setResult] = useState<EventsResponse | null>(null);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [citiesError, setCitiesError] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [citiesAttempt, setCitiesAttempt] = useState(0);
  useEffect(() => setDraft(search), [search]);
  useEffect(() => {
    const controller = new AbortController();
    setCitiesLoading(true);
    setCitiesError(false);
    fetch("/api/events/options", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("City options unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setCities(data.cities);
          setCitiesLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCitiesError(true);
          setCitiesLoading(false);
        }
      });
    return () => controller.abort();
  }, [citiesAttempt]);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    async function load() {
      try {
        const response = await fetch(`/api/events?${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Please try again in a moment.");
        if (!Array.isArray(data.events) || !data.pagination)
          throw new Error("Could not load events.");
        if (!controller.signal.aborted) {
          setResult(data);
          setLoadedQuery(query);
          setStatus("ready");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Please try again.",
          );
          setLoadedQuery(query);
          setStatus("error");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [query, attempt]);
  function update(values: Record<string, string>, paginate = false) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(values))
      value ? next.set(key, value) : next.delete(key);
    if (!paginate) next.delete("page");
    router.push(`/?${next.toString()}#events`, { scroll: false });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update({ q: draft.trim() });
  }
  const filtered = !!(category || city || search);
  const loading = status === "loading" || loadedQuery !== query;
  const options = city && !cities.includes(city) ? [city, ...cities] : cities;
  const pagination = result?.pagination;
  return (
    <>
      <div className="filter-bar">
        <form className="search-form" onSubmit={submit} role="search">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <span aria-hidden="true">⌕</span>
          <input
            id="event-search"
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={200}
            placeholder="Search music, food, a new experience…"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
        <label className="filter-select">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => update({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {category &&
              !categories.includes(category as (typeof categories)[number]) && (
                <option>{category}</option>
              )}
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span>City</span>
          <select
            value={city}
            disabled={citiesLoading}
            onChange={(event) => update({ city: event.target.value })}
          >
            <option value="">
              {citiesLoading ? "Loading cities…" : "All cities"}
            </option>
            {options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      {citiesError && (
        <p className="filter-note" role="alert">
          City options couldn’t load.{" "}
          <button
            className="text-button"
            onClick={() => setCitiesAttempt((v) => v + 1)}
          >
            Retry
          </button>
        </p>
      )}
      {filtered && (
        <div className="filter-summary">
          <span>
            Showing {category || "all categories"}
            {city ? ` in ${city}` : " in all cities"}
            {search ? ` matching “${search}”` : ""}
          </span>
          <button
            className="text-button"
            onClick={() => {
              setDraft("");
              update({ category: "", city: "", q: "" });
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {loading ? (
        <EventsLoading />
      ) : status === "error" ? (
        <div className="state" role="alert">
          <span aria-hidden="true">☁</span>
          <h3>We couldn’t load the board</h3>
          <p>{error}</p>
          <button className="button" onClick={() => setAttempt((v) => v + 1)}>
            Try again ↻
          </button>
        </div>
      ) : !result?.events.length ? (
        <div className="state" role="status">
          <span aria-hidden="true">✳</span>
          <h3>
            {filtered
              ? "No plans match just yet"
              : "Good things are on their way"}
          </h3>
          <p>
            {filtered
              ? "Try another city, category or search to find your next good day."
              : "There are no upcoming events yet. Check back soon for something lovely near you."}
          </p>
          {filtered && (
            <button
              className="button"
              onClick={() => {
                setDraft("");
                update({ category: "", city: "", q: "" });
              }}
            >
              Explore all events
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="result-count" role="status">
            Showing {(pagination!.page - 1) * pagination!.pageSize + 1}–
            {Math.min(
              pagination!.page * pagination!.pageSize,
              pagination!.total,
            )}{" "}
            of {pagination!.total} upcoming events · Times shown in IST
          </p>
          <div className="event-grid">
            {result.events.map((event: EventSummary) => (
              <article className="event-card" key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="event-card-link"
                  aria-label={`View ${event.title}`}
                >
                  <div
                    className={`event-image image-${event.category.toLowerCase()}`}
                  >
                    <img
                      src={event.imageUrl}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                    <span
                      className={`category category-${event.category.toLowerCase()}`}
                    >
                      {event.category}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="event-date">{formatDate(event.startsAt)}</p>
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="card-bottom">
                      <span>⌖ {event.city}</span>
                      <strong>{formatPrice(event.price)}</strong>
                    </div>
                    <span className="view-event">
                      View event <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          {pagination!.totalPages > 1 && (
            <nav className="pagination" aria-label="Event pages">
              <button
                className="secondary-button"
                disabled={pagination!.page <= 1}
                onClick={() =>
                  update({ page: String(pagination!.page - 1) }, true)
                }
              >
                ← Previous
              </button>
              <span>
                Page {pagination!.page} of {pagination!.totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={pagination!.page >= pagination!.totalPages}
                onClick={() =>
                  update({ page: String(pagination!.page + 1) }, true)
                }
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
