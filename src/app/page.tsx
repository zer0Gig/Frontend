import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AgentLiveDemo from "@/components/AgentLiveDemo";
import StatsBar from "@/components/StatsBar";
import AgentCategories from "@/components/AgentCategories";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";

// Below-fold sections — lazily loaded to reduce initial bundle parse time
const AgentCapabilities = dynamic(() => import("@/components/AgentCapabilities"));
const GameTheory        = dynamic(() => import("@/components/GameTheory"));
const ForAgentOwners   = dynamic(() => import("@/components/ForAgentOwners"));
const AgentShowcase    = dynamic(() => import("@/components/AgentShowcase"),    { ssr: false });
const IsometricAgent   = dynamic(() => import("@/components/IsometricAgent"),   { ssr: false });
const ArchitectureSection = dynamic(() => import("@/components/ArchitectureSection"), { ssr: false });
const FAQSection       = dynamic(() => import("@/components/FAQSection"));
const RoadmapSection   = dynamic(() => import("@/components/RoadmapSection"));
const CTASection       = dynamic(() => import("@/components/CTASection"));
const Footer           = dynamic(() => import("@/components/Footer"));
const BuiltOn0G        = dynamic(() => import("@/components/BuiltOn0G"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AgentLiveDemo />
      <StatsBar />
      <AgentCategories />
      <HowItWorks />
      <FeaturesGrid />
      <BuiltOn0G />
      <AgentCapabilities />
      <GameTheory />
      <ForAgentOwners />
      <AgentShowcase />
      <IsometricAgent />
      <ArchitectureSection />
      <FAQSection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </main>
  );
}
