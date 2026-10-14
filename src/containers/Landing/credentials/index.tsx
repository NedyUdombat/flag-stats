"use client";

import { CircleUserRound } from "lucide-react";
import { useState } from "react";
import { SectionBadge } from "@/components/section-badge";
import { CREDENTIAL_CARDS } from "./credentials";
import { CredentialsCard } from "./credentials-card";

export function Credentials() {
  const [activeCardId, setActiveCardId] = useState<string>("coaches");

  const cards = CREDENTIAL_CARDS;

  return (
    <section
      id="credentials"
      className="flex flex-col font-sans gap-12 bg-neutral-black px-8 py-4 md:px-40 md:py-16"
    >
      <div className="flex flex-col gap-1">
        <SectionBadge
          icon={<CircleUserRound className="text-accent-orange" size={16} />}
          text="REGISTRY ACCESS"
        />
        <h2 className="text-[64px] font-semibold tracking-[-.06em] text-white">
          Pick Your Credential
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const isActive = activeCardId === card.id;

          return (
            <CredentialsCard
              key={card.id}
              card={card}
              isActive={isActive}
              setActiveCardId={setActiveCardId}
            />
          );
        })}
      </div>
    </section>
  );
}
