import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/social-icons";

const PLATFORM_LINKS = [
  { href: "/athletes", label: "Athletes" },
  { href: "/teams", label: "Teams" },
  { href: "/leagues", label: "Leagues" },
  { href: "/organizations", label: "Federations" },
  { href: "/standings", label: "Standings" },
  { href: "/blog", label: "Blog" },
];

const COMPANY_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/about-us", label: "About us" },
  { href: "/login", label: "Sign in" },
  { href: "/cookies-policy", label: "Cookies Policy" },
];

const SOCIAL_LINKS = [
  { href: "", label: "X (Twitter)", icon: XIcon },
  {
    href: "",
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: "",
    label: "Facebook",
    icon: FacebookIcon,
  },
  {
    href: "",
    label: "Tiktok",
    icon: TikTokIcon,
  },
  {
    href: "",
    label: "LinkedIn",
    icon: LinkedInIcon,
  },
  {
    href: "",
    label: "YouTube",
    icon: YouTubeIcon,
  },
];

const FOOTER_SECTIONS = [
  {
    title: "Platform",
    links: PLATFORM_LINKS,
  },
  {
    title: "Company",
    links: COMPANY_LINKS,
  },
];

export { SOCIAL_LINKS, FOOTER_SECTIONS };
