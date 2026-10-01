import { AuthShell } from "@/containers/Auth/shell";
import { LoginForm } from "@/containers/Forms/login";

export const metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

function safeNext(next?: string) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <AuthShell
      headline="Sign in"
      supporting="Pick up where you left off: your stats, your team, or your league."
    >
      <div className="mt-10">
        <LoginForm next={safeNext(next)} />
      </div>
    </AuthShell>
  );
}
