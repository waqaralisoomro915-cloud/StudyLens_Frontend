"use client";
import { useState } from "react";
import type { Exam, Topic } from "@/types/domain";

export default function ExamScope({
  exam,
  topics,
  busy,
  save,
}: {
  exam: Exam;
  topics: Topic[];
  busy: boolean;
  save: (body: { all_topics: boolean; topics: number[] }) => void;
}) {
  const [all, setAll] = useState(exam.all_topics);
  const [selected, setSelected] = useState(exam.topics);
  return (
    <details>
      <summary>Choose topics covered by this exam</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ all_topics: all, topics: all ? [] : selected });
        }}
      >
        <label>
          Coverage
          <select
            value={all ? "all" : "selected"}
            onChange={(event) => setAll(event.target.value === "all")}
          >
            <option value="all">Whole course, including future topics</option>
            <option value="selected">Selected topics only</option>
          </select>
        </label>
        {!all && (
          <label>
            Topics (hold Ctrl or Command to select several)
            <select
              multiple
              required
              value={selected.map(String)}
              onChange={(event) =>
                setSelected(
                  Array.from(event.target.selectedOptions, (option) =>
                    Number(option.value),
                  ),
                )
              }
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {!all && !topics.length && (
          <p>Add topics to this course before selecting coverage.</p>
        )}
        <p className="muted">
          Changing coverage requires confirmation and proposes a revision to
          your accepted plan.
        </p>
        <button disabled={busy || (!all && !selected.length)}>
          Save topic coverage
        </button>
      </form>
    </details>
  );
}
