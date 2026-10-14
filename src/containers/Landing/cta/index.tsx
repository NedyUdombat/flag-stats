import { BadgeCheckIcon } from "@/components/icons";
import { SectionBadge } from "@/components/section-badge";
import { cn } from "@/utils/cn";

export function CtaBanner() {
  return (
    <section
      id="register"
      className="flex flex-col font-sans gap-12 bg-neutral-black px-8 py-4 md:px-40 md:py-16"
    >
      <div
        className={cn(
          repeatingDiamondPatternBG,
          "overflow-hidden rounded-3xl bg-accent-gold px-6 py-14 text-center sm:px-10 lg:mx-auto lg:max-w-8xl w-full background-blur-[20px] shadow-2xl",
          "min-h-121.5",
          "flex flex-col justify-center gap-6 items-center",
        )}
      >
        <div className="flex flex-col items-center gap-6 backdrop-blur-[20px] bg-accent-gold/10 px-6 py-10 md:px-16 mask-[radial-gradient(ellipse_at_center,black_55%,transparent_100%)]">
          <SectionBadge
            icon={
              <BadgeCheckIcon
                className="w-3 h-3 text-transparent"
                stroke="#0B1019"
              />
            }
            text="For league managers & athletic directors"
            className="border border-neutral-black bg-accent rounded-[8px]"
            textClassName="text-neutral-black tracking-[0px] leading-3"
          />
          <h2 className="font-sans max-w-2xl text-[36px] md:text-[64px] font-semibold leading-none tracking-[-4px] text-neutral-black">
            Register Your League or Roster on Flag Africa.
          </h2>
          <p className="font-sans max-w-md text-[16px] md:text-[20px] font-medium leading:5 md:leading-8 tracking-[-1.5px] text-neutral-gray-1">
            Give your players a verified career record and connect your fixtures
            to the wider Flag Africa network.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#platform"
              className="w-full md:w-fit rounded-[8px] bg-neutral-black p-4 text-base font-medium font-data text-accent uppercase transition hover:bg-accent-gold hover:text-neutral-black border border-neutral-black"
            >
              Register roster now
            </a>
            <a
              href="#about"
              className="w-full md:w-fit rounded-[8px] bg-transparent border border-neutral-black p-4 text-base font-medium font-data text-neutral-black uppercase transition hover:bg-neutral-black hover:text-accent-gold"
            >
              Talk to us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const repeatingDiamondPatternBG =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2734.64%27%20height=%2760%27%20viewBox=%270%200%2034.64%2060%27%3E%3Cpath%20fill=%27none%27%20stroke=%27%23000%27%20stroke-opacity=%27.03%27%20stroke-width=%27.6%27%20d=%27M0,-20L17.32,-10L17.32,10L0,20L-17.32,10L-17.32,-10ZM-17.32,-10L0,0L17.32,-10M0,0V20M34.64,-20L51.96,-10L51.96,10L34.64,20L17.32,10L17.32,-10ZM17.32,-10L34.64,0L51.96,-10M34.64,0V20M0,40L17.32,50L17.32,70L0,80L-17.32,70L-17.32,50ZM-17.32,50L0,60L17.32,50M0,60V80M34.64,40L51.96,50L51.96,70L34.64,80L17.32,70L17.32,50ZM17.32,50L34.64,60L51.96,50M34.64,60V80M17.32,10L34.64,20L34.64,40L17.32,50L0,40L0,20ZM0,20L17.32,30L34.64,20M17.32,30V50%27/%3E%3C/svg%3E')] bg-[length:128px_221.7px]";
