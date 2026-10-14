import Link from "next/link";
import styles from "./admin.module.css";
export type AdminView = "events" | "create" | "edit";
export function AdminSidebar({
  email,
  view,
  onNavigate,
  onLogout,
  loggingOut,
}: {
  email: string;
  view: AdminView;
  onNavigate: (view: AdminView) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        <span aria-hidden="true">✳</span>
        <div>
          neighbourhood<small>ADMIN WORKSPACE</small>
        </div>
      </Link>
      <div className={styles.navLabel}>MANAGE</div>
      <nav aria-label="Admin navigation" className={styles.navigation}>
        <button
          aria-current={view !== "create" ? "page" : undefined}
          onClick={() => onNavigate("events")}
        >
          <span aria-hidden="true">▦</span> Events
        </button>
        <button
          aria-current={view === "create" ? "page" : undefined}
          onClick={() => onNavigate("create")}
        >
          <span aria-hidden="true">＋</span> Create event
        </button>
        <Link href="/">
          <span aria-hidden="true">↗</span> Public board
        </Link>
      </nav>
      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden="true">
          {email.charAt(0).toUpperCase()}
        </span>
        <div>
          <strong>Administrator</strong>
          <small>{email}</small>
        </div>
      </div>
      <button
        className={styles.signout}
        onClick={onLogout}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing out…" : "Sign out"}
        <span aria-hidden="true">↗</span>
      </button>
    </aside>
  );
}
