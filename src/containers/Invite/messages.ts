export const MESSAGES: Record<string, [string, string]> = {
  invalid: [
    "Invitation not found",
    "This link isn't valid. Check you used the full link from your email.",
  ],
  used: ["Already used", "This invitation has already been accepted."],
  revoked: [
    "Invitation cancelled",
    "The sender cancelled or replaced this invitation. Ask them for a new one.",
  ],
  expired: [
    "Invitation expired",
    "Ask the person who invited you to resend it.",
  ],
  confirm_email: [
    "Confirm your email first",
    "Open the confirmation email we sent when you signed up, then come back to this link.",
  ],
  has_profile: [
    "You already have an athlete profile",
    "Each person can have one. Remove your current profile from your account (Account, Athlete tab) and then use this link again.",
  ],
  no_profile: [
    "This invitation no longer fits your account",
    "It was sent for an athlete profile that isn't on your account any more. Ask the team to send a new invitation.",
  ],
  rate_limited: [
    "Too many attempts",
    "Please wait a few minutes and try again.",
  ],
};
