"use client";
import Link from "next/link";
import { readApiResponse, jsonBody } from "@/lib/client-api";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { favouritesInput } from "@/lib/visitor-validation";
import { useCatalog } from "@/hooks/shared/use-catalog";
import { Tags } from "lucide-react";
import { useVisitor } from "@/components/user/visitor-session";
export function FavouritePicker() {
  const router = useRouter();
  const { setUser } = useVisitor();
  const catalog = useCatalog("categories");
  const [selected, setSelected] = useState<number[]>([]);
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
        const data = await readApiResponse<{ categoryIds: number[] }>(
          response,
          "Could not load favourites.",
        );
        if (!controller.signal.aborted) {
          setSelected(data.categoryIds);
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
    setError("");
    const input = favouritesInput.safeParse({ categoryIds: selected });
    if (!input.success) {
      setError(input.error.issues[0]?.message || "Check your selection.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/favourites", {
        method: "PUT",
        ...jsonBody(input.data),
      });
      if (response.status === 401) {
        setUser(null);
        router.replace("/login");
        return;
      }
      await readApiResponse(response, "Could not save favourites.");
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
      {loading || catalog.loading ? (
        <div className="state" role="status">
          Loading your favourites…
        </div>
      ) : (
        <form onSubmit={save}>
          <fieldset
            className="category-choices"
            disabled={saving || !loaded || !!catalog.error}
          >
            <legend className="sr-only">Favourite categories</legend>
            {catalog.options.map((category) => (
              <label
                className={`category-choice ${selected.includes(category.id) ? "selected" : ""}`}
                key={category.id}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(category.id)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(category.id)
                        ? current.filter((value) => value !== category.id)
                        : [...current, category.id],
                    )
                  }
                />
                <span className="choice-icon" aria-hidden="true">
                  <Tags size={24} aria-hidden="true" />
                </span>
                <span>
                  <strong>{category.name}</strong>
                  <small>
                    Discover local {category.name.toLowerCase()} events
                  </small>
                </span>
                <span className="choice-check" aria-hidden="true">
                  {selected.includes(category.id) ? "✓" : "+"}
                </span>
              </label>
            ))}
          </fieldset>
          {catalog.error && (
            <p className="form-error" role="alert">
              {catalog.error}{" "}
              <button
                type="button"
                className="text-button"
                onClick={catalog.retry}
              >
                Retry categories
              </button>
            </p>
          )}
          {!catalog.loading && !catalog.error && !catalog.options.length && (
            <p>No categories have been added yet. Check back soon.</p>
          )}
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
            <button
              className="button"
              disabled={saving || !loaded || !!catalog.error}
            >
              {saving ? "Saving…" : "Save & see my feed ↗"}
            </button>
          </div>
          <p className="preferences-note">
            You can change these anytime. No selection means an empty personal
            feed.
          </p>
        </form>
      )}
      <Link className="back-link" href="/">
        ← Browse all events
      </Link>
    </section>
  );
}
