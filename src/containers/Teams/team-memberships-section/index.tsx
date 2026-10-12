import { Suspense } from "react";
import { JoinedBanner } from "../joined-banner";
import { MyTeamMemberships } from "../my-team-memberships";

export function TeamMembershipsSection() {
  return (
    <>
      <Suspense fallback={null}>
        <JoinedBanner />
      </Suspense>
      <MyTeamMemberships />
    </>
  );
}
