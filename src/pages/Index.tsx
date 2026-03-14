import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemaSection } from "@/components/landing/ProblemaSection";
import { SelloSection } from "@/components/landing/SelloSection";
import { ComoFuncionaSection } from "@/components/landing/ComoFuncionaSection";
import { PackSection } from "@/components/landing/PackSection";
import { PrecioSection } from "@/components/landing/PrecioSection";
import { TalleresSection } from "@/components/landing/TalleresSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemaSection />
      <SelloSection />
      <ComoFuncionaSection />
      <PackSection />
      <PrecioSection />
      <TalleresSection />
      <Footer />
    </div>
  );
};

export default Index;
