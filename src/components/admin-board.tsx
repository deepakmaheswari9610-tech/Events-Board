"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/event-validation";
import { formatDate, formatPrice } from "@/lib/format";
import type { EventSummary } from "@/lib/types";
type AdminEvent = EventSummary & { active: boolean };
export function AdminBoard({ email }: { email: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<number[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEvents(data.events);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load events.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          startsAt: `${values.startsAt}:00+05:30`,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!response.ok) throw new Error(data.error);
      setEvents((current) =>
        [...current, data.event].sort(
          (a, b) => a.startsAt.localeCompare(b.startsAt) || a.id - b.id,
        ),
      );
      form.reset();
      setMessage("Event added. It is now active on the public board.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add event.");
    } finally {
      setSaving(false);
    }
  }
  async function toggle(event: AdminEvent) {
    setPending((current) => [...current, event.id]);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !event.active }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!response.ok) throw new Error(data.error);
      setEvents((current) =>
        current.map((value) => (value.id === event.id ? data.event : value)),
      );
      setMessage(
        `${event.title} is now ${data.event.active ? "active" : "inactive"}.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not change event status.",
      );
    } finally {
      setPending((current) => current.filter((id) => id !== event.id));
    }
  }
  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Try again.");
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">COMMUNITY ORGANISER</span>
          <h1>Your events board</h1>
          <p>{email}</p>
        </div>
        <button
          className="secondary-button"
          disabled={loggingOut}
          onClick={logout}
        >
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      {error && (
        <p className="form-error notice" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="form-success notice" role="status">
          {message}
        </p>
      )}
      <div className="admin-columns">
        <section className="admin-panel">
          <h2>Add a little something</h2>
          <p className="muted">
            New events are active when published. All times are in IST.
          </p>
          <form onSubmit={create} className="admin-form">
            <fieldset disabled={saving}>
              <label>
                Title
                <input
                  name="title"
                  required
                  maxLength={180}
                  placeholder="Acoustic night in the park"
                />
              </label>
              <div className="form-row">
                <label>
                  Category
                  <select name="category">
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  City
                  <input
                    name="city"
                    required
                    maxLength={100}
                    placeholder="Coimbatore"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Date and time (IST)
                  <input name="startsAt" type="datetime-local" required />
                </label>
                <label>
                  Price (₹)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    required
                    defaultValue="0"
                  />
                </label>
              </div>
              <label>
                Description
                <textarea
                  name="description"
                  required
                  maxLength={10000}
                  rows={4}
                />
              </label>
              <label>
                Image URL
                <input
                  name="imageUrl"
                  type="url"
                  required
                  maxLength={2048}
                  placeholder="https://…"
                />
              </label>
              <button className="button" disabled={saving}>
                {saving ? "Publishing…" : "Publish event ↗"}
              </button>
            </fieldset>
          </form>
        </section>
        <section className="admin-panel">
          <h2>Manage events</h2>
          <p className="muted">
            Inactive events stay saved and are hidden from visitors.
          </p>
          {loading ? (
            <p role="status">Loading your events…</p>
          ) : error && !events.length ? (
            <button className="secondary-button" onClick={load}>
              Retry loading events
            </button>
          ) : !events.length ? (
            <div className="state">
              <h3>Your board starts here</h3>
              <p>Add your first event using the form.</p>
            </div>
          ) : (
            <div className="admin-event-list">
              {events.map((event) => (
                <article key={event.id} className="admin-event">
                  <div>
                    <span
                      className={
                        event.active ? "status-pill active" : "status-pill"
                      }
                    >
                      {event.active ? "Active" : "Inactive"}
                    </span>
                    <h3>{event.title}</h3>
                    <p>
                      {event.category} · {event.city}
                    </p>
                    <p>
                      {formatDate(event.startsAt)} · {formatPrice(event.price)}
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={pending.includes(event.id)}
                    onClick={() => toggle(event)}
                    aria-label={`${event.active ? "Deactivate" : "Activate"} ${event.title}`}
                  >
                    {pending.includes(event.id)
                      ? "Saving…"
                      : event.active
                        ? "Make inactive"
                        : "Make active"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
