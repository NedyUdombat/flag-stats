import { AuthShell } from "@/containers/Auth/shell";
import { SignUpForm } from "@/containers/Forms/sign-up";
import { getSignupScopeOptions } from "@/features/auth/service";

export const metadata = { title: "Create account" };

interface SignUpPageProps {
  searchParams: Promise<{ email?: string; role?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { email, role } = await searchParams;
  const scopeOptions = await getSignupScopeOptions();

  return (
    <AuthShell
      headline="A career that follows you, not your team."
      supporting="Athletes, coaches, and league administrators all start here — one account, one verified record."
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl tracking-tight">
          Create an account
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up access to manage your team, league, or federation&apos;s data.
        </p>
      </div>
      <div className="mt-8">
        <SignUpForm
          scopeOptions={scopeOptions}
          defaultEmail={email}
          defaultRole={role === "athlete" ? "athlete" : undefined}
        />
      </div>
    </AuthShell>
  );
}
