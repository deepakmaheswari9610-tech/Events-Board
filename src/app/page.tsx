import { Suspense } from "react";
import { EventsLoading } from "@/components/events-loading";
import { EventsBoard } from "@/components/events-board";
export default function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <span className="eyebrow">YOUR CITY. YOUR PEOPLE. YOUR PLANS.</span>
          <h1>
            A little closer.
            <br />A lot more <em>connected.</em>
          </h1>
          <p>
            Live music, new skills, good food. Discover the little things
            <br className="desktop-break" /> that bring your neighbourhood
            together.
          </p>
          <a className="button" href="#events">
            Find your next plan <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <span className="art-label">MAKE ROOM FOR A GOOD DAY</span>
          <span className="art-flower">✳</span>
          <span className="art-note">♪</span>
          <span className="art-smile">☺</span>
          <span className="art-bottom">meet · learn · celebrate</span>
        </div>
      </section>
      <section id="events" className="events-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GET OUT. JOIN IN.</span>
            <h2>What’s happening nearby</h2>
          </div>
          <span className="section-note">
            A new memory is just around the corner.
          </span>
        </div>
        <Suspense fallback={<EventsLoading />}>
          <EventsBoard />
        </Suspense>
      </section>
    </main>
  );
}
