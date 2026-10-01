"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Layers,
  FileText,
  Sparkles,
  CalendarDays,
  ChartNoAxesCombined,
  Brain,
  Bell,
  Settings,
  Download,
  MessageSquare,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Check,
  ChevronRight,
  LogOut,
  Menu,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import ExamScope from "@/features/exams/ExamScope";
import UploadCourse from "@/features/documents/UploadCourse";
import RevisionDiff from "@/features/planning/RevisionDiff";
import ThemeToggle from "@/features/theme/ThemeToggle";
import type {
  Course,
  Topic,
  Document,
  Page,
  Chat,
  Quiz,
  Attempt,
  Exam,
  Plan,
  Profile,
  Coverage,
  Note,
  Memory,
  ExportJob,
  Feedback,
  Citation,
} from "@/types/domain";

const navigation = [
  ["dashboard", "Overview", LayoutDashboard],
  ["courses", "My courses", Layers],
  ["documents", "Materials", FileText],
  ["tutor", "AI study partner", Sparkles],
  ["quizzes", "Practice quizzes", BookOpen],
  ["mastery", "Understanding", ChartNoAxesCombined],
  ["exams", "Exam timetable", CalendarDays],
  ["plan", "Study plan", CalendarDays],
] as const;
const secondary = [
  ["memory", "AI memory", Brain],
  ["notifications", "Notifications", Bell],
  ["exports", "Exports", Download],
  ["feedback", "Feedback", MessageSquare],
  ["settings", "Settings", Settings],
] as const;
const labels: Record<string, string> = {
  dashboard: "Your learning, in focus.",
  courses: "A home for your courses.",
  documents: "From pages to possibilities.",
  tutor: "Let’s work through it.",
  quizzes: "Put your knowledge to work.",
  mastery: "Understanding takes evidence.",
  exams: "Keep exam day in sight.",
  plan: "Small steps. A clear direction.",
  memory: "You decide what stays.",
  notifications: "Your latest updates.",
  exports: "Take your learning with you.",
  feedback: "Help make StudyLens better.",
  settings: "Make this space yours.",
  profile: "Make this space yours.",
};
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}
function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <BookOpen size={25} />
      </span>
      <h3>{title}</h3>
      <p>{children || "Your work will appear here when you’re ready."}</p>
    </div>
  );
}
function Citations({ items }: { items: Citation[] }) {
  return (
    <div className="citations">
      {items.map((c, i) => (
        <details key={i}>
          <summary>
            <FileText size={13} />
            <Link href={"/documents/" + c.document + "/review"}>
              {c.title} · p. {c.page}
            </Link>
          </summary>
          <blockquote>{c.quote}</blockquote>
        </details>
      ))}
    </div>
  );
}
function fields(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
}

