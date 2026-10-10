"use client";
export default function Error({ reset }: { reset: () => void }) { return <main className="state"><h1>Something went wrong</h1><p>Give it another try.</p><button className="button" onClick={reset}>Try again</button></main>; }
