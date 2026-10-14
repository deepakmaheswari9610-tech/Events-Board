"use client";
import Link from "next/link";
import { requestJson, jsonBody } from "@/lib/client-api";
import { useEffect, useState } from "react";
import { useVisitor } from "@/components/user/visitor-session";
import {
  themes,
  stickers,
  defaultDesign,
  type CardChoice,
} from "@/lib/card-design";
import { formatDate, formatPrice } from "@/lib/format";
import type { EventSummary } from "@/lib/types";
export function CardDesigner({ event }: { event: EventSummary }) {
  const { user } = useVisitor();
  return (
    <Designer
      key={`${event.id}-${user?.id ?? "guest"}`}
      event={event}
      signedIn={!!user}
    />
  );
}
function Designer({
  event,
  signedIn,
}: {
  event: EventSummary;
  signedIn: boolean;
}) {
  const [design, setDesign] = useState<CardChoice>(defaultDesign);
  const [loading, setLoading] = useState(signedIn);
  const [loaded, setLoaded] = useState(!signedIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    requestJson<{ design: CardChoice }>(`/api/events/${event.id}/design`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setDesign(data.design);
          setLoaded(true);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Couldn’t load your design.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [event.id, signedIn, attempt]);
  async function change(next: CardChoice) {
    if (saving || loading || !loaded) return;
    const before = design;
    setDesign(next);
    setError("");
    setSaved(false);
    if (!signedIn) return;
    setSaving(true);
    try {
      const data = await requestJson<{ design: CardChoice }>(
        `/api/events/${event.id}/design`,
        {
          method: "PUT",
          ...jsonBody(next),
        },
        "Couldn’t save your design.",
      );
      setDesign(data.design);
      setSaved(true);
    } catch (error) {
      setDesign(before);
      setError(
        error instanceof Error
          ? error.message
          : "Couldn’t save your design. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  const busy = loading || saving || !loaded;
  return (
    <section className="card-designer" aria-labelledby="designer-heading">
      <div className="designer-heading">
        <div>
          <span className="eyebrow">MAKE IT A LITTLE MORE YOU</span>
          <h2 id="designer-heading">Design your card</h2>
          <p>Pick a mood. Add a little personality.</p>
        </div>
        <span className="design-save-status" role="status">
          {loading
            ? "Loading…"
            : saving
              ? "Saving…"
              : saved
                ? "✓ Saved"
                : signedIn
                  ? "Changes save automatically"
                  : "Preview your card"}
        </span>
      </div>
      <div className="designer-grid">
        <div
          className={`designed-card theme-${design.theme.toLowerCase()}`}
          aria-label="Your live event card preview"
        >
          <span className="designed-category">
            {event.category} · {event.city}
          </span>
          <h3>{event.title}</h3>
          <p>{formatDate(event.startsAt)}</p>
          <strong>{formatPrice(event.price)}</strong>
          <div className="card-stickers">
            {design.stickers.map((id, index) => (
              <button
                type="button"
                key={`${id}-${index}`}
                className="placed-sticker"
                disabled={busy}
                aria-label={`Remove ${stickers.find((s) => s.id === id)!.label} sticker ${index + 1}`}
                onClick={() =>
                  change({
                    ...design,
                    stickers: design.stickers.filter(
                      (_, position) => position !== index,
                    ),
                  })
                }
              >
                {stickers.find((s) => s.id === id)!.emoji}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
          <span className="designed-brand">✳ neighbourhood</span>
        </div>
        <div className="designer-controls">
          <fieldset disabled={busy}>
            <legend>1. Choose a background</legend>
            <div className="theme-options">
              {themes.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  className={`theme-option theme-${theme.id.toLowerCase()} ${design.theme === theme.id ? "chosen" : ""}`}
                  aria-pressed={design.theme === theme.id}
                  onClick={() => change({ ...design, theme: theme.id })}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>
              2. Add a sticker <span>({design.stickers.length}/3)</span>
            </legend>
            <div className="sticker-options">
              {stickers.map((sticker) => (
                <button
                  type="button"
                  key={sticker.id}
                  className="sticker-option"
                  aria-label={`Add ${sticker.label} sticker`}
                  title={sticker.label}
                  disabled={
                    design.stickers.length >= 3 ||
                    design.stickers.includes(sticker.id)
                  }
                  aria-pressed={design.stickers.includes(sticker.id)}
                  onClick={() =>
                    change({
                      ...design,
                      stickers: [...design.stickers, sticker.id],
                    })
                  }
                >
                  {sticker.emoji}
                </button>
              ))}
            </div>
            <p className="sticker-hint">
              Up to three different stickers. Tap one on the card to remove it.
            </p>
          </fieldset>
          {!signedIn && (
            <p className="designer-signin">
              <Link href="/login">Sign in</Link> to save this card for your next
              visit.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
              {!loaded && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setAttempt((v) => v + 1)}
                >
                  Retry loading
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
