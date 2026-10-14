// import { CookieConsent } from "@/components/consent/cookie-consent";

import { dataFont, dmSansFont } from "@/components/fonts";
import { SiteFooter } from "@/containers/Footer";
import { SiteHeader } from "@/containers/Header";
import { cn } from "@/utils/cn";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div
      className={cn(
        dmSansFont.variable,
        dataFont.variable,
        "flex min-h-screen flex-col",
      )}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* <CookieConsent /> */}
    </div>
  );
}
