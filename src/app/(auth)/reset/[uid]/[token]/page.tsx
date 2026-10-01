import AuthForm from "@/features/auth/AuthForm";
export default async function Page({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;
  return <AuthForm mode="reset-password" uid={uid} token={token} />;
}
