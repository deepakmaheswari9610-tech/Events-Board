import { RequiredMark } from "@/components/shared/required-mark";
import { useFormValidation } from "@/hooks/shared/use-form-validation";
import { FieldError } from "@/components/shared/field-error";
import { catalogNameInput } from "@/lib/catalog-validation";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useCatalog } from "@/hooks/shared/use-catalog";
import { requestJson, jsonBody, ClientApiError } from "@/lib/client-api";
import type { CatalogResource, LookupOption } from "@/lib/types";
import styles from "./admin.module.css";
const fields = {
  categories: {
    label: "Category",
    singular: "category",
    name: "categoryId",
    example: "Theatre",
  },
  cities: {
    label: "City",
    singular: "city",
    name: "cityId",
    example: "Hyderabad",
  },
} as const;
export function AdminCatalogSelect({
  resource,
  initialId,
  error: fieldError,
  errorId,
}: {
  resource: CatalogResource;
  initialId?: number;
  error?: string;
  errorId?: string;
}) {
  const validation = useFormValidation();
  const field = fields[resource];
  const catalog = useCatalog(resource);
  const [selected, setSelected] = useState(initialId ? String(initialId) : "");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    if (saving) return;
    const input = validation.validate(catalogNameInput, { name });
    if (!input) return;
    setSaving(true);
    setError("");
    try {
      const data = await requestJson<
        Partial<Record<"category" | "city", LookupOption>>
      >(`/api/admin/${resource}`, { method: "POST", ...jsonBody(input) });
      const option = data[field.singular];
      if (!option) throw new Error(`Could not create ${field.singular}.`);
      catalog.addOption(option);
      setSelected(String(option.id));
      setAdding(false);
      setName("");
    } catch (error) {
      if (error instanceof ClientApiError && error.status === 409)
        catalog.retry();
      setError(
        error instanceof Error
          ? error.message
          : `Could not create ${field.singular}.`,
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className={styles.lookupField}>
      <label htmlFor={`event-${field.singular}`}>
        <span>{field.label} <RequiredMark /></span>
      </label>
      <select
        id={`event-${field.singular}`}
        name={field.name}
        aria-invalid={!!fieldError}
        aria-describedby={fieldError ? errorId : undefined}
        required
        value={selected}
        disabled={catalog.loading || !!catalog.error || saving}
        onChange={(event) => setSelected(event.target.value)}
      >
        <option value="" disabled>
          {catalog.loading
            ? `Loading ${resource}…`
            : `Select ${field.singular}`}
        </option>
        {catalog.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <FieldError id={errorId ?? `${field.name}-error`} message={fieldError} />
      {!adding ? (
        <button
          type="button"
          className={styles.lookupLink}
          onClick={() => {
            setAdding(true);
            setError("");
          }}
        >
          <Plus size={13} aria-hidden="true" /> Create new {field.singular}
        </button>
      ) : (
        <div className={styles.lookupCreate}>
          <label htmlFor={`new-${field.singular}-name`}>
            <span>New {field.singular} name <RequiredMark /></span>
          </label>
          <input
            id={`new-${field.singular}-name`}
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              validation.clear("name");
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void create();
              }
            }}
            {...validation.props("name")}
            maxLength={100}
            placeholder={`For example, ${field.example}`}
            disabled={saving}
          />
          <FieldError
            id={validation.errorId("name")}
            message={validation.errors.name}
          />
          <div>
            <button
              type="button"
              className={styles.secondary}
              disabled={saving}
              onClick={create}
            >
              {saving ? "Creating…" : `Add ${field.singular}`}
            </button>
            <button
              type="button"
              className={styles.rowAction}
              disabled={saving}
              onClick={() => setAdding(false)}
              aria-label={`Cancel new ${field.singular}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      {(error || catalog.error) && (
        <p role="alert" className={styles.error}>
          {error || catalog.error}
          {catalog.error && (
            <button
              type="button"
              className={styles.lookupLink}
              onClick={catalog.retry}
            >
              Retry {resource}
            </button>
          )}
        </p>
      )}
      {!catalog.loading && !catalog.error && !catalog.options.length && (
        <small>Create your first {field.singular} to continue.</small>
      )}
    </div>
  );
}
