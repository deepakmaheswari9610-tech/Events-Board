"use client";
import { useId, useState } from "react";
import type { ZodType } from "zod";
export function useFormValidation() {
  const prefix = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate<T>(
    schema: ZodType<T>,
    values: unknown,
    form?: HTMLFormElement,
  ) {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? "form");
      next[field] ??=
        field === "categoryId"
          ? "Choose a category."
          : field === "cityId"
            ? "Choose a city."
            : issue.message;
    }
    setErrors(next);
    const first = form?.elements.namedItem(Object.keys(next)[0]);
    if (first instanceof HTMLElement) first.focus();
    return undefined;
  }
  function clear(field: string) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }
  function props(field: string) {
    return {
      "aria-invalid": !!errors[field],
      "aria-describedby": errors[field]
        ? `${prefix}-${field}-error`
        : undefined,
    };
  }
  function errorId(field: string) {
    return `${prefix}-${field}-error`;
  }
  return { errors, validate, clear, props, errorId };
}
