"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminEvent,
  AdminEventsResponse,
  AdminEventQuery,
} from "@/lib/types";
import type { EventInput } from "@/lib/event-validation";
import { ClientApiError, requestJson, jsonBody } from "@/lib/client-api";
const initialPagination = { page: 1, pageSize: 10, total: 0, totalPages: 0 };
export function useAdminEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [query, setQuery] = useState<AdminEventQuery>({
    q: "",
    status: "all",
    sort: "date-asc",
    page: 1,
    pageSize: 10,
  });
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);
  function clearNotices() { setMessage(""); setError(""); }
  const [pending, setPending] = useState<number[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const request = useCallback(
    async <T>(url: string, options?: RequestInit): Promise<T> => {
      try {
        return await requestJson<T>(url, options);
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          router.replace("/admin/login");
          router.refresh();
        }
        throw error;
      }
    },
    [router],
  );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      ...query,
      page: String(query.page),
      pageSize: String(query.pageSize),
    });
    request<AdminEventsResponse>(`/api/admin/events?${params}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setEvents(data.events);
          setPagination(data.pagination);
          setStats(data.stats);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Could not load events.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, attempt, request]);
  function updateQuery(values: Partial<typeof query>) {
    setLoading(true);
    setQuery((current) => ({ ...current, page: 1, ...values }));
  }
  const load = () => setAttempt((value) => value + 1);
  async function save(input: EventInput, id?: number) {
    setError("");
    setMessage("");
    await request<{ event: AdminEvent }>(
      id ? `/api/admin/events/${id}` : "/api/admin/events",
      { method: id ? "PATCH" : "POST", ...jsonBody(input) },
    );
    setMessage(
      id ? "Event updated successfully." : "Event published successfully.",
    );
    load();
  }
  async function toggle(event: AdminEvent) {
    setPending((current) => [...current, event.id]);
    setError("");
    setMessage("");
    try {
      await request<{ event: AdminEvent }>(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        ...jsonBody({ active: !event.active }),
      });
      setMessage(
        `${event.title} is now ${event.active ? "inactive" : "active"}.`,
      );
      load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update event.",
      );
    } finally {
      setPending((current) => current.filter((id) => id !== event.id));
    }
  }
  async function logout() {
    setLoggingOut(true);
    try {
      await requestJson(
        "/api/admin/logout",
        { method: "POST" },
        "Could not sign out. Please try again.",
      );
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setLoggingOut(false);
    }
  }
  return {
    events,
    pagination,
    stats,
    query,
    updateQuery,
    loading,
    error,
    message,
    pending,
    loggingOut,
    load,
    save,
    toggle,
    logout,
    clearNotices,
  };
}
