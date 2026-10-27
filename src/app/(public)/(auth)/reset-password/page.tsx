import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/primitives/button";
import { AuthShell } from "@/containers/Auth/shell";
import { ResetPasswordForm } from "@/containers/Forms/reset-password";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash } = await searchParams;

  if (!token_hash) {
    return (
      <AuthShell
        headline="Invalid or expired link"
        supporting="This password reset link is missing required verification details or has expired."
        icon={
          <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
            <AlertCircleIcon className="size-7" aria-hidden="true" />
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Button type="button" className="w-full" asChild size="lg">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="One more step back to the sideline."
      supporting="Choose a new password to get back into your account."
    >
      <ResetPasswordForm tokenHash={token_hash} />
    </AuthShell>
  );
}
