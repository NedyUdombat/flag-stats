"use client";

import { CheckIcon } from "lucide-react";
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
      description="Your name and photo as they appear across ZedyStats."
    >
      <form action={action} className="space-y-5">
        <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
          <ImageUpload
            name="avatarUrl"
            label="Photo"
            defaultValue={avatarUrl}
            shape="square"
          />
          <div>
            <label htmlFor="s-full-name" className={fieldLabel}>
              Full name
            </label>
            <input
              id="s-full-name"
              name="fullName"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              defaultValue={fullName ?? ""}
              className={fieldInput}
            />
          </div>
        </div>
        <Message state={state} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            <CheckIcon className="size-4" aria-hidden />
            {pending ? "Saving…" : "Save profile"}
          </button>
          <Link href={viewHref} className={buttonSecondary}>
            Cancel
          </Link>
        </div>
      </form>
    </Panel>
  );
}
