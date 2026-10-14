import { RequiredMark } from "@/components/shared/required-mark";
import { useFormValidation } from "@/hooks/shared/use-form-validation";
import { FieldError } from "@/components/shared/field-error";
import { useState, type FormEvent } from "react";
import type { AdminEvent } from "@/lib/types";
import { AdminCatalogSelect } from "./admin-catalog-select";
import {
  eventDetailsInput,
  eventInput,
  DESCRIPTION_MAX_LENGTH,
  type EventInput,
} from "@/lib/event-validation";
import styles from "./admin.module.css";
export function AdminEventForm({
  onSave,
  event: initialEvent,
  onCancel,
}: {
  onSave: (input: EventInput) => Promise<void>;
  event?: AdminEvent;
  onCancel: () => void;
}) {
  const validation = useFormValidation();
  const [description, setDescription] = useState(
    initialEvent?.description ?? "",
  );
  const minimumDate = new Date(Date.now() + 330 * 60000 + 60000)
    .toISOString()
    .slice(0, 16);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(
      new FormData(event.currentTarget),
    ) as Record<string, string>;
    setError("");
    const input = validation.validate(
      initialEvent ? eventDetailsInput : eventInput,
      {
        ...values,
        categoryId: Number(values.categoryId),
        cityId: Number(values.cityId),
        startsAt: values.startsAt
          ? `${values.startsAt.length === 16 ? values.startsAt + ":00" : values.startsAt}+05:30`
          : "",
      },
      event.currentTarget,
    );
    if (!input) return;
    setSaving(true);
    try {
      await onSave(input);
      onCancel();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not publish event.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className={styles.formPanel}>
      <div className={styles.panelHeading}>
        <h2>Event details</h2>
        <p>
          Fields marked * are required. Choose a future date and time (IST).
        </p>
      </div>
      <form
        noValidate
        onChange={(event) => {
          validation.clear((event.target as unknown as HTMLInputElement).name);
          setError("");
        }}
        onSubmit={submit}
        className={styles.form}
      >
        <fieldset disabled={saving}>
          <label>
            <span>
              Title <RequiredMark />
            </span>
            <input
              name="title"
              aria-label="Title"
              {...validation.props("title")}
              defaultValue={initialEvent?.title}
              required
              maxLength={180}
              placeholder="Enter event title"
            />
            <FieldError
              id={validation.errorId("title")}
              message={validation.errors.title}
            />
          </label>
          <div className={styles.formRow}>
            <AdminCatalogSelect
              resource="categories"
              error={validation.errors.categoryId}
              errorId={validation.errorId("categoryId")}
              initialId={initialEvent?.categoryId}
            />
            <AdminCatalogSelect
              resource="cities"
              error={validation.errors.cityId}
              errorId={validation.errorId("cityId")}
              initialId={initialEvent?.cityId}
            />
          </div>
          <div className={styles.formRow}>
            <label>
              <span>
                Date and time (IST) <RequiredMark />
              </span>
              <input
                name="startsAt"
                aria-label="Date and time (IST)"
                {...validation.props("startsAt")}
                type="datetime-local"
                step="1"
                min={minimumDate}
                required
                defaultValue={
                  initialEvent
                    ? new Date(Date.parse(initialEvent.startsAt) + 330 * 60000)
                        .toISOString()
                        .slice(0, 19)
                    : ""
                }
              />
              <FieldError
                id={validation.errorId("startsAt")}
                message={validation.errors.startsAt}
              />
            </label>
            <label>
              <span>
                Price (₹) <RequiredMark />
              </span>
              <input
                name="price"
                aria-label="Price (₹)"
                {...validation.props("price")}
                defaultValue={initialEvent?.price}
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
                placeholder="0 for free entry"
              />
              <FieldError
                id={validation.errorId("price")}
                message={validation.errors.price}
              />
            </label>
          </div>
          <label>
            <span>
              Description <RequiredMark />
            </span>
            <textarea
              name="description"
              aria-label="Description"
              {...validation.props("description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={5}
              placeholder="Tell visitors what to expect"
              aria-describedby={[
                validation.props("description")["aria-describedby"],
                "description-limit",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <small id="description-limit" className="field-hint">
              {description.length.toLocaleString("en-IN")} /{" "}
              {DESCRIPTION_MAX_LENGTH.toLocaleString("en-IN")} characters
            </small>
            <FieldError
              id={validation.errorId("description")}
              message={validation.errors.description}
            />
          </label>
          <label>
            <span>
              Image URL <RequiredMark />
            </span>
            <input
              name="imageUrl"
              aria-label="Image URL"
              {...validation.props("imageUrl")}
              defaultValue={initialEvent?.imageUrl}
              type="url"
              required
              maxLength={2048}
              placeholder="https://…"
            />
            <FieldError
              id={validation.errorId("imageUrl")}
              message={validation.errors.imageUrl}
            />
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button className={styles.primary} disabled={saving}>
              {saving
                ? "Saving…"
                : initialEvent
                  ? "Save changes"
                  : "Publish event"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
