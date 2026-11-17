"use client";

import { SendHorizontal } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/primitives/image-upload";
import { Message } from "../shared/message";
import { Panel } from "../shared/panel";
import {
  buttonPrimary,
  buttonSecondary,
  fieldInput,
  fieldLabel,
} from "../styles";
import { useProfileForm } from "./profile-logic";

export function ProfileForm({
  fullName,
  avatarUrl,
  viewHref,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  viewHref: string;
}) {
  const { state, action, pending } = useProfileForm(viewHref);

  return (
    <Panel
      title="Edit profile"
      description="Manage your personal details and how you appear across FlagStats."
    >
      <form action={action} className="space-y-8">
        <section className="rounded-lg border border-white/10 bg-white/2.5 p-3 md:max-w-64 max-w-full">
          <ImageUpload
            name="avatarUrl"
            label="Photo"
            defaultValue={avatarUrl}
            shape="square"
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="s-full-name" className={fieldLabel}>
              Full name
            </label>
            <p className="mt-1 text-sm text-slate-400 font-sans">
              Your name is displayed on your FlagStats profile.
            </p>

            <input
              id="s-full-name"
              name="fullName"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              defaultValue={fullName ?? ""}
              placeholder="Enter your full name"
              className={`${fieldInput} transition-colors focus:border-accent-gold focus-visible:outline-accent-gold/15`}
            />
          </div>
        </section>

        <Message state={state} />
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
          <Link
            href={viewHref}
            className={`${buttonSecondary} w-full sm:w-auto font-sans text-[14px] capitalize font-normal rounded-sm`}
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={pending}
            className={`${buttonPrimary} w-full sm:w-auto font-sans text-[14px] capitalize font-normal rounded-sm cursor-pointer`}
          >
            {pending ? "Saving…" : "Save profile"}
            <SendHorizontal className="size-4" aria-hidden strokeWidth={2} />
          </button>
        </div>
      </form>
    </Panel>
  );
}
