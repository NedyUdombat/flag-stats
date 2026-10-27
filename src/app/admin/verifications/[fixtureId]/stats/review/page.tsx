import { notFound, redirect } from "next/navigation";
import { StatsReviewWorkspace } from "@/containers/Admin/Verifications/PlayerStatsVerification/components/stats-review-workspace";
import { getCurrentUser } from "@/features/users/user.service";
import {
  approvePendingPlayerStatLinesAction,
  approvePlayerStatLineAction,
  rejectPlayerStatLineAction,
} from "@/features/verification/actions/stats-verification.actions";
import { getStatsVerificationReview } from "@/features/verification/services/stats-verification.service";
// import { StatsReviewWorkspace } from "@/containers/admin/verifications/PlayerStatsVerification/components/stats-review-workspace";
// import { getCurrentUser } from "@/features/auth/auth.service";
// import { canCreateTournament } from "@/features/tournaments/tournament.permissions";
// Replace these with the actual functions in your project.
// The detail query must return the latest revision for each player-stat line.
// The actions must enforce reviewer permissions on the server.
// import { getStatsVerificationReview } from "@/features/verification/services/verification.service";
// import {
//   approvePendingPlayerStatLinesAction,
//   approvePlayerStatLineAction,
//   rejectPlayerStatLineAction,
// } from "@/features/verification/verification.actions";
import { canCreateTournament } from "@/lib/permissions";

type Props = {
  params: Promise<{ fixtureId: string }>;
};

export default async function StatsReviewPage({ params }: Props) {
  const { fixtureId } = await params;

  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/admin/verifications/${fixtureId}/stats/review`,
      )}`,
    );
  }

  if (!canCreateTournament(user)) {
    redirect("/admin");
  }

  const result = await getStatsVerificationReview(fixtureId);
  console.log({ result });

  if (!result?.fixture) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
      <StatsReviewWorkspace
        fixture={result.fixture}
        approveLine={approvePlayerStatLineAction}
        rejectLine={rejectPlayerStatLineAction}
        approveAllPending={approvePendingPlayerStatLinesAction}
      />
    </div>
  );
}
