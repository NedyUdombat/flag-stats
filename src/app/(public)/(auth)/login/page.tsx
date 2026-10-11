import { AuthShell } from "@/containers/Auth/shell";
import { LoginForm } from "@/containers/Forms/login";
import { safeNext } from "@/utils/safe-next";

export const metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<{ next?: string; email?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, email } = await searchParams;
  const defaultEmail =
    email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : undefined;

  return (
    <AuthShell
      headline="Sign in"
      supporting="Pick up where you left off: your stats, your team, or your league."
    >
      <div className="mt-10">
        <LoginForm next={safeNext(next)} defaultEmail={defaultEmail} />
      </div>
    </AuthShell>
  );
}
