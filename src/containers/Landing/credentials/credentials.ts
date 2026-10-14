export interface CredentialCard {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  imageSrc: string;
}

const CREDENTIAL_CARDS: CredentialCard[] = [
  {
    id: "athletes",
    title: "Athletes",
    description:
      "Claim your official profile, lock in your game stats, and build a verified career passport that travels with you.",
    ctaText: "CLAIM YOUR PROFILE",
    ctaHref: "/sign-up?role=athlete",
    imageSrc: "/images/athlete.jpg",
  },
  {
    id: "coaches",
    title: "Coaches",
    description:
      "Manage your roster, submit results and stats, and give your athletes a record worth having.",
    ctaText: "SET UP YOUR TEAM",
    ctaHref: "/sign-up?role=coach",
    imageSrc: "/images/coach.jpg",
  },
  {
    id: "leagues",
    title: "Leagues",
    description:
      "Run your tournaments, automate standings, and publish official box scores across every matchday.",
    ctaText: "CREATE YOUR LEAGUE",
    ctaHref: "/sign-up?role=league",
    imageSrc: "/images/league.jpg",
  },
  {
    id: "federations",
    title: "Federations",
    description:
      "Sanction official competitions, oversee national participation, and govern verified athlete records across regions.",
    ctaText: "REGISTER FEDERATION",
    ctaHref: "/sign-up?role=federation",
    imageSrc: "/images/federation.jpg",
  },
];

export { CREDENTIAL_CARDS };
