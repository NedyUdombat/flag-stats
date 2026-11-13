import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { getAthleteTint } from "@/lib/tints";
import { initials } from "@/lib/display";
import type { CurrentUser } from "@/types/users/types";
import { cn } from "@/utils/cn";
import type { SettingsMode } from "../account-tabs";
import { buttonSecondary } from "../styles";
import { ProfileForm } from "./profile-form";

export function ProfileTab({
  user,
  mode,
  basePath,
  roleLabel,
}: {
  user: CurrentUser;
  mode: SettingsMode;
  basePath: string;
  roleLabel: string;
}) {
  const viewHref = `${basePath}?tab=profile`;
  const editing = mode === "edit";

  const fallbackTint = getAthleteTint(user.id || user.fullName || "default");
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg border border-white/10 p-5 sm:p-7">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar className="grid size-20 place-items-center overflow-hidden rounded-xl bg-neutral-gray-1 object-cover sm:size-24">
              <AvatarImage
                src={user.avatarUrl ?? ""}
                alt={`${user.fullName ?? "User"}'s avatar`}
                className="size-full object-cover"
              />
              <AvatarFallback
                className={cn(
                  "grid size-full place-items-center font-sans text-3xl font-black text-accent-gold",
                  fallbackTint,
                )}
              >
                {initials(user.fullName, user.email)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <h3 className="wrap-break-word font-sans text-2xl font-black uppercase leading-tight tracking-[-.04em] text-white sm:text-3xl">
              {user.fullName ?? "Name not set"}
            </h3>
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>{roleLabel}</span>
              {user.email && (
                <>
                  <span className="text-white/20">/</span>
                  <span className="break-all font-data text-xs">
                    {user.email}
                  </span>
                </>
              )}
            </p>
          </div>

          <Link
            href={editing ? viewHref : `${viewHref}&mode=edit`}
            className={cn(
              buttonSecondary,
              "font-sans text-[14px] capitalize font-normal rounded-sm bg-black/40",
            )}
          >
            {!editing ? (
              <SlidersHorizontal className="size-4" aria-hidden />
            ) : (
              <X className="size-4" aria-hidden />
            )}
            {editing ? "Cancel edit" : "Edit profile"}
          </Link>
        </div>
      </section>

      {editing ? (
        <ProfileForm
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
          viewHref={viewHref}
        />
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/2 p-4 sm:p-5">
          <p className="text-sm leading-6 text-slate-400 font-sans">
            Your account profile is the foundation of your FlagStats identity.
            Sports details are managed in the Athlete section, while teams,
            leagues, and organizations are managed in Teams &amp; organizations.
          </p>
        </div>
      )}
    </div>
  );
}
