"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function useRedirectOnSuccess(
  status: string,
  href: string,
  message?: string,
) {
  const router = useRouter();
  useEffect(() => {
    if (status !== "success") return;
    if (message) toast.success(message);
    router.replace(href);
    router.refresh();
  }, [status, href, message, router]);
}
