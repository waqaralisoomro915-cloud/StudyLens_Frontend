import Workspace from "@/features/workspace/Workspace";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  if (
    ![
      "dashboard",
      "courses",
      "documents",
      "tutor",
      "quizzes",
      "mastery",
      "exams",
      "plan",
      "memory",
      "notifications",
      "exports",
      "feedback",
      "settings",
      "profile",
    ].includes(path[0])
  )
    notFound();
  return <Workspace path={path} />;
}
