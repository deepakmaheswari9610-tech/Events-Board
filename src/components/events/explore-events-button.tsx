"use client";
export function ExploreEventsButton() {
  return <button type="button" className="button" onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>
    Find your next plan <span aria-hidden="true">↗</span>
  </button>;
}
