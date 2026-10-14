import {
  AmericanFootballIcon,
  ShieldCheckIcon,
  ShieldCheckIconFill,
} from "@/components/icons";
import { SectionBadge } from "@/components/section-badge";

export function Mission() {
  return (
    <section
      id="about"
      className="flex flex-col font-sans gap-12 bg-neutral-black px-8 py-4 md:px-40 md:py-16"
    >
      <div className="flex flex-col gap-1">
        <SectionBadge
          icon={
            <ShieldCheckIcon
              className="w-4 h-4 text-transparent"
              stroke="#FF5E00"
            />
          }
          text="Immutable sports passport"
        />
        <h2 className="text-[64px] font-semibold tracking-[-4px] leading-16 text-white">
          Ending the era of fragmented sports data and forgotten athletic
          careers.
        </h2>
        <p className="max-w-3xl font-sans text-base leading-relaxed tracking-[-0.8px] text-neutral-gray-2 mt-3">
          In African grassroots and semi-professional sports, an athlete's stats
          historically vanish when they switch teams, transfer leagues, or move
          abroad. FlagStats builds one record that follows the athlete, not the
          team.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-neutral-covert p-4 lg:col-span-3">
          <div className="space-y-2 p-2">
            <h3 className="font-sans text-[24px] font-medium tracking-[-1.5px] leading-8 text-white">
              Real Verification
            </h3>
            <p className="font-sans text-base font-regular tracking-[-0.8px] leading-6 text-neutral-gray-2">
              A coach submits, a league admin confirms. Nobody verifies their
              own claim.
            </p>
          </div>

          <div className="flex justify-end">
            <ShieldCheckIconFill className="w-20 h-20" color="#2D2E34" />
          </div>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-neutral-covert p-4 lg:col-span-3">
          <div className="space-y-2 p-2">
            <h3 className="font-sans text-[24px] font-medium tracking-[-1.5px] leading-8 text-white">
              One Identity, One record
            </h3>
            <p className="font-sans text-base font-regular tracking-[-0.8px] leading-6 text-neutral-gray-2">
              An athlete&apos;s career follows them across every team and league
              they play in.
            </p>
          </div>

          <div className="flex justify-end">
            <AmericanFootballIcon className="w-20 h-20" color="#2D2E34" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-neutral-covert p-4 lg:col-span-6 h-64">
          <div className="flex flex-col flex-1 gap-2 p-2">
            <SectionBadge
              icon={
                <ShieldCheckIcon
                  className="w-4 h-4 text-transparent"
                  stroke="#FF5E00"
                />
              }
              text="Verification Model"
              className="bg-neutral-black"
            />

            <div className="font-data  tracking-wider flex flex-col justify-end flex-1">
              <div className="flex gap-3 items-center justify-between py-3 max-h-12">
                <span className="font-data text-neutral-gray-2 leading-6 uppercase">
                  SUBMITTED BY
                </span>
                <span className="font-sans text-white leading-6 tracking-[-0.8px] text-right">
                  Coach / Team Manager
                </span>
              </div>

              <div className="flex items-center justify-between py-3 max-h-12">
                <span className="font-data text-neutral-gray-2 leading-6 uppercase">
                  APPROVED BY
                </span>
                <span className="font-sans text-accent-gold leading-6 tracking-[-0.8px] text-right">
                  League admin
                </span>
              </div>

              <div className="flex items-center justify-between py-3 max-h-12">
                <span className="font-data text-neutral-gray-2 leading-6 uppercase">
                  PUBLIC VISIBILITY
                </span>
                <span className="font-sans text-accent-gold leading-6 tracking-[-0.8px] text-right">
                  Only after approval
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
