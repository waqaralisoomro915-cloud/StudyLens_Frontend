"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="loading">
      <h1>Something went wrong</h1>
      <p>Your saved work remains on the server. Try again.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
