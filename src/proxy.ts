import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/account", "/admin"];
const AUTH_PAGES = ["/login", "/sign-up", "/forgot-password"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

function redirectTo(request: NextRequest, path: string, carry?: NextResponse) {
  const res = NextResponse.redirect(new URL(path, request.url));
  carry?.cookies.getAll().forEach((c) => {
    res.cookies.set(c);
  });
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED);
  const isAuthPage = matches(pathname, AUTH_PAGES);
  const loginUrl = `/login?next=${encodeURIComponent(pathname + search)}`;
  const headers = new Headers(request.headers);
  headers.set("x-current-path", request.nextUrl.pathname);

  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hasSession) {
    return isProtected ? redirectTo(request, loginUrl) : NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      ...request,
      headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) return redirectTo(request, loginUrl, response);
  if (user && isAuthPage) return redirectTo(request, "/account", response);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
