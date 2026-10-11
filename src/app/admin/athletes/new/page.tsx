import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAthleteForm } from "@/containers/Admin/Athletes/athlete-form/athlete-form";
import { getCurrentUser } from "@/features/users/user.service";
import { canCreateAthleteForOthers } from "@/lib/permissions";

export const metadata = { title: "Add athlete" };

export default async function NewAthletePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/athletes/new");
  if (!canCreateAthleteForOthers(user)) redirect("/admin/athletes");

  return (
    <div className="space-y-6">
      <header className="border-b border-zs-line pb-5">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-zs-muted">
          <Link href="/admin/athletes" className="hover:text-zs-ink">
            Athletes
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-zs-ink">Add</span>
        </nav>
        <h1 className="font-display text-4xl leading-none font-bold tracking-wide text-zs-ink uppercase">
          Add athlete
        </h1>
      </header>
      <AdminAthleteForm
        mode="create"
        initial={{
          fullName: "",
          dateOfBirth: "",
          gender: "",
          primaryPosition: "",
        }}
        cancelHref="/admin/athletes"
      />
    </div>
  );
}
