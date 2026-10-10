"use client";
import Link from "next/link";
import { ReminderButton } from "@/components/reminder-button";
import { formatDate, formatPrice } from "@/lib/format";
import type { EventSummary } from "@/lib/types";
export function EventCard({ event }: { event: EventSummary }) {
  return (
    <article className="event-card">
      <Link
        href={`/events/${event.id}`}
        className="event-card-link"
        aria-label={`View ${event.title}`}
      >
        <div className={`event-image image-${event.category.toLowerCase()}`}>
          <img
            src={event.imageUrl}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <span className={`category category-${event.category.toLowerCase()}`}>
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
      <div className="event-card-actions">
        <ReminderButton eventId={event.id} />
      </div>
    </article>
  );
}
