"use client";
import Link from "next/link";
import { ReminderButton } from "@/components/reminder-button";
import { CardDesigner } from "@/components/card-designer";
import { useEffect, useState } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import type { EventSummary } from "@/lib/types";
export function EventDetail({ id }: { id: number }) {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/events/${id}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (controller.signal.aborted) return;
        if (response.status === 404) {
          setStatus("missing");
          return;
        }
        if (!response.ok) throw new Error("Event unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setEvent(data.event);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [id, attempt]);
  return (
    <>
      <Link className="back-link" href="/#events">
        ← Back to events
      </Link>
      {status === "loading" ? (
        <div
          className="detail-skeleton skeleton"
          aria-label="Loading event"
          aria-busy="true"
        >
          <div />
          <span />
          <span />
        </div>
      ) : status === "missing" ? (
        <div className="state" role="status">
          <span aria-hidden="true">✳</span>
          <h1>This plan has moved on</h1>
          <p>
            This event may have ended or is no longer active. There are more
            good things to discover.
          </p>
          <Link className="button" href="/#events">
            Explore events
          </Link>
        </div>
      ) : status === "error" ? (
        <div className="state" role="alert">
          <h2>We couldn’t load this event</h2>
          <p>Please try again in a moment.</p>
          <button className="button" onClick={() => setAttempt((v) => v + 1)}>
            Try again ↻
          </button>
        </div>
      ) : (
        event && (
          <article className="event-detail">
            <div
              className={`detail-image image-${event.category.toLowerCase()}`}
            >
              <img
                src={event.imageUrl}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span
                className={`category category-${event.category.toLowerCase()}`}
              >
                {event.category}
              </span>
            </div>
            <div className="detail-body">
              <div className="detail-title">
                <div>
                  <span className="eyebrow">
                    A GOOD DAY IN {event.city.toUpperCase()}
                  </span>
                  <h1>{event.title}</h1>
                </div>
                <span className="detail-price">
                  {formatPrice(event.price)}
                  <small>
                    {Number(event.price) === 0
                      ? "Everyone’s welcome"
                      : "Event price"}
                  </small>
                </span>
              </div>
              <div className="detail-facts">
                <p>
                  <span aria-hidden="true">◷</span>
                  <span>
                    {formatDate(event.startsAt)}
                    <small>Indian Standard Time (IST)</small>
                  </span>
                </p>
                <p>
                  <span aria-hidden="true">⌖</span>
                  <span>
                    {event.city}
                    <small>{event.category} event</small>
                  </span>
                </p>
              </div>
              <div className="detail-reminder">
                <ReminderButton eventId={event.id} />
              </div>
              <section className="detail-description">
                <h2>A little about this event</h2>
                <p>{event.description}</p>
              </section>
              <CardDesigner event={event} />
            </div>
          </article>
        )
      )}
    </>
  );
}
