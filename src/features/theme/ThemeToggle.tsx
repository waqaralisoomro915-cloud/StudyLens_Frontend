"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const key = "studylens-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(key);
      } catch {
        /* Storage may be blocked. */
      }
      const next =
        saved === "light" || saved === "dark"
          ? saved
          : media.matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    sync();
    setReady(true);
    media.addEventListener("change", sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const label = `Switch to ${theme === "light" ? "dark" : "light"} mode`;
  return (
    <button
      type="button"
      className="secondary theme-toggle"
      aria-label={label}
      title={label}
      disabled={!ready}
      onClick={() => {
        const next = theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        setTheme(next);
        try {
          localStorage.setItem(key, next);
        } catch {
          /* The current page still switches. */
        }
      }}
    >
      {theme === "light" ? (
        <Moon size={17} aria-hidden="true" />
      ) : (
        <Sun size={17} aria-hidden="true" />
      )}
      <span>{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
