"use client";
import { useState } from "react";
import { api } from "@/lib/api/client";
import type { Course } from "@/types/domain";

type Suggestion = { course: number; title: string; evidence: string[] };
export default function UploadCourse({ courses }: { courses: Course[] }) {
  const [course, setCourse] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div>
      <label>
        Course
        <select
          name="course"
          required
          value={course}
          onChange={(event) => setCourse(event.target.value)}
        >
          <option value="">Choose a course</option>
          {courses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="secondary"
        disabled={loading}
        onClick={async (event) => {
          const form = event.currentTarget.closest("form");
          if (!form) return;
          const data = new FormData(form);
          const file = data.get("file");
          const text =
            `${data.get("title") || ""} ${file instanceof File ? file.name : ""}`.trim();
          if (!text) {
            setMessage("Enter a document title or choose a file first.");
            return;
          }
          setLoading(true);
          setMessage("");
          try {
            setSuggestions(
              await api<Suggestion[]>("courses/suggest/", "POST", { text }),
            );
          } catch {
            setMessage(
              "Suggestions are unavailable. You can choose a course manually.",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Finding matches…" : "Suggest from title and filename"}
      </button>
      {message && <p role="status">{message}</p>}
      {suggestions && (
        <div aria-live="polite">
          <p className="muted">
            {suggestions.length
              ? "Review these keyword matches and choose a course:"
              : "No matching course found. Choose a course manually."}
          </p>
          {suggestions.map((item) => (
            <p key={item.course}>
              <button
                type="button"
                className="secondary"
                onClick={() => setCourse(String(item.course))}
              >
                Use {item.title}
              </button>{" "}
              <small>Matched: {item.evidence.join(", ")}</small>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
