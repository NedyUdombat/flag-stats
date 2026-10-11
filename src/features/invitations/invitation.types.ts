export type InviteActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};
export type InvitationType =
  | "athlete_claim"
  | "team_join"
  | "team_claim"
  | "league_claim"
  | "org_claim";

export type InvitePreview =
  | {
      state:
        | "invalid"
        | "used"
        | "revoked"
        | "expired"
        | "confirm_email"
        | "has_profile";
    }
  | { state: "sign_in" | "wrong_email"; maskedEmail: string }
  | { state: "ready"; type: InvitationType; label: string };

export type MyInvitation = {
  id: string;
  type: InvitationType;
  label: string;
  invitedBy: string | null;
  sentAt: string;
  expiresAt: string;
  expired: boolean;
};

export type AthleteInvitation = {
  id: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  email: string;
  sentAt: string;
  expiresAt: string;
};
