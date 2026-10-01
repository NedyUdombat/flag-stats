import "server-only";

import { logServerError } from "@/lib/errors";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? process.env.CONTACT_EMAIL_FROM;

  if (!apiKey || !from) {
    logServerError(
      "email.send",
      new Error("Missing RESEND_API_KEY or EMAIL_FROM"),
    );
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      logServerError(
        "email.send",
        new Error(`Resend API error: ${response.status} ${body}`),
      );
      return false;
    }
    return true;
  } catch (error) {
    logServerError("email.send", error);
    return false;
  }
}
