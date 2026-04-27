import { HeroSection } from '@/components/sections/HeroSection';
import { ProblemSection } from '@/components/sections/ProblemSection';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { CTASection } from '@/components/sections/CTASection';

export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
