export function EventsLoading() {
  return (
    <div className="event-grid" aria-busy="true" aria-label="Loading events">
      {[1, 2, 3].map((id) => (
        <div key={id} className="skeleton">
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
