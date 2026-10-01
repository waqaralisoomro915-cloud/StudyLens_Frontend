export type Course = {
  id: number;
  title: string;
  code: string;
  description: string;
};
export type Topic = {
  id: number;
  course: number;
  title: string;
  unit: string;
  estimated_minutes: number;
  difficulty: number;
  estimate_override: boolean;
};
export type Page = {
  id: number;
  number: number;
  text: string;
  confidence: number;
  warning: string;
};
export type Document = {
  id: number;
  title: string;
  course: number;
  kind: string;
  status: string;
  confirmed: boolean;
  error: string;
  pages: Page[];
};
export type Citation = {
  id: number;
  document: number;
  title: string;
  page: number;
  quote: string;
};
export type Message = {
  id: number;
  role: string;
  text: string;
  citations: Citation[];
};
export type Chat = {
  id: number;
  course: number;
  mode: string;
  title: string;
  messages: Message[];
};
export type Question = { text: string; choices: string[]; topic_id: number };
export type Quiz = {
  id: number;
  course: number;
  title: string;
  status: string;
  error: string;
  questions: Question[];
};
export type Attempt = {
  id: number;
  quiz: number;
  correct: number;
  total: number;
  results: (Question & {
    selected: number;
    correct: number;
    is_correct: boolean;
    explanation: string;
    citations: Citation[];
  })[];
};
export type Exam = {
  all_topics: boolean;
  topics: number[];
  id: number;
  course: number;
  title: string;
  starts_at: string | null;
  duration_minutes: number | null;
  confirmed: boolean;
  warning: string;
  source_quote: string;
};
export type Session = {
  id: number;
  topic: number;
  topic_title: string;
  starts_at: string;
  ends_at: string;
  kind: string;
  status: string;
  locked: boolean;
  actual_minutes: number;
};
export type Plan = {
  id: number;
  status: string;
  previous: number | null;
  reason: string;
  sessions: Session[];
  conflicts: string[];
  unscheduled: { title: string; minutes: number; reason: string }[];
};
export type Profile = {
  username: string;
  institution: string;
  program: string;
  department: string;
  academic_year: string;
  semester: string;
  goals: string;
  language: string;
  timezone: string;
  memory_enabled: boolean;
  reminders_enabled: boolean;
  daily_limit: number;
  session_minutes: number;
  break_minutes: number;
  availability: { day: number; start: string; end: string }[];
};
export type Coverage = {
  id: number;
  title: string;
  coverage: string;
  estimated_minutes: number;
  estimate: boolean;
  mastery: { score: number; answered: number; state: string; method: string };
  mappings: {
    id: number;
    page: number;
    page__document: number;
    page__number: number;
    reason: string;
    confirmed: boolean;
    score: number;
  }[];
};
export type Note = { id: number; text: string; read: boolean };
export type Memory = { id: number; text: string; kind: string };
export type ExportJob = {
  id: number;
  kind: string;
  status: string;
  error: string;
};
export type Feedback = {
  id: number;
  category: string;
  description: string;
  response: string;
  resolved: boolean;
};
