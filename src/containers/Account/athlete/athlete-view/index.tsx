import type { MyAthleteProfile } from "@/features/shared/types";
import type { CurrentUser } from "@/types/users/types";
import { AthleteDangerZone } from "../athlete-danger-zone";
import { AthleteProfileDetails } from "./athlete-profile-details";
import { AthleteProfileIdentitySummary } from "./athlete-profile-identity-summary";

export function AthleteView({
  profile,
  editHref,
  viewHref,
  user,
}: {
  profile: MyAthleteProfile;
  editHref: string;
  viewHref: string;
  user: CurrentUser;
}) {
  const { athlete: a, contactPhone, careerTotals, contactEmail } = profile;

  return (
    <div className="space-y-6">
      <AthleteProfileIdentitySummary
        athlete={a}
        user={user}
        editHref={editHref}
        careerTotals={careerTotals}
      />
      <AthleteProfileDetails
        athlete={a}
        contactPhone={contactPhone}
        contactEmail={contactEmail}
      />

      <AthleteDangerZone viewHref={viewHref} />
    </div>
  );
}
