import Link from "next/link";
export default function Missing() {
  return (
    <main className="loading">
      <h1>Page not found</h1>
      <Link href="/dashboard">Back to your workspace</Link>
    </main>
  );
}
