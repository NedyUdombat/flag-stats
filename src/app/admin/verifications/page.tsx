import Link from "next/link";
import { redirect } from "next/navigation";
import { VerificationTabs } from "@/containers/Admin/Verifications/components/verification-tabs";
import { FixtureResultVerificationContainer } from "@/containers/Admin/Verifications/FixtureResultVerification/fixture-result-verification-container";
import { PlayerStatsVerificationContainer } from "@/containers/Admin/Verifications/PlayerStatsVerification/player-stats-verification-container";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateTournament } from "@/lib/permissions";

export const metadata = { title: "Verification" };

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  if (!user) redirect("/login?next=/admin/verifications");
  if (!canCreateTournament(user)) redirect("/admin");

  const pageValue = Number(sp.page ?? 1);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  const activeTab = sp.tab === "stats" ? "stats" : "results";

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin" className="hover:text-zs-ink">
            Admin
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-zs-ink">Verification</span>
        </nav>

        <h1 className="font-display text-5xl leading-none font-bold tracking-wide text-zs-ink">
          Verification
        </h1>

        <p className="mt-2 text-zs-muted">
          Review submitted fixture results and individual player statistics.
        </p>
      </header>

      <VerificationTabs activeTab={activeTab} />

      {activeTab === "results" ? (
        <FixtureResultVerificationContainer page={page} />
      ) : (
        <PlayerStatsVerificationContainer page={page} />
      )}
    </div>
  );
}
