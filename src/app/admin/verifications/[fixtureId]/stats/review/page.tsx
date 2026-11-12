import { notFound, redirect } from "next/navigation";

import { StatsReviewWorkspace } from "@/containers/Admin/Verifications/PlayerStatsVerification/components/stats-review-workspace";
import { getCurrentUser } from "@/features/users/user.service";
import {
  approvePendingPlayerStatLinesAction,
  approvePlayerStatLineAction,
  rejectPlayerStatLineAction,
} from "@/features/verification/actions/stats-verification.actions";
import { getStatsVerificationReview } from "@/features/verification/services/stats-verification.service";
import { canCreateTournament } from "@/lib/permissions";

type Props = {
  params: Promise<{ fixtureId: string }>;
};

export default async function StatsReviewPage({ params }: Props) {
  const { fixtureId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/admin/verifications/${fixtureId}/stats/review`)}`,
    );
  }

  if (!canCreateTournament(user)) redirect("/admin");

  const result = await getStatsVerificationReview(fixtureId);
  if (!result?.fixture) notFound();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">
      <StatsReviewWorkspace
        fixture={result.fixture}
        submission={result.submission}
        lines={result.lines}
        approveLine={approvePlayerStatLineAction}
        rejectLine={rejectPlayerStatLineAction}
        approveAllPending={approvePendingPlayerStatLinesAction}
      />
    </div>
  );
}
