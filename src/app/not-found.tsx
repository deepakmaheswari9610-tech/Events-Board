import Link from "next/link";
export default function NotFound() {
  return <main className="not-found-page"><section className="not-found-card">
    <span className="eyebrow">404 · PAGE NOT FOUND</span>
    <h1>This page could not be found</h1>
    <p>Check the address or return to the events board.</p>
    <div className="not-found-actions"><Link href="/" className="button">Explore events</Link><Link href="/login" className="secondary-button">Sign in</Link></div>
  </section></main>;
}
