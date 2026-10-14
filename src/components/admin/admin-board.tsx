"use client";
import type { AdminEvent } from "@/lib/types";
import { useRef, useState } from "react";
import { AdminSidebar, type AdminView } from "./admin-sidebar";
import { AdminEventForm } from "./admin-event-form";
import { AdminEventList } from "./admin-event-list";
import { useAdminEvents } from "@/hooks/admin/use-admin-events";
import styles from "./admin.module.css";

export function AdminBoard({ email }: { email: string }) {
  const [view, setView] = useState<AdminView>("events");
  const [editing, setEditing] = useState<AdminEvent>();
  const heading = useRef<HTMLHeadingElement>(null);
  const board = useAdminEvents();
  const title =
    view === "events"
      ? "Events"
      : view === "edit"
        ? "Edit event"
        : "Create event";
  function navigate(next: AdminView) {
    setView(next);
    if (next !== "edit") setEditing(undefined);
    if (next !== "events") board.clearNotices();
    requestAnimationFrame(() => {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  return (
    <div className={styles.shell}>
      <AdminSidebar
        email={email}
        view={view}
        onNavigate={navigate}
        onLogout={board.logout}
        loggingOut={board.loggingOut}
      />
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <span>
            Community Events Board <span aria-hidden="true">/</span>{" "}
            <strong>{title}</strong>
          </span>
          <span className={styles.adminBadge}>Admin</span>
        </header>
        <div className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>
                {view === "events"
                  ? "Manage what’s happening in your community."
                  : view === "edit"
                    ? "Update your event details."
                    : "Publish a new event for your community."}
              </p>
            </div>
            {view === "events" && (
              <button
                className={styles.primary}
                onClick={() => navigate("create")}
              >
                <span aria-hidden="true">＋</span> Create event
              </button>
            )}
          </div>
          {board.error && (
            <p className={styles.error} role="alert">
              {board.error}
            </p>
          )}
          {board.message && (
            <p className={styles.success} role="status">
              {board.message}
            </p>
          )}
          {view === "events" ? (
            <>
              <div className={styles.metrics}>
                {[
                  ["Total events", board.stats.total],
                  ["Active", board.stats.active],
                  ["Inactive", board.stats.inactive],
                ].map(([label, count]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{board.loading ? "—" : count}</strong>
                  </div>
                ))}
              </div>
              <AdminEventList
                events={board.events}
                pagination={board.pagination}
                query={board.query}
                onQueryChange={board.updateQuery}
                onEdit={(event) => {
                  setEditing(event);
                  navigate("edit");
                }}
                loading={board.loading}
                error={board.error}
                pending={board.pending}
                onToggle={board.toggle}
                onRetry={board.load}
                onCreate={() => navigate("create")}
              />
              <p className={styles.note}>
                Only active, upcoming events appear on the public board.
                Inactive events remain saved.
              </p>
            </>
          ) : (
            <AdminEventForm
              key={editing?.id ?? "create"}
              event={editing}
              onSave={(input) => board.save(input, editing?.id)}
              onCancel={() => navigate("events")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
