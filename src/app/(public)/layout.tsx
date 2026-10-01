// import { CookieConsent } from "@/components/consent/cookie-consent";

import { SiteFooter } from "@/containers/Footer";
import { SiteHeader } from "@/containers/Header";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* <CookieConsent /> */}
    </div>
  );
}
