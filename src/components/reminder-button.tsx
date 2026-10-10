"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVisitor } from "@/components/visitor-session";
export function ReminderButton({ eventId }: { eventId: number }) {
  const { user, loading } = useVisitor();
  return (
    <ReminderControl
      key={`${eventId}-${user?.id ?? "guest"}`}
      eventId={eventId}
      signedIn={!!user}
      sessionLoading={loading}
    />
  );
}
function ReminderControl({
  eventId,
  signedIn,
  sessionLoading,
}: {
  eventId: number;
  signedIn: boolean;
  sessionLoading: boolean;
}) {
  const router = useRouter();
  const [reminded, setReminded] = useState(false);
  const [loading, setLoading] = useState(signedIn);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(!signedIn);
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/events/${eventId}/reminder`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Couldn’t load your reminder.");
        if (!controller.signal.aborted) {
          setReminded(data.reminded);
          setLoaded(true);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Couldn’t load your reminder.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [eventId, signedIn, attempt]);
  async function toggle() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    if (pending || !loaded) return;
    const before = reminded;
    setReminded(!before);
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${eventId}/reminder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminded: !before }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Couldn’t save your reminder. Please try again.",
        );
      setReminded(data.reminded);
    } catch (error) {
      setReminded(before);
      setError(
        error instanceof Error
          ? error.message
          : "Couldn’t save your reminder. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="reminder-control">
      <button
        type="button"
        className={`reminder-button ${reminded ? "is-reminded" : ""}`}
        aria-pressed={reminded}
        aria-busy={pending}
        disabled={sessionLoading || loading || pending || !loaded}
        onClick={toggle}
      >
        <span aria-hidden="true">{reminded ? "✓" : "♧"}</span>
        {sessionLoading || loading
          ? "Loading reminder…"
          : reminded
            ? "Reminder saved"
            : "Remind me"}
        {pending && <span className="reminder-saving">Saving…</span>}
      </button>
      {error && (
        <p className="reminder-error" role="alert">
          {error}
          {!loaded && (
            <button
              className="text-button"
              onClick={() => setAttempt((v) => v + 1)}
            >
              Retry
            </button>
          )}
        </p>
      )}
    </div>
  );
}
