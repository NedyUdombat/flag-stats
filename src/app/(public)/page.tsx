import { Credentials } from "@/containers/Landing/credentials";
import { CtaBanner } from "@/containers/Landing/cta";
import { FeaturedContainer } from "@/containers/Landing/featured";
import { Hero } from "@/containers/Landing/hero";
import { Metrics } from "@/containers/Landing/metrics";
import { Mission } from "@/containers/Landing/mission";
import { OnboardingProtocol } from "@/containers/Landing/onboarding-protocol";
import { FeatureShowcase } from "@/containers/Landing/showcase";

export default function HomePage() {
  return (
    <div className="">
      <Hero />
      <FeaturedContainer />
      <FeatureShowcase />
      <Metrics />
      <OnboardingProtocol />
      <Credentials />
      <Mission />
      <CtaBanner />
    </div>
  );
}
