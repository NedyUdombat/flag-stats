import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Panel } from "../shared/panel";
import { buttonPrimary } from "../styles";

export function AthleteEmpty({ createHref }: { createHref: string }) {
  return (
    <Panel
      title="No athlete profile yet"
      description="Your athlete profile is your public career record across teams, leagues and countries."
    >
      <div className="space-y-4">
        <p className="max-w-2xl text-sm text-zs-muted">
          If a team or league already created a profile for you, check your
          email for a claim invitation instead. Creating a second one would
          split your career record.
        </p>
        <Link href={createHref} className={buttonPrimary}>
          <PlusIcon className="size-4" aria-hidden />
          Create athlete profile
        </Link>
      </div>
    </Panel>
  );
}
