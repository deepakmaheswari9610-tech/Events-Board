"use client";
import { Pagination } from "@/components/shared/pagination";
import { readApiResponse } from "@/lib/client-api";
import { EventCard } from "@/components/events/event-card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { EventsLoading } from "@/components/events/events-loading";
import type { EventSummary, EventsResponse, LookupOption } from "@/lib/types";
export function EventsBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const legacyCategory = params.get("category") || "";
  const category =
    params.get("categoryId") ||
    String(
      categories.find(
        (item) => item.name.toLowerCase() === legacyCategory.toLowerCase(),
      )?.id ?? "",
    );
  const categoryName =
    categories.find((item) => String(item.id) === category)?.name ||
    legacyCategory;
  const [cities, setCities] = useState<LookupOption[]>([]);
  const legacyCity = params.get("city") || "";
  const city =
    params.get("cityId") ||
    String(
      cities.find(
        (item) => item.name.toLowerCase() === legacyCity.toLowerCase(),
      )?.id ?? "",
    );
  const cityName =
    cities.find((item) => String(item.id) === city)?.name || legacyCity;
  const search = params.get("q") || "";
  const [draft, setDraft] = useState(search);
  const [result, setResult] = useState<EventsResponse | null>(null);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [citiesError, setCitiesError] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [citiesAttempt, setCitiesAttempt] = useState(0);
  useEffect(() => setDraft(search), [search]);
  useEffect(() => {
    if (window.location.hash === "#events") {
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setCitiesLoading(true);
    setCitiesError(false);
    fetch("/api/events/options", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await readApiResponse<{
          cities: LookupOption[];
          categories: LookupOption[];
        }>(response, "City options unavailable");
        if (!controller.signal.aborted) {
          setCities(data.cities);
          setCategories(data.categories);
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
        const data = await readApiResponse<EventsResponse>(
          response,
          "Please try again in a moment.",
        );
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
    const params = next.toString();
    router.push(params ? `/?${params}` : "/", { scroll: false });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update({ q: draft.trim() });
  }
  const filtered = !!(
    category ||
    legacyCategory ||
    city ||
    legacyCity ||
    search
  );
  const loading = status === "loading" || loadedQuery !== query;

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
            onChange={(event) =>
              update({ categoryId: event.target.value, category: "" })
            }
            disabled={citiesLoading}
          >
            <option value="">All categories</option>
            {category &&
              !categories.some((item) => String(item.id) === category) && (
                <option value={category}>Selected category unavailable</option>
              )}
            {categories.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span>City</span>
          <select
            value={city}
            disabled={citiesLoading}
            onChange={(event) =>
              update({ cityId: event.target.value, city: "" })
            }
          >
            <option value="">
              {citiesLoading ? "Loading cities…" : "All cities"}
            </option>
            {city && !cities.some((item) => String(item.id) === city) && (
              <option value={city}>Selected city unavailable</option>
            )}
            {cities.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {citiesError && (
        <p className="filter-note" role="alert">
          Filter options couldn’t load.{" "}
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
            Showing {categoryName || "all categories"}
            {cityName ? ` in ${cityName}` : " in all cities"}
            {search ? ` matching “${search}”` : ""}
          </span>
          <button
            className="text-button"
            onClick={() => {
              setDraft("");
              update({
                categoryId: "",
                category: "",
                cityId: "",
                city: "",
                q: "",
              });
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
                update({
                  categoryId: "",
                  category: "",
                  cityId: "",
                  city: "",
                  q: "",
                });
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
            of {pagination!.total} upcoming events
          </p>
          <div className="event-grid">
            {result.events.map((event: EventSummary) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
          <Pagination
            pagination={pagination!}
            label="Event pages"
            onPageChange={(page) => update({ page: String(page) }, true)}
          />
        </>
      )}
    </>
  );
}
