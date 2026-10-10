"use client";
import { useEffect, useState } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import type { EventSummary } from "@/lib/types";
export function EventsBoard() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch("/api/events", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not load events");
        const data = await response.json();
        if (!Array.isArray(data.events))
          throw new Error("Invalid events response");
        setEvents(data.events);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  if (status === "loading")
    return (
      <div className="event-grid" aria-busy="true" aria-label="Loading events">
        {[1, 2, 3].map((id) => (
          <div key={id} className="skeleton">
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    );
  if (status === "error")
    return (
      <div className="state" role="alert">
        <span aria-hidden="true">☁</span>
        <h3>We couldn’t load the board</h3>
        <p>
          Please try again in a moment. If you’re setting up the app, check the
          MySQL connection and run the database setup.
        </p>
        <button
          className="button"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Try again ↻
        </button>
      </div>
    );
  if (!events.length)
    return (
      <div className="state">
        <span aria-hidden="true">✳</span>
        <h3>Good things are on their way</h3>
        <p>
          There are no upcoming events yet. Check back soon for something lovely
          near you.
        </p>
      </div>
    );
  return (
    <>
      <p className="result-count">
        {events.length} upcoming events · Times shown in IST
      </p>
      <div className="event-grid">
        {events.map((event) => (
          <article className="event-card" key={event.id}>
            <div
              className={"event-image image-" + event.category.toLowerCase()}
            >
              <img
                src={event.imageUrl}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span
                className={"category category-" + event.category.toLowerCase()}
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
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
