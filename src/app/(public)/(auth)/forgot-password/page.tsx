import { AuthShell } from "@/containers/Auth/shell";
import { ForgotPasswordForm } from "@/containers/Forms/forgot-password";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      headline="Verified data doesn't lock you out."
      supporting="We'll get you a reset link so you're back in your league's data in minutes."
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl tracking-tight">
          Reset your password
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a link to reset it.
        </p>
      </div>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  );
}
