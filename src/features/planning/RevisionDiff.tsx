import type { Plan, Session } from "@/types/domain";

const key = (s: Session) => [s.topic, s.starts_at, s.ends_at, s.kind].join("|");
export default function RevisionDiff({
  previous,
  next,
  timezone,
}: {
  previous: Plan;
  next: Plan;
  timezone: string;
}) {
  const before = new Set(previous.sessions.map(key)),
    after = new Set(next.sessions.map(key));
  const removed = previous.sessions.filter((s) => !after.has(key(s)));
  const added = next.sessions.filter((s) => !before.has(key(s)));
  const preserved = next.sessions.filter((s) => before.has(key(s))).length;
  const format = (s: Session) =>
    `${s.topic_title} — ${new Date(s.starts_at).toLocaleString(undefined, { timeZone: timezone, dateStyle: "medium", timeStyle: "short" })} (${s.kind})`;
  return (
    <details className="revision-diff" open>
      <summary>Changes from version {previous.id}</summary>
      <p className="muted">
        {preserved} session times preserved · {removed.length} removed ·{" "}
        {added.length} added
      </p>
      {removed.map((s) => (
        <p key={"old" + s.id}>
          <span className="badge">Removed</span> {format(s)}
        </p>
      ))}
      {added.map((s) => (
        <p key={"new" + s.id}>
          <span className="badge">Added</span> {format(s)}
        </p>
      ))}
      {!added.length && !removed.length && (
        <p>
          Session times are unchanged. Review the status, workload and conflict
          details before applying.
        </p>
      )}
    </details>
  );
}