export default function Workspace({ path }: { path: string[] }) {
  const router = useRouter(),
    section = path[0] || "dashboard";
  const [profile, setProfile] = useState<Profile | null>(null),
    [courses, setCourses] = useState<Course[]>([]),
    [topics, setTopics] = useState<Topic[]>([]),
    [documents, setDocuments] = useState<Document[]>([]),
    [quizzes, setQuizzes] = useState<Quiz[]>([]),
    [attempts, setAttempts] = useState<Attempt[]>([]),
    [exams, setExams] = useState<Exam[]>([]),
    [plans, setPlans] = useState<Plan[]>([]),
    [chats, setChats] = useState<Chat[]>([]),
    [notes, setNotes] = useState<Note[]>([]),
    [memory, setMemory] = useState<Memory[]>([]),
    [exports, setExports] = useState<ExportJob[]>([]),
    [feedback, setFeedback] = useState<Feedback[]>([]),
    [coverage, setCoverage] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [mobile, setMobile] = useState(false),
    [selectedCourse, setSelectedCourse] = useState(""),
    [answers, setAnswers] = useState<Record<number, number>>({}),
    [activeChat, setActiveChat] = useState<number | null>(null);
  const load = useCallback(async () => {
    try {
      const p = await api<Profile>("profile/");
      setProfile(p);
      const [c, t, d, q, a, e, pl, ch, n, m, x, f] = await Promise.all([
        api<Course[]>("courses/"),
        api<Topic[]>("topics/"),
        api<Document[]>("documents/"),
        api<Quiz[]>("quizzes/"),
        api<Attempt[]>("attempts/"),
        api<Exam[]>("exams/"),
        api<Plan[]>("plans/"),
        api<Chat[]>("chats/"),
        api<Note[]>("notifications/"),
        api<Memory[]>("memory/"),
        api<ExportJob[]>("exports/"),
        api<Feedback[]>("feedback/"),
      ]);
      setCourses(c);
      setTopics(t);
      setDocuments(d);
      setQuizzes(q);
      setAttempts(a);
      setExams(e);
      setPlans(pl);
      setChats(ch);
      setNotes(n);
      setMemory(m);
      setExports(x);
      setFeedback(f);
      const cv = await Promise.all(
        c.map((course) =>
          api<Coverage[]>("courses/" + course.id + "/coverage/"),
        ),
      );
      setCoverage(cv.flat());
    } catch (e) {
      if (e instanceof ApiError && [401, 403].includes(e.status))
        router.replace("/login");
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void load();
  }, [load]);
  const hasPendingJobs = [...documents, ...quizzes, ...exports].some((item) =>
    ["queued", "processing"].includes(item.status),
  );
  useEffect(() => {
    const id = setInterval(
      () => {
        if (!busy) void load();
      },
      hasPendingJobs ? 30000 : 120000,
    );
    return () => clearInterval(id);
  }, [load, busy, hasPendingJobs]);
  async function run(fn: () => Promise<unknown>, message = "Saved.") {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      await load();
      setSuccess(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function remove(resource: string, id: number, label: string) {
    if (
      window.confirm(
        "Delete " + label + " and related records? This cannot be undone.",
      )
    )
      void run(() => api(resource + "/" + id + "/", "DELETE"), "Deleted.");
  }
  const selected = Number(selectedCourse) || courses[0]?.id;
  const currentCourse = courses.find((c) => c.id === Number(path[1]));
  const currentDoc = documents.find((d) => d.id === Number(path[1]));
  const currentQuiz = quizzes.find((q) => q.id === Number(path[1]));
  const currentAttempt = attempts.find((a) => a.id === Number(path[2]));
  const chat =
    chats.find((c) => c.id === (activeChat || Number(path[1]))) || chats[0];
  const plan =
    plans.find((p) => p.id === Number(path[2])) ||
    plans.find((p) => p.status === "accepted") ||
    plans[0];
  const dayKey = (value: Date) =>
    value.toLocaleDateString("en-CA", { timeZone: profile?.timezone || "UTC" });
  const today = dayKey(new Date());
  const todaySessions =
    plans
      .find((p) => p.status === "accepted")
      ?.sessions.filter((s) => dayKey(new Date(s.starts_at)) === today) || [];
  const upcoming = exams
    .filter(
      (e) => e.confirmed && e.starts_at && new Date(e.starts_at) > new Date(),
    )
    .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
  const courseSelect = (name = "course", value?: number) => (
    <label>
      Course
      <select
        name={name}
        required
        defaultValue={value || selected}
        onChange={(e) => setSelectedCourse(e.target.value)}
      >
        <option value="">Select a course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
    </label>
  );
  const date = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: profile?.timezone || "UTC",
    });
  if (loading)
    return (
      <main className="loading" role="status">
        <span className="logo">
          <BookOpen />
        </span>
        <p>Opening your study space…</p>
      </main>
    );
  return (
    <div className="workspace">
      <aside className={"sidebar " + (mobile ? "visible" : "")}>
        <Link href="/dashboard" className="brand">
          <span className="logo">
            <BookOpen size={21} />
          </span>
          StudyLens
        </Link>
        <div className="workspace-label">
          YOUR WORKSPACE <span>PERSONAL</span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(([href, label, Icon]) => (
            <Link
              onClick={() => setMobile(false)}
              key={href}
              href={"/" + href}
              className={section === href ? "active" : ""}
            >
              <Icon size={18} />
              {label}
              {section === href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="nav-divider" />
        <nav aria-label="Settings navigation">
          {secondary.map(([href, label, Icon]) => (
            <Link
              onClick={() => setMobile(false)}
              key={href}
              href={"/" + href}
              className={section === href ? "active" : ""}
            >
              <Icon size={17} />
              {label}
              {href === "notifications" && notes.some((n) => !n.read) && (
                <span className="count">
                  {notes.filter((n) => !n.read).length}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{profile?.username[0]?.toUpperCase()}</span>
          <div>
            <strong>{profile?.username}</strong>
            <small>Your personal study space</small>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={() =>
              void run(async () => {
                await api("auth/logout/", "POST", {});
                router.push("/login");
              })
            }
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <button
            className="icon-button mobile-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <strong>
              {navigation
                .concat(secondary as never)
                .find((n) => n[0] === section)?.[1] || "Profile"}
            </strong>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
            <span className="private">
              <span className="dot" /> PRIVATE STUDY SPACE
            </span>
            <Link href="/notifications" aria-label="Notifications">
              <Bell size={19} />
            </Link>
            <span className="avatar small">
              {profile?.username[0]?.toUpperCase()}
            </span>
          </div>
        </header>
        <main className="main-content">
          <div
            className={
              "page-heading " +
              (section === "dashboard" ? "dashboard-welcome" : "")
            }
          >
            <div>
              <span className="eyebrow">
                {section === "dashboard"
                  ? new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      timeZone: profile?.timezone || "UTC",
                    })
                  : "YOUR STUDY SPACE / " + section.toUpperCase()}
              </span>
              <h1>{labels[section] || "Your study space"}</h1>
              <p className="muted">
                {section === "dashboard"
                  ? `Welcome back, ${profile?.username}. A little progress goes a long way.`
                  : "Built around your material, your pace, and your goals."}
              </p>
            </div>
            {section === "dashboard" && (
              <Link className="button" href="/documents">
                <Plus size={17} /> Upload material
              </Link>
            )}
          </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button className="text-button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          {success && (
            <div className="alert" role="status">
              {success}
            </div>
          )}
          {busy && (
            <div className="busy" role="status">
              Working… AI and document processing may take a few minutes.
            </div>
          )}
          {section === "dashboard" && (
            <>
              <div className="stats">
                <article>
                  <span>
                    My courses <Layers size={17} />
                  </span>
                  <strong>{courses.length.toString().padStart(2, "0")}</strong>
                  <small>Your learning, organized</small>
                </article>
                <article>
                  <span>
                    Reviewed materials <FileText size={17} />
                  </span>
                  <strong>
                    {documents
                      .filter((d) => d.confirmed)
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <small>
                    {documents.filter((d) => d.status === "review").length}{" "}
                    waiting for your review
                  </small>
                </article>
                <article>
                  <span>
                    Today’s focus <Clock size={17} />
                  </span>
                  <strong>
                    {todaySessions.length.toString().padStart(2, "0")}
                    <em>sessions</em>
                  </strong>
                  <small>
                    {
                      todaySessions.filter((s) => s.status === "completed")
                        .length
                    }{" "}
                    completed · keep it steady
                  </small>
                </article>
                <article>
                  <span>
                    Next exam <CalendarDays size={17} />
                  </span>
                  <strong>
                    {upcoming[0]
                      ? Math.ceil(
                          (new Date(upcoming[0].starts_at!).getTime() -
                            Date.now()) /
                            86400000,
                        )
                      : "—"}
                    <em>{upcoming[0] ? "days" : ""}</em>
                  </strong>
                  <small>
                    {upcoming[0]?.title || "No confirmed exams yet"}
                  </small>
                </article>
              </div>
              <div className="dashboard-grid">
                <div>
                  <section className="card focus-card">
                    <div className="section-heading">
                      <h2>
                        Today’s focus{" "}
                        <span className="subcount">{todaySessions.length}</span>
                      </h2>
                      <Link href="/plan">
                        View study plan <ArrowUpRight size={15} />
                      </Link>
                    </div>
                    {todaySessions.length ? (
                      todaySessions.map((s) => (
                        <div className="session-row" key={s.id}>
                          <span
                            className={
                              "session-check " +
                              (s.status === "completed" ? "done" : "")
                            }
                          >
                            <Check size={16} />
                          </span>
                          <div>
                            <strong>{s.topic_title}</strong>
                            <small>
                              {date(s.starts_at)} · {s.kind}
                            </small>
                          </div>
                          <Badge>{s.status}</Badge>
                          <Link
                            href="/plan"
                            className="icon-button"
                            aria-label="Open session"
                          >
                            <ArrowRight size={17} />
                          </Link>
                        </div>
                      ))
                    ) : (
                      <Empty title="A little planning goes a long way.">
                        Add your exam dates and availability to create your
                        first study plan.
                        <br />
                        <Link className="text-link" href="/plan">
                          Plan my study time <ArrowRight size={14} />
                        </Link>
                      </Empty>
                    )}
                  </section>
                  <section className="course-section">
                    <div className="section-heading">
                      <h2>My courses</h2>
                      <Link href="/courses">
                        View all <ArrowUpRight size={15} />
                      </Link>
                    </div>
                    <div className="course-grid">
                      {courses.slice(0, 4).map((c, i) => (
                        <Link
                          href={"/courses/" + c.id}
                          className="course-card"
                          key={c.id}
                        >
                          <span className={"course-icon color-" + (i % 3)}>
                            <BookOpen size={21} />
                          </span>
                          <span className="course-code">
                            {c.code || "COURSE"}
                          </span>
                          <h3>{c.title}</h3>
                          <p>
                            {documents.filter((d) => d.course === c.id).length}{" "}
                            materials ·{" "}
                            {topics.filter((t) => t.course === c.id).length}{" "}
                            topics
                          </p>
                          <div className="course-foot">
                            Open course <ArrowUpRight size={16} />
                          </div>
                        </Link>
                      ))}
                      <Link
                        href="/courses/new"
                        className="course-card add-course"
                      >
                        <Plus size={23} />
                        <strong>Add a course</strong>
                        <span>Start with what you’re studying</span>
                      </Link>
                    </div>
                  </section>
                </div>
                <div>
                  <section className="tutor-promo">
                    <span className="sparkle-box">
                      <Sparkles size={23} />
                    </span>
                    <span className="eyebrow">YOUR AI STUDY PARTNER</span>
                    <h2>
                      A tricky concept?
                      <br />
                      Let’s untangle it.
                    </h2>
                    <p>
                      Ask a question, follow the sources, and build your
                      understanding one step at a time.
                    </p>
                    <Link href="/tutor" className="button">
                      Start a conversation <ArrowUpRight size={16} />
                    </Link>
                    <small>Grounded in your reviewed material.</small>
                  </section>
                  <section className="card upcoming">
                    <div className="section-heading">
                      <h2>On the horizon</h2>
                      <CalendarDays size={18} />
                    </div>
                    {upcoming.length ? (
                      upcoming.slice(0, 3).map((e) => (
                        <div className="exam-mini" key={e.id}>
                          <div className="date-tile">
                            <strong>
                              {new Date(e.starts_at!).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  timeZone: profile?.timezone || "UTC",
                                },
                              )}
                            </strong>
                            <small>
                              {new Date(e.starts_at!).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  timeZone: profile?.timezone || "UTC",
                                },
                              )}
                            </small>
                          </div>
                          <div>
                            <strong>{e.title}</strong>
                            <small>{date(e.starts_at!)}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="muted">
                        No confirmed exam dates yet. Upload a timetable or add
                        an exam.
                      </p>
                    )}
                    <Link className="text-link" href="/exams">
                      Manage exam dates <ArrowRight size={14} />
                    </Link>
                  </section>
                </div>
              </div>
              <div className="bottom-note">
                <span className="dot" /> Study a little. Understand a little
                more. Repeat.
              </div>
            </>
          )}

          {section === "courses" &&
            (currentCourse ? (
              <>
                <div className="section-heading">
                  <h2>{currentCourse.title}</h2>
                  <Badge>{currentCourse.code || "Course"}</Badge>
                </div>
                <div className="tabs">
                  {[
                    "overview",
                    "materials",
                    "syllabus",
                    "coverage",
                    "settings",
                  ].map((t) => (
                    <Link
                      className={(path[2] || "overview") === t ? "active" : ""}
                      href={
                        "/courses/" +
                        currentCourse.id +
                        "/" +
                        (t === "overview" ? "" : t)
                      }
                      key={t}
                    >
                      {t}
                    </Link>
                  ))}
                </div>
                {path[2] === "settings" ? (
                  <form
                    className="card form-grid"
                    onSubmit={(e) => {
                      const f = fields(e);
                      void run(() =>
                        api("courses/" + currentCourse.id + "/", "PATCH", f),
                      );
                    }}
                  >
                    <label>
                      Course title
                      <input
                        name="title"
                        defaultValue={currentCourse.title}
                        required
                      />
                    </label>
                    <label>
                      Course code
                      <input name="code" defaultValue={currentCourse.code} />
                    </label>
                    <label>
                      Description
                      <textarea
                        name="description"
                        defaultValue={currentCourse.description}
                      />
                    </label>
                    <button disabled={busy}>Save course</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        remove("courses", currentCourse.id, currentCourse.title)
                      }
                    >
                      Delete course and related data
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="split">
                      <section className="card">
                        <h2>Syllabus topics</h2>
                        <p className="muted">
                          Extract a reviewed syllabus automatically, or correct
                          and add topics here.
                        </p>
                        <form
                          className="inline-form"
                          onSubmit={(e) => {
                            const f = fields(e);
                            void run(() =>
                              api("topics/", "POST", {
                                ...f,
                                course: currentCourse.id,
                              }),
                            );
                            e.currentTarget.reset();
                          }}
                        >
                          <label>
                            Topic title
                            <input
                              name="title"
                              placeholder="e.g. Database normalization"
                              required
                            />
                          </label>
                          <label>
                            Unit
                            <input name="unit" placeholder="Unit 1" />
                          </label>
                          <button disabled={busy}>
                            <Plus size={16} /> Add topic
                          </button>
                        </form>
                        {topics
                          .filter((t) => t.course === currentCourse.id)
                          .map((t) => (
                            <details key={t.id} className="record">
                              <summary>
                                {t.title}
                                <Badge>
                                  {t.estimated_minutes} min estimate
                                </Badge>
                              </summary>
                              <form
                                className="form-grid"
                                onSubmit={(e) => {
                                  const f = fields(e);
                                  void run(() =>
                                    api("topics/" + t.id + "/", "PATCH", {
                                      ...f,
                                      estimated_minutes: Number(
                                        f.estimated_minutes,
                                      ),
                                      difficulty: Number(f.difficulty),
                                      estimate_override: true,
                                    }),
                                  );
                                }}
                              >
                                <label>
                                  Title
                                  <input name="title" defaultValue={t.title} />
                                </label>
                                <label>
                                  Estimated minutes
                                  <input
                                    type="number"
                                    name="estimated_minutes"
                                    min="15"
                                    max="3000"
                                    defaultValue={t.estimated_minutes}
                                  />
                                </label>
                                <label>
                                  Difficulty (1–5)
                                  <input
                                    type="number"
                                    name="difficulty"
                                    min="1"
                                    max="5"
                                    defaultValue={t.difficulty}
                                  />
                                </label>
                                <button disabled={busy}>Save override</button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() =>
                                    remove("topics", t.id, t.title)
                                  }
                                >
                                  Delete topic
                                </button>
                              </form>
                            </details>
                          ))}
                      </section>
                      <section className="card">
                        <h2>Course material</h2>
                        {documents
                          .filter((d) => d.course === currentCourse.id)
                          .map((d) => (
                            <Link
                              className="record"
                              key={d.id}
                              href={"/documents/" + d.id + "/review"}
                            >
                              <FileText size={18} />
                              {d.title}
                              <Badge>{d.status}</Badge>
                            </Link>
                          ))}
                        <Link href="/documents" className="button secondary">
                          <Plus size={16} />
                          Upload material
                        </Link>
                      </section>
                    </div>
                    <CoverageList
                      items={coverage.filter((c) =>
                        topics.some(
                          (t) => t.id === c.id && t.course === currentCourse.id,
                        ),
                      )}
                      busy={busy}
                      confirm={(id) =>
                        void run(() =>
                          api("mappings/" + id + "/", "PATCH", {
                            confirmed: true,
                          }),
                        )
                      }
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <form
                  className="card inline-form"
                  onSubmit={(e) => {
                    const f = fields(e);
                    void run(
                      () => api("courses/", "POST", f),
                      "Course created. Add materials to begin.",
                    );
                    e.currentTarget.reset();
                  }}
                >
                  <label>
                    Course title
                    <input
                      required
                      name="title"
                      placeholder="e.g. Database Management Systems"
                    />
                  </label>
                  <label>
                    Course code
                    <input name="code" placeholder="CS 402" />
                  </label>
                  <button disabled={busy}>
                    <Plus size={16} />
                    Create course
                  </button>
                </form>
                <div className="course-grid">
                  {courses.map((c, i) => (
                    <Link
                      className="course-card"
                      href={"/courses/" + c.id}
                      key={c.id}
                    >
                      <span className={"course-icon color-" + (i % 3)}>
                        <BookOpen />
                      </span>
                      <small>{c.code}</small>
                      <h3>{c.title}</h3>
                      <p>
                        {c.description ||
                          "Organize notes, syllabus and progress."}
                      </p>
                      <div className="course-foot">
                        Open course <ArrowUpRight size={16} />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ))}

          {section === "documents" &&
            (currentDoc ? (
              <>
                <div className="section-heading">
                  <h2>{currentDoc.title}</h2>
                  <Badge>
                    {currentDoc.confirmed
                      ? "Confirmed for retrieval"
                      : currentDoc.status}
                  </Badge>
                </div>
                <div className="actions">
                  <button
                    disabled={
                      busy ||
                      ["queued", "processing"].includes(currentDoc.status)
                    }
                    onClick={() =>
                      void run(
                        () =>
                          api(
                            "documents/" + currentDoc.id + "/process/",
                            "POST",
                            {},
                          ),
                        "Processing requested. Status updates automatically.",
                      )
                    }
                  >
                    Process / reprocess material
                  </button>
                  <button
                    disabled={busy || !currentDoc.pages.length}
                    onClick={() =>
                      void run(
                        () =>
                          api(
                            "documents/" + currentDoc.id + "/confirm/",
                            "POST",
                            {},
                          ),
                        "Extraction confirmed for retrieval.",
                      )
                    }
                  >
                    Confirm reviewed extraction
                  </button>
                  {currentDoc.kind !== "material" && (
                    <button
                      className="secondary"
                      disabled={busy || !currentDoc.confirmed}
                      onClick={() =>
                        void run(
                          () =>
                            api(
                              "documents/" +
                                currentDoc.id +
                                "/" +
                                currentDoc.kind +
                                "/",
                              "POST",
                              {},
                            ),
                          "Draft extraction saved. Review the topics or exam dates.",
                        )
                      }
                    >
                      Extract {currentDoc.kind}
                    </button>
                  )}
                  <a
                    className="button secondary"
                    href={"/api/documents/" + currentDoc.id + "/download/"}
                  >
                    Download original
                  </a>
                  {["review", "ready"].includes(currentDoc.status) &&
                    currentDoc.pages.some((p) => p.text.trim()) && (
                      <a
                        className="button secondary"
                        href={
                          "/api/documents/" + currentDoc.id + "/extracted-text/"
                        }
                      >
                        Download extracted text (.txt)
                      </a>
                    )}
                  <button
                    className="danger"
                    onClick={() =>
                      remove("documents", currentDoc.id, currentDoc.title)
                    }
                  >
                    Delete document
                  </button>
                </div>
                {currentDoc.error && (
                  <p className="alert error">{currentDoc.error}</p>
                )}
                {!currentDoc.pages.length && (
                  <Empty title="Ready when you are.">
                    Click Process Material to extract text. Scanned pages use
                    OCR.
                  </Empty>
                )}
                {currentDoc.pages.map((p) => (
                  <PageEditor
                    key={p.id}
                    page={p}
                    busy={busy}
                    reprocess={() =>
                      void run(
                        () =>
                          api(
                            "documents/" + currentDoc.id + "/process/",
                            "POST",
                            { pages: [p.number] },
                          ),
                        "Selected page queued for reprocessing.",
                      )
                    }
                    save={(text) =>
                      void run(
                        () =>
                          api(
                            "documents/" + currentDoc.id + "/review/",
                            "POST",
                            { page: p.id, text },
                          ),
                        "Correction saved. Confirm the document when you finish reviewing.",
                      )
                    }
                  />
                ))}
              </>
            ) : (
              <>
                <form
                  className="card upload-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    void run(
                      () => api("documents/", "POST", form),
                      "Uploaded. Open the document and click Process Material.",
                    );
                  }}
                >
                  <div className="upload-intro">
                    <span className="empty-icon">
                      <FileText size={25} />
                    </span>
                    <h2>Bring your material into focus.</h2>
                    <p>
                      Lecture notes, scanned handouts, syllabi or timetables.
                      <br />
                      PDF, PNG, JPEG or WebP · up to 25 MB · PDFs up to 100
                      pages.
                    </p>
                  </div>
                  <div className="form-grid">
                    <UploadCourse courses={courses} />
                    <label>
                      Document title
                      <input
                        name="title"
                        required
                        placeholder="Week 1 lecture notes"
                      />
                    </label>
                    <label>
                      Document type
                      <select name="kind">
                        <option value="material">Study material</option>
                        <option value="syllabus">Syllabus</option>
                        <option value="timetable">Exam timetable</option>
                      </select>
                    </label>
                    <label>
                      Choose a file
                      <input
                        name="file"
                        type="file"
                        required
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                      />
                    </label>
                  </div>
                  <button disabled={busy || !courses.length}>
                    <Plus size={16} />
                    Upload material
                  </button>
                  {!courses.length && (
                    <p>Create a course first on the My courses page.</p>
                  )}
                </form>
                <section className="card">
                  <h2>Your material</h2>
                  {documents.map((d) => (
                    <Link
                      className="record"
                      href={"/documents/" + d.id + "/review"}
                      key={d.id}
                    >
                      <FileText size={19} />
                      <div>
                        <strong>{d.title}</strong>
                        <small>
                          {courses.find((c) => c.id === d.course)?.title} ·{" "}
                          {d.kind}
                        </small>
                      </div>
                      <Badge>{d.confirmed ? "confirmed" : d.status}</Badge>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                  {!documents.length && (
                    <Empty title="Your library starts here." />
                  )}
                </section>
              </>
            ))}

          {section === "mastery" && (
            <>
              <p className="alert">
                Understanding is estimated from quiz answers, not study time.
                Beta(1,1): (correct + 1) / (answered + 2). Fewer than 3 answers
                means insufficient evidence.
              </p>
              <CoverageList
                items={coverage}
                busy={busy}
                confirm={(id) =>
                  void run(() =>
                    api("mappings/" + id + "/", "PATCH", { confirmed: true }),
                  )
                }
              />
            </>
          )}

          {section === "tutor" && (
            <div className="chat-layout">
              <section className="card">
                <h2>Conversations</h2>
                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    const f = fields(e);
                    void run(async () => {
                      const c = await api<Chat>("chats/", "POST", {
                        ...f,
                        course: Number(f.course),
                      });
                      setActiveChat(c.id);
                    }, "Conversation started.");
                  }}
                >
                  {courseSelect()}
                  <label>
                    Mode
                    <select name="mode">
                      <option value="material">Ask My Material</option>
                      <option value="tutor">Tutor Me</option>
                      <option value="guidance">
                        Study and Career Guidance
                      </option>
                    </select>
                  </label>
                  <button disabled={busy || !courses.length}>
                    <Plus size={16} />
                    New conversation
                  </button>
                </form>
                {chats.map((c) => (
                  <button
                    key={c.id}
                    className={
                      "chat-choice " + (chat?.id === c.id ? "selected" : "")
                    }
                    onClick={() => setActiveChat(c.id)}
                  >
                    {courses.find((x) => x.id === c.course)?.title}
                    <small>
                      {c.mode} · {c.messages.length} messages
                    </small>
                  </button>
                ))}
              </section>
              <section className="card chat-panel">
                <div className="section-heading">
                  <h2>
                    <Sparkles size={20} /> Your study partner
                  </h2>
                  {chat && (
                    <button
                      className="icon-button"
                      aria-label="Delete conversation"
                      onClick={() => remove("chats", chat.id, "conversation")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="muted">
                  {chat?.mode === "guidance"
                    ? "General study and career guidance. Answers are not grounded in your notes."
                    : "Answers use your confirmed notes. Open source references to check supporting evidence."}
                </p>
                <div className="messages">
                  {chat?.messages.map((m) => (
                    <article className={"message " + m.role} key={m.id}>
                      <small>{m.role === "user" ? "YOU" : "STUDYLENS"}</small>
                      <p>{m.text}</p>
                      <Citations items={m.citations} />
                    </article>
                  ))}
                  {!chat?.messages.length && (
                    <Empty title="What would you like to understand?">
                      Start with a question about a topic in your reviewed
                      material.
                    </Empty>
                  )}
                </div>
                <form
                  className="question-input"
                  onSubmit={(e) => {
                    const f = fields(e);
                    if (chat)
                      void run(
                        () => api("chats/" + chat.id + "/ask/", "POST", f),
                        "Answer saved.",
                      );
                    e.currentTarget.reset();
                  }}
                >
                  <label className="sr-only" htmlFor="question">
                    Your question
                  </label>
                  <textarea
                    id="question"
                    name="question"
                    required
                    maxLength={3000}
                    placeholder="Ask a question about your material…"
                  />
                  <button disabled={busy || !chat} aria-label="Send question">
                    <ArrowRight size={19} />
                  </button>
                </form>
                <small className="muted">
                  Local AI takes time and can make mistakes. Check the cited
                  pages.
                </small>
              </section>
            </div>
          )}

          {section === "quizzes" &&
            (currentAttempt ? (
              <section className="card">
                <h2>
                  Your result: {currentAttempt.correct} / {currentAttempt.total}
                </h2>
                {currentAttempt.results.map((q, i) => (
                  <article className="question" key={i}>
                    <Badge>
                      {q.is_correct ? "Correct" : "Keep practicing"}
                    </Badge>
                    <h3>
                      {i + 1}. {q.text}
                    </h3>
                    <p>Your answer: {q.choices[q.selected]}</p>
                    <p>
                      <strong>Correct answer: {q.choices[q.correct]}</strong>
                    </p>
                    <p>{q.explanation}</p>
                    <Citations items={q.citations} />
                  </article>
                ))}
                <Link href="/mastery" className="button">
                  See understanding <ArrowRight size={16} />
                </Link>
              </section>
            ) : currentQuiz ? (
              <section className="card">
                <h2>{currentQuiz.title}</h2>
                <Badge>{currentQuiz.status}</Badge>
                {currentQuiz.error && (
                  <p className="alert error">{currentQuiz.error}</p>
                )}
                {currentQuiz.status === "failed" && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        api(
                          "quizzes/" + currentQuiz.id + "/retry/",
                          "POST",
                          {},
                        ),
                      )
                    }
                  >
                    Retry generation
                  </button>
                )}
                {currentQuiz.status === "ready" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(async () => {
                        const a = await api<Attempt>(
                          "quizzes/" + currentQuiz.id + "/submit/",
                          "POST",
                          {
                            answers: currentQuiz.questions.map(
                              (_, i) => answers[i],
                            ),
                          },
                        );
                        router.push("/quizzes/attempts/" + a.id);
                      }, "Scored and mastery updated.");
                    }}
                  >
                    {currentQuiz.questions.map((q, i) => (
                      <fieldset className="question" key={i}>
                        <legend>
                          {i + 1}. {q.text}
                        </legend>
                        {q.choices.map((c, j) => (
                          <label className="choice" key={j}>
                            <input
                              type="radio"
                              name={"q" + i}
                              required
                              onChange={() =>
                                setAnswers({ ...answers, [i]: j })
                              }
                            />
                            {c}
                          </label>
                        ))}
                      </fieldset>
                    ))}
                    {attempts.some((a) => a.quiz === currentQuiz.id) ? (
                      <Link
                        className="button"
                        href={
                          "/quizzes/attempts/" +
                          attempts.find((a) => a.quiz === currentQuiz.id)!.id
                        }
                      >
                        View saved result
                      </Link>
                    ) : (
                      <button disabled={busy}>Submit for scoring</button>
                    )}
                  </form>
                )}
              </section>
            ) : (
              <>
                <form
                  className="card form-grid"
                  onSubmit={(e) => {
                    const f = fields(e);
                    void run(
                      () =>
                        api("quizzes/", "POST", {
                          ...f,
                          course: Number(f.course),
                          topic: f.topic ? Number(f.topic) : null,
                          length: Number(f.length),
                        }),
                      "Quiz generation requested. Status updates automatically.",
                    );
                  }}
                >
                  <h2 className="full">A little practice goes a long way.</h2>
                  {courseSelect()}
                  <label>
                    Topic
                    <select name="topic">
                      <option value="">All course topics</option>
                      {topics
                        .filter((t) => t.course === selected)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Questions
                    <input
                      type="number"
                      name="length"
                      min="1"
                      max="20"
                      defaultValue="5"
                    />
                  </label>
                  <label>
                    Difficulty
                    <select name="difficulty">
                      <option>medium</option>
                      <option>easy</option>
                      <option>hard</option>
                    </select>
                  </label>
                  <button disabled={busy || !courses.length}>
                    <Sparkles size={16} />
                    Generate quiz
                  </button>
                </form>
                <section className="card">
                  <h2>Practice library</h2>
                  {quizzes.map((q) => (
                    <Link
                      className="record"
                      key={q.id}
                      href={"/quizzes/" + q.id}
                    >
                      <BookOpen size={19} />
                      {q.title}
                      <Badge>{q.status}</Badge>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                  {!quizzes.length && (
                    <Empty title="Practice starts with your notes.">
                      Confirm your material and add syllabus topics before
                      generating a quiz.
                    </Empty>
                  )}
                </section>
              </>
            ))}

          {section === "exams" && (
            <>
              <div className="alert">
                Extract a timetable from the Materials page, then review the
                proposed dates here. Every date needs your explicit
                confirmation. Display timezone: {profile?.timezone}.
              </div>
              <form
                className="card form-grid"
                onSubmit={(e) => {
                  const f = fields(e);
                  void run(
                    () =>
                      api("exams/", "POST", {
                        course: Number(f.course),
                        title: f.title,
                        starts_at: new Date(String(f.starts_at)).toISOString(),
                        duration_minutes: Number(f.duration_minutes),
                      }),
                    "Exam draft saved. Review and confirm it below.",
                  );
                }}
              >
                <h2 className="full">Add an exam</h2>
                {courseSelect()}
                <label>
                  Exam title
                  <input name="title" required />
                </label>
                <label>
                  Date and time (your browser timezone)
                  <input name="starts_at" type="datetime-local" required />
                </label>
                <label>
                  Duration in minutes
                  <input
                    name="duration_minutes"
                    type="number"
                    min="1"
                    max="1440"
                    defaultValue="120"
                  />
                </label>
                <button disabled={busy || !courses.length}>
                  <Plus size={16} />
                  Save exam draft
                </button>
                <Link href="/documents" className="button secondary">
                  Upload a timetable
                </Link>
              </form>
              {exams.map((e) => (
                <article key={e.id} className="card">
                  <div className="section-heading">
                    <h2>{e.title}</h2>
                    <Badge>
                      {e.confirmed ? "Confirmed" : "Needs confirmation"}
                    </Badge>
                  </div>
                  <p>
                    {e.starts_at
                      ? date(e.starts_at)
                      : "Date or time is missing. Edit before confirming."}{" "}
                    · {e.duration_minutes || "Unknown"} minutes
                  </p>
                  <p className="muted">
                    {e.all_topics
                      ? "Covers the whole course"
                      : `Covers ${e.topics.length} selected topics`}
                  </p>
                  <ExamScope
                    exam={e}
                    topics={topics.filter((t) => t.course === e.course)}
                    busy={busy}
                    save={(body) => {
                      void run(
                        () => api("exams/" + e.id + "/", "PATCH", body),
                        "Topic coverage saved. Confirm the exam again.",
                      );
                    }}
                  />
                  {e.warning && <p className="muted">{e.warning}</p>}
                  {e.source_quote && <blockquote>{e.source_quote}</blockquote>}
                  <div className="actions">
                    <button
                      disabled={busy || e.confirmed}
                      onClick={() =>
                        void run(
                          () => api("exams/" + e.id + "/confirm/", "POST", {}),
                          "Exam confirmed.",
                        )
                      }
                    >
                      Confirm this exam date
                    </button>
                    <button
                      className="danger"
                      onClick={() => remove("exams", e.id, e.title)}
                    >
                      Delete
                    </button>
                  </div>
                  <details>
                    <summary>Edit date and details</summary>
                    <form
                      className="form-grid"
                      onSubmit={(event) => {
                        const f = fields(event);
                        void run(
                          () =>
                            api("exams/" + e.id + "/", "PATCH", {
                              title: f.title,
                              starts_at: new Date(
                                String(f.starts_at),
                              ).toISOString(),
                              duration_minutes: Number(f.duration_minutes),
                            }),
                          "Updated. Confirm the new date.",
                        );
                      }}
                    >
                      <label>
                        Title
                        <input name="title" defaultValue={e.title} required />
                      </label>
                      <label>
                        Date (browser timezone)
                        <input
                          type="datetime-local"
                          name="starts_at"
                          required
                        />
                      </label>
                      <label>
                        Duration
                        <input
                          type="number"
                          name="duration_minutes"
                          min="1"
                          max="1440"
                          defaultValue={e.duration_minutes || 120}
                        />
                      </label>
                      <button disabled={busy}>Save changes</button>
                    </form>
                  </details>
                </article>
              ))}
            </>
          )}

          {section === "plan" && (
            <>
              <div className="actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const p = await api<Plan>("plans/", "POST", {
                        reason: "Student requested a refreshed plan",
                      });
                      router.push("/plan/preview/" + p.id);
                    }, "Draft ready. Review before accepting.")
                  }
                >
                  <Sparkles size={17} />
                  Generate a draft plan
                </button>
                <Link className="button secondary" href="/settings/preferences">
                  Edit availability
                </Link>
              </div>
              <p className="muted">
                Plans use confirmed exams, topic estimates, quiz evidence and
                your availability. Completed and locked sessions are preserved
                in proposed revisions.
              </p>
              {plans.length > 0 && (
                <div className="tabs">
                  {plans.slice(0, 12).map((p) => (
                    <Link
                      className={p.id === plan?.id ? "active" : ""}
                      key={p.id}
                      href={"/plan/preview/" + p.id}
                    >
                      Version {p.id} · {p.status}
                    </Link>
                  ))}
                </div>
              )}
              {plan ? (
                <>
                  <section className="card">
                    <div className="section-heading">
                      <div>
                        <h2>Plan version {plan.id}</h2>
                        <p className="muted">
                          {plan.reason}
                          {plan.previous
                            ? ` · Revises version ${plan.previous}`
                            : ""}
                        </p>
                      </div>
                      <Badge>{plan.status}</Badge>
                    </div>
                    {plan.previous &&
                      plans.find((p) => p.id === plan.previous) && (
                        <RevisionDiff
                          previous={plans.find((p) => p.id === plan.previous)!}
                          next={plan}
                          timezone={profile?.timezone || "UTC"}
                        />
                      )}
                    {plan.conflicts.map((c, i) => (
                      <p className="alert error" key={i}>
                        {c}
                      </p>
                    ))}
                    {plan.unscheduled.length > 0 && (
                      <details open>
                        <summary>
                          Unscheduled work ·{" "}
                          {plan.unscheduled.reduce((n, u) => n + u.minutes, 0)}{" "}
                          minutes
                        </summary>
                        {plan.unscheduled.map((u, i) => (
                          <p key={i}>
                            <strong>
                              {u.title}: {u.minutes} min
                            </strong>{" "}
                            — {u.reason}
                          </p>
                        ))}
                      </details>
                    )}
                    {plan.status === "draft" && (
                      <button
                        disabled={busy || !!plan.conflicts.length}
                        onClick={() =>
                          void run(
                            () =>
                              api("plans/" + plan.id + "/accept/", "POST", {}),
                            "Plan accepted. Previous versions remain available.",
                          )
                        }
                      >
                        {plan.previous
                          ? "Apply Updated Plan"
                          : "Accept this study plan"}
                      </button>
                    )}
                  </section>
                  <section className="card">
                    <h2>
                      Planned sessions{" "}
                      <small className="muted">({profile?.timezone})</small>
                    </h2>
                    {plan.sessions
                      .slice()
                      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
                      .map((s) => (
                        <article className="session-detail" key={s.id}>
                          <div>
                            <Badge>{s.kind}</Badge>
                            <h3>{s.topic_title}</h3>
                            <p>
                              {date(s.starts_at)} → {date(s.ends_at)}
                            </p>
                            <small>
                              {s.status}
                              {s.locked ? " · Locked" : ""}
                              {s.actual_minutes
                                ? ` · ${s.actual_minutes} actual minutes`
                                : ""}
                            </small>
                          </div>
                          {plan.status === "accepted" &&
                            s.status !== "completed" && (
                              <div>
                                <div className="actions">
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      void run(() =>
                                        api(
                                          "sessions/" + s.id + "/update_state/",
                                          "POST",
                                          { status: "started" },
                                        ),
                                      )
                                    }
                                  >
                                    Start
                                  </button>
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      void run(() =>
                                        api(
                                          "sessions/" + s.id + "/update_state/",
                                          "POST",
                                          { status: "skipped" },
                                        ),
                                      )
                                    }
                                  >
                                    Skip
                                  </button>
                                  <button
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() =>
                                      void run(() =>
                                        api(
                                          "sessions/" + s.id + "/update_state/",
                                          "POST",
                                          { locked: !s.locked },
                                        ),
                                      )
                                    }
                                  >
                                    {s.locked ? "Unlock" : "Lock time"}
                                  </button>
                                </div>
                                <form
                                  className="inline-form"
                                  onSubmit={(e) => {
                                    const f = fields(e);
                                    void run(
                                      () =>
                                        api(
                                          "sessions/" + s.id + "/update_state/",
                                          "POST",
                                          {
                                            status: "completed",
                                            actual_minutes: Number(f.minutes),
                                          },
                                        ),
                                      "Session complete. A proposed revision is ready for review.",
                                    );
                                  }}
                                >
                                  <label>
                                    Actual minutes
                                    <input
                                      type="number"
                                      name="minutes"
                                      min="0"
                                      max="1440"
                                      defaultValue={30}
                                    />
                                  </label>
                                  <button disabled={busy}>
                                    <Check size={15} />
                                    Complete
                                  </button>
                                </form>
                                <details>
                                  <summary>Reschedule</summary>
                                  <form
                                    className="form-stack"
                                    onSubmit={(e) => {
                                      const f = fields(e);
                                      void run(async () => {
                                        const draft = await api<Plan>(
                                          "sessions/" + s.id + "/reschedule/",
                                          "POST",
                                          {
                                            starts_at: new Date(
                                              String(f.starts_at),
                                            ).toISOString(),
                                          },
                                        );
                                        router.push(
                                          "/plan/preview/" + draft.id,
                                        );
                                      }, "Proposed time saved. Review and apply the updated plan.");
                                    }}
                                  >
                                    <label>
                                      New time (browser timezone)
                                      <input
                                        type="datetime-local"
                                        name="starts_at"
                                        required
                                      />
                                    </label>
                                    <button disabled={busy || s.locked}>
                                      Preview new time
                                    </button>
                                  </form>
                                </details>
                              </div>
                            )}
                        </article>
                      ))}
                    {!plan.sessions.length && (
                      <Empty title="There’s no schedulable work yet.">
                        Add syllabus topics, confirm future exams and set your
                        availability. Review unscheduled reasons above.
                      </Empty>
                    )}
                  </section>
                </>
              ) : (
                <Empty title="Make a little room for learning.">
                  Set your availability in Settings, confirm your exams, then
                  generate a draft.
                </Empty>
              )}
            </>
          )}

          {section === "memory" && (
            <>
              <section className="card">
                <h2>Memory is your choice.</h2>
                <p>
                  Save goals, preferences and recurring difficulties. Disabled
                  memory is excluded from new AI requests. Previously saved
                  conversations keep their historical content until you delete
                  them.
                </p>
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      api("profile/", "PATCH", {
                        memory_enabled: !profile?.memory_enabled,
                      }),
                    )
                  }
                >
                  {profile?.memory_enabled
                    ? "Disable AI memory"
                    : "Enable AI memory"}
                </button>
                <Badge>
                  {profile?.memory_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </section>
              <form
                className="card inline-form"
                onSubmit={(e) => {
                  const f = fields(e);
                  void run(() => api("memory/", "POST", f));
                  e.currentTarget.reset();
                }}
              >
                <label>
                  What should StudyLens remember?
                  <input
                    name="text"
                    required
                    placeholder="I prefer explanations with worked examples."
                  />
                </label>
                <label>
                  Source
                  <select name="kind">
                    <option value="fact">My statement</option>
                    <option value="inference">
                      AI inference — needs review
                    </option>
                  </select>
                </label>
                <button disabled={busy || !profile?.memory_enabled}>
                  Save memory
                </button>
              </form>
              {memory.map((m) => (
                <form
                  key={m.id}
                  className="card inline-form"
                  onSubmit={(e) => {
                    const f = fields(e);
                    void run(() => api("memory/" + m.id + "/", "PATCH", f));
                  }}
                >
                  <label>
                    {m.kind}
                    <input name="text" defaultValue={m.text} />
                  </label>
                  <button disabled={busy}>Save edit</button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => remove("memory", m.id, "memory item")}
                  >
                    Delete
                  </button>
                </form>
              ))}
            </>
          )}
          {section === "notifications" && (
            <section className="card">
              {notes.length ? (
                notes.map((n) => (
                  <div className="record" key={n.id}>
                    <Bell size={18} />
                    <p>{n.text}</p>
                    <button
                      disabled={busy || n.read}
                      className="secondary"
                      onClick={() =>
                        void run(() =>
                          api("notifications/" + n.id + "/", "PATCH", {
                            read: true,
                          }),
                        )
                      }
                    >
                      {n.read ? "Read" : "Mark read"}
                    </button>
                  </div>
                ))
              ) : (
                <Empty title="You’re all caught up." />
              )}
            </section>
          )}
          {section === "exports" && (
            <>
              <form
                className="card form-grid"
                onSubmit={(e) => {
                  const f = fields(e);
                  void run(
                    () =>
                      api("exports/", "POST", {
                        kind: f.kind,
                        plan: f.plan ? Number(f.plan) : null,
                      }),
                    "Export queued. The protected download will appear below.",
                  );
                }}
              >
                <h2 className="full">Your work, ready to go.</h2>
                <label>
                  Export format
                  <select name="kind">
                    <option value="data">
                      All personal data and uploads (ZIP)
                    </option>
                    <option value="pdf">Study plan (PDF)</option>
                    <option value="ics">Study plan (calendar ICS)</option>
                  </select>
                </label>
                <label>
                  Plan (required for PDF / calendar)
                  <select name="plan">
                    <option value="">Select a plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        Version {p.id} · {p.status}
                      </option>
                    ))}
                  </select>
                </label>
                <button disabled={busy}>
                  <Download size={17} />
                  Create export
                </button>
                <p className="muted">
                  Downloads are private and expire after 24 hours. Deleting
                  source records invalidates existing bundles.
                </p>
              </form>
              <section className="card">
                {exports.map((x) => (
                  <div className="record" key={x.id}>
                    <Download size={18} />
                    <div>
                      <strong>
                        {x.kind.toUpperCase()} export #{x.id}
                      </strong>
                      {x.error && (
                        <small className="error-text">{x.error}</small>
                      )}
                    </div>
                    <Badge>{x.status}</Badge>
                    {x.status === "ready" && (
                      <a
                        href={"/api/exports/" + x.id + "/download/"}
                        className="button secondary"
                      >
                        Download
                      </a>
                    )}
                    <button
                      className="icon-button"
                      aria-label="Delete export"
                      onClick={() => remove("exports", x.id, "export")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {!exports.length && (
                  <Empty title="Your exports will appear here." />
                )}
              </section>
            </>
          )}
          {section === "feedback" && (
            <>
              <form
                className="card form-stack"
                onSubmit={(e) => {
                  const f = fields(e);
                  void run(
                    () => api("feedback/", "POST", f),
                    "Feedback submitted. Administrator responses appear here.",
                  );
                  e.currentTarget.reset();
                }}
              >
                <label>
                  What needs attention?
                  <select name="category">
                    {[
                      "Answer",
                      "Citation",
                      "Extraction",
                      "Mapping",
                      "Other",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Document / conversation / question reference
                  <input name="reference" />
                </label>
                <label>
                  Describe what went wrong
                  <textarea name="description" required />
                </label>
                <button disabled={busy}>Send feedback</button>
              </form>
              {feedback.map((f) => (
                <article className="card" key={f.id}>
                  <Badge>{f.resolved ? "Resolved" : "Open"}</Badge>
                  <h3>{f.category}</h3>
                  <p>{f.description}</p>
                  <p className="muted">
                    {f.response || "Awaiting an administrator response."}
                  </p>
                </article>
              ))}
            </>
          )}
          {["settings", "profile"].includes(section) && profile && (
            <>
              <form
                className="card form-grid"
                onSubmit={(e) => {
                  const f = fields(e);
                  const availability = String(f.availability)
                    .split("\n")
                    .filter(Boolean)
                    .map((line) => {
                      const [day, start, end] = line.trim().split(/\s+/);
                      return { day: Number(day), start, end };
                    });
                  void run(
                    () =>
                      api("profile/", "PATCH", {
                        ...f,
                        daily_limit: Number(f.daily_limit),
                        session_minutes: Number(f.session_minutes),
                        break_minutes: Number(f.break_minutes),
                        availability,
                        reminders_enabled: f.reminders_enabled === "on",
                      }),
                    "Preferences saved. Review any proposed plan revision.",
                  );
                }}
              >
                <h2 className="full">Your profile & learning preferences</h2>
                {(
                  [
                    "institution",
                    "program",
                    "department",
                    "academic_year",
                    "semester",
                    "language",
                    "timezone",
                  ] as const
                ).map((k) => (
                  <label key={k}>
                    {k.replace("_", " ")}
                    <input name={k} defaultValue={profile[k]} />
                  </label>
                ))}
                <label>
                  Goals
                  <textarea name="goals" defaultValue={profile.goals} />
                </label>
                <h2 className="full">Make time for learning</h2>
                <label>
                  Daily study limit (minutes)
                  <input
                    type="number"
                    name="daily_limit"
                    min="15"
                    max="720"
                    defaultValue={profile.daily_limit}
                  />
                </label>
                <label>
                  Session length (minutes)
                  <input
                    type="number"
                    name="session_minutes"
                    min="15"
                    max="120"
                    defaultValue={profile.session_minutes}
                  />
                </label>
                <label>
                  Break length (minutes)
                  <input
                    type="number"
                    name="break_minutes"
                    min="0"
                    max="60"
                    defaultValue={profile.break_minutes}
                  />
                </label>
                <label className="full">
                  Weekly availability — one window per line: day start end (0 =
                  Monday, 6 = Sunday)
                  <textarea
                    name="availability"
                    rows={7}
                    defaultValue={profile.availability
                      .map((w) => `${w.day} ${w.start} ${w.end}`)
                      .join("\n")}
                    placeholder={"0 17:00 19:00\n2 17:00 19:00\n5 09:00 12:00"}
                  />
                  <small>
                    Times use your profile timezone. Empty availability means no
                    time is scheduled.
                  </small>
                </label>
                <label className="choice">
                  <input
                    type="checkbox"
                    name="reminders_enabled"
                    defaultChecked={profile.reminders_enabled}
                  />
                  Enable in-app reminders
                </label>
                <button disabled={busy}>Save preferences</button>
              </form>
              <div className="split">
                <form
                  className="card form-stack"
                  onSubmit={(e) => {
                    const f = fields(e);
                    void run(
                      () => api("profile/", "POST", f),
                      "Password changed.",
                    );
                  }}
                >
                  <h2>Change password</h2>
                  <label>
                    Current password
                    <input
                      type="password"
                      name="current_password"
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      name="password"
                      minLength={10}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                  <button disabled={busy}>Change password</button>
                </form>
                <form
                  className="card form-stack"
                  onSubmit={(e) => {
                    const f = fields(e);
                    if (
                      window.confirm(
                        "Permanently delete your account, uploads and all related data?",
                      )
                    )
                      void run(async () => {
                        await api("profile/", "DELETE", f);
                        router.push("/");
                      });
                  }}
                >
                  <h2>Your data belongs to you.</h2>
                  <Link href="/exports" className="text-link">
                    Export all my data <ArrowUpRight size={15} />
                  </Link>
                  <p className="muted">
                    Account deletion removes your live records and files. See
                    the project retention policy for backup copies.
                  </p>
                  <label>
                    Current password to confirm deletion
                    <input
                      type="password"
                      name="password"
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <button disabled={busy} className="danger">
                    Permanently delete my account
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
        <footer className="workspace-footer">
          StudyLens <span>Learn with intention.</span>
          <span>Local AI · Check sources · You’re in control</span>
        </footer>
      </div>
    </div>
  );
}

function PageEditor({
  page,
  busy,
  save,
  reprocess,
}: {
  page: Page;
  busy: boolean;
  save: (text: string) => void;
  reprocess: () => void;
}) {
  const [text, setText] = useState(page.text);
  useEffect(() => setText(page.text), [page.text]);
  return (
    <section className="card">
      <div className="section-heading">
        <h2>Page {page.number}</h2>
        <Badge>
          {Math.round(page.confidence * 100)}% extraction confidence
        </Badge>
      </div>
      {page.warning && <p className="alert">{page.warning}</p>}
      <label>
        Extracted text
        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button disabled={busy || text === page.text} onClick={() => save(text)}>
        Save page correction
      </button>{" "}
      <button className="secondary" disabled={busy} onClick={reprocess}>
        Reprocess this page
      </button>
    </section>
  );
}
function CoverageList({
  items,
  busy,
  confirm,
}: {
  items: Coverage[];
  busy: boolean;
  confirm: (id: number) => void;
}) {
  return (
    <section className="card">
      <h2>Syllabus coverage & understanding</h2>
      <p className="muted">
        Suggested keyword matches are partial until reviewed. Estimates are
        starting points, not measured study time.
      </p>
      {items.map((t) => (
        <article className="coverage-row" key={t.id}>
          <div className="section-heading">
            <h3>{t.title}</h3>
            <Badge>{t.coverage}</Badge>
          </div>
          <div className="mastery-line">
            <div className="progress">
              <span
                style={{
                  width: (t.mastery.answered ? t.mastery.score * 100 : 0) + "%",
                }}
              />
            </div>
            <span>
              {t.mastery.state} · {t.mastery.answered} answers
            </span>
          </div>
          <p className="muted">
            {t.estimated_minutes} minutes{" "}
            {t.estimate ? "estimated" : "student override"}
          </p>
          {t.mappings.map((m) => (
            <div className="mapping" key={m.id}>
              <Link href={"/documents/" + m.page__document + "/review"}>
                Source page {m.page__number}
              </Link>
              <small>{m.reason}</small>
              <button
                className="secondary"
                disabled={busy || m.confirmed}
                onClick={() => confirm(m.id)}
              >
                {m.confirmed ? "Match confirmed" : "Confirm match"}
              </button>
            </div>
          ))}
          {["weak", "insufficient evidence"].includes(t.mastery.state) && (
            <Link href="/quizzes/generate" className="text-link">
              Practice this topic <ArrowRight size={14} />
            </Link>
          )}
        </article>
      ))}
      {!items.length && (
        <Empty title="Start with your syllabus topics.">
          Add topics in a course, or extract them from a reviewed syllabus.
        </Empty>
      )}
    </section>
  );
}
