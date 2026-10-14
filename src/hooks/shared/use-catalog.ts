"use client";
import { useCallback, useEffect, useState } from "react";
import { requestJson } from "@/lib/client-api";
import type { CatalogResource, LookupOption } from "@/lib/types";
export function useCatalog(resource: CatalogResource) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    requestJson<Partial<Record<CatalogResource, LookupOption[]>>>(
      `/api/${resource}`,
      { signal: controller.signal },
      `Could not load ${resource}.`,
    )
      .then((data) => {
        const entries = data[resource];
        if (!Array.isArray(entries))
          throw new Error(`Could not load ${resource}.`);
        if (!controller.signal.aborted) setOptions(entries);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : `Could not load ${resource}.`,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [resource, attempt]);
  const addOption = useCallback(
    (option: LookupOption) =>
      setOptions((current) =>
        [...current.filter((item) => item.id !== option.id), option].sort(
          (a, b) => a.name.localeCompare(b.name),
        ),
      ),
    [],
  );
  return {
    options,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
    addOption,
  };
}
