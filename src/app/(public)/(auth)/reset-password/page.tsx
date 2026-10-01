import { AuthShell } from "@/containers/Auth/shell";
import { ResetPasswordForm } from "@/containers/Forms/reset-password";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      headline="One more step back to the sideline."
      supporting="Choose a new password to get back into your dashboard."
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl tracking-tight">
          Choose a new password
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter and confirm your new password below.
        </p>
      </div>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </AuthShell>
  );
}
