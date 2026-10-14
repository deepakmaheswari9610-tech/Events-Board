"use client";
import { Pagination } from "@/components/shared/pagination";
import Link from "next/link";
import { readApiResponse } from "@/lib/client-api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVisitor } from "@/components/user/visitor-session";
import { EventsLoading } from "@/components/events/events-loading";
import { EventCard } from "@/components/events/event-card";
import type { EventsResponse, CategoryOption } from "@/lib/types";
type FeedResponse = EventsResponse & { categories: CategoryOption[] };
export function MyFeed() {
  const router = useRouter();
  const { setUser } = useVisitor();
  const [data, setData] = useState<FeedResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/feed?page=${page}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (response.status === 401) {
          setUser(null);
          router.replace("/login");
          return;
        }
        const result = await readApiResponse<FeedResponse>(response);
        if (!controller.signal.aborted) {
          setData(result);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Please try again.",
          );
          setStatus("error");
        }
      });
    return () => controller.abort();
  }, [page, attempt, router, setUser]);
  function goToPage(value: number) {
    setStatus("loading");
    setPage(value);
    document.getElementById("feed-heading")?.scrollIntoView({ block: "start" });
  }
  return (
    <>
      <div className="feed-heading" id="feed-heading">
        <div>
          <span className="eyebrow">PICKED FROM THE THINGS YOU LOVE</span>
          <h1>My Feed</h1>
          <p>Your favourite categories. Your next local adventure.</p>
        </div>
        <Link className="secondary-button" href="/favourites">
          Edit favourites
        </Link>
      </div>
      {status === "loading" ? (
        <EventsLoading />
      ) : status === "error" ? (
        <div className="state" role="alert">
          <h2>We couldn’t load your feed</h2>
          <p>{error}</p>
          <button className="button" onClick={() => setAttempt((v) => v + 1)}>
            Try again ↻
          </button>
        </div>
      ) : (
        data && (
          <>
            <div className="feed-categories">
              {data.categories.map((category) => (
                <span
                  className={`category-chip category-${category.name.toLowerCase()}`}
                  key={category.id}
                >
                  {category.name}
                </span>
              ))}
            </div>
            {!data.categories.length ? (
              <div className="state">
                <span aria-hidden="true">✳</span>
                <h2>Let’s make this feed yours</h2>
                <p>
                  Choose a few favourite categories and we’ll show you the
                  upcoming events that match.
                </p>
                <Link className="button" href="/favourites">
                  Choose my favourites ↗
                </Link>
              </div>
            ) : !data.events.length ? (
              <div className="state">
                <span aria-hidden="true">✳</span>
                <h2>A good day is on its way</h2>
                <p>
                  No upcoming events match your favourites yet. Try another
                  category or browse what’s happening nearby.
                </p>
                <Link className="button" href="/">
                  Explore all events ↗
                </Link>
              </div>
            ) : (
              <>
                <p className="result-count" role="status">
                  {data.pagination.total} upcoming events for you
                </p>
                <div className="event-grid">
                  {data.events.map((event) => (
                    <EventCard event={event} key={event.id} />
                  ))}
                </div>
                <Pagination
                  pagination={data.pagination}
                  label="Feed pages"
                  onPageChange={goToPage}
                />
              </>
            )}
          </>
        )
      )}
    </>
  );
}
