import { AuthShell } from "@/containers/Auth/shell";
import { ForgotPasswordForm } from "@/containers/Forms/forgot-password";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      headline="Verified data doesn't lock you out."
      supporting="We'll get you a reset link so you're back in your data in minutes."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
