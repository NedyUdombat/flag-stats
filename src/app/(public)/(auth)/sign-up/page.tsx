import { AuthShell } from "@/containers/Auth/shell";
import { SignUpForm } from "@/containers/Forms/sign-up";
import { safeNext } from "@/utils/safe-next";

export const metadata = { title: "Create account" };

interface SignUpPageProps {
  searchParams: Promise<{ email?: string; role?: string; next?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { email, next } = await searchParams;

  return (
    <AuthShell
      headline="A career that follows you."
      supporting="Your entire football career under one roof — one account, one verified record for players, coaches, and leagues."
    >
      <SignUpForm defaultEmail={email} next={safeNext(next)} />
    </AuthShell>
  );
}
