"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/event-validation";
import { useVisitor } from "@/components/visitor-session";
const descriptions = {
  Music: ["♪", "Live sounds & lovely evenings"],
  Workshop: ["✎", "New skills & a little creativity"],
  Food: ["♨", "Local flavours & shared tables"],
  Sports: ["◉", "Get moving with your community"],
  Kids: ["✳", "Big adventures for little people"],
};
export function FavouritePicker() {
  const router = useRouter();
  const { setUser } = useVisitor();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/favourites", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          setUser(null);
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load favourites.");
        if (!controller.signal.aborted) {
          setSelected(data.categories);
          setLoaded(true);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load favourites.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt, router, setUser]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/favourites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selected }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setUser(null);
        router.replace("/login");
        return;
      }
      if (!response.ok)
        throw new Error(data.error || "Could not save favourites.");
      router.push("/feed");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save favourites.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="preferences-panel">
      <span className="eyebrow">FOLLOW YOUR KIND OF GOOD DAY</span>
      <h1>What brings you out?</h1>
      <p>Pick the categories you love. Your feed will take it from here.</p>
      {loading ? (
        <div className="state" role="status">
          Loading your favourites…
        </div>
      ) : (
        <form onSubmit={save}>
          <fieldset className="category-choices" disabled={saving || !loaded}>
            <legend className="sr-only">Favourite categories</legend>
            {categories.map((category) => (
              <label
                className={`category-choice ${selected.includes(category) ? "selected" : ""}`}
                key={category}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(category)
                        ? current.filter((value) => value !== category)
                        : [...current, category],
                    )
                  }
                />
                <span className="choice-icon" aria-hidden="true">
                  {descriptions[category][0]}
                </span>
                <span>
                  <strong>{category}</strong>
                  <small>{descriptions[category][1]}</small>
                </span>
                <span className="choice-check" aria-hidden="true">
                  {selected.includes(category) ? "✓" : "+"}
                </span>
              </label>
            ))}
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => setAttempt((v) => v + 1)}
              >
                Reload favourites
              </button>
            </p>
          )}
          <div className="preference-actions">
            <span>
              {selected.length
                ? `${selected.length} ${selected.length === 1 ? "category" : "categories"} selected`
                : "No categories selected yet"}
            </span>
            <button className="button" disabled={saving || !loaded}>
              {saving ? "Saving…" : "Save & see my feed ↗"}
            </button>
          </div>
          <p className="preferences-note">
            You can change these anytime. No selection means an empty personal
            feed.
          </p>
        </form>
      )}
      <Link className="back-link" href="/#events">
        ← Browse all events
      </Link>
    </section>
  );
}
