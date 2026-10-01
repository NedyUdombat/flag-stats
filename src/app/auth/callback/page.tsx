"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPostLoginDestination } from "@/features/auth/actions";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      async function completeAuthFlow(rawNextParam: string | null) {
        const destination =
          rawNextParam?.startsWith("/") && !rawNextParam.startsWith("//")
            ? rawNextParam
            : await getPostLoginDestination();

        router.replace(destination);
        router.refresh();
      }

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const queryNext = searchParams.get("next");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        await completeAuthFlow(queryNext);
        return;
      }

      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashNext = hashParams.get("next") ?? queryNext;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (typeof window !== "undefined" && window.history.replaceState) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }

        await completeAuthFlow(hashNext);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await completeAuthFlow(queryNext);
        return;
      }

      setErrorMsg("No authorization code or active session found.");
    }

    handleAuth();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg max-w-md">
          <p className="text-red-500 font-medium">Authentication Error</p>
          <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted-foreground animate-pulse">
        Completing sign-in, please wait...
      </p>
    </div>
  );
}
