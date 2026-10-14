import { CreditCardCheck } from "lucide-react";
import { SectionBadge } from "@/components/section-badge";

export function OnboardingProtocol() {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      text: "Sign up free as a coach, league admin, or federation admin.",
    },
    {
      number: "02",
      title: "Set up your team or league",
      text: "Add your roster, or create your league and its seasons.",
    },
    {
      number: "03",
      title: "Submit results and stats",
      text: "After every game, log the result and each athlete's stat line.",
    },
    {
      number: "04",
      title: "Get verified",
      text: "A league admin reviews and confirms, then it's live on every profile.",
    },
  ];

  return (
    <section
      id="onboarding-protocol"
      className="flex flex-col font-sans gap-12 bg-neutral-black px-8 py-4 md:px-40 md:py-16"
    >
      <div className="flex flex-col gap-1">
        <SectionBadge
          icon={<CreditCardCheck className="text-accent-orange" size={16} />}
          text="Onboarding Protocol"
        />
        <h2 className="text-[64px] font-semibold tracking-[-.06em] text-white">
          One form, <span className="text-accent">One Record.</span>
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ number, title, text }) => (
          <div
            key={number}
            className="relative flex min-h-55 flex-col justify-between overflow-hidden rounded-2xl border border-transparent bg-neutral-covert p-6 transition-all duration-300 hover:border-accent-gold/40 hover:-translate-y-1"
          >
            <div className="relative flex flex-col gap-2">
              <h3 className="font-sans text-[24px] font-medium leading-snug tracking-tight text-white">
                {title}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-neutral-gray-2">
                {text}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <span className="font-sans text-6xl font-black tracking-tighter text-white/10 select-none">
                {number}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
