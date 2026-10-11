import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { getCurrentUser } from "@/features/users/user.service";
import { logServerError } from "@/lib/errors";
import { rateKey, rateLimit } from "@/lib/rate-limit";
import type { CreateResult } from "@/lib/slug/with-unique-slug";
import type { CurrentUser } from "@/types/users/types";
import { type EntityActionState, fieldErrorsFrom } from "./shared";

export async function runCreate<T>(opts: {
  kind: "team" | "league" | "organization";
  schema: z.ZodType<T>;
  raw: unknown;
  allowed: (user: CurrentUser) => boolean;
  create: (data: T) => Promise<CreateResult>;
}): Promise<EntityActionState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Please sign in again." };
  if (!opts.allowed(user))
    return { status: "error", message: "You can't create this." };

  const parsed = opts.schema.safeParse(opts.raw);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  if (!(await rateLimit(rateKey(`create-${opts.kind}`, user.id), 5, 86400))) {
    return {
      status: "error",
      message:
        "You've created several already today. Please try again tomorrow.",
    };
  }

  const result = await opts.create(parsed.data);
  if (!result.ok) {
    logServerError(`${opts.kind}.create`, result.error);
    return {
      status: "error",
      message:
        result.error?.code === "P0001"
          ? result.error.message // the SQL function's own messages are written for users
          : "Could not create it. Please try again.",
    };
  }

  revalidatePath("/account", "layout");
  redirect(
    opts.kind === "team"
      ? `/admin/teams/${result.data}?created=1`
      : "/account?tab=teams",
  );
}
