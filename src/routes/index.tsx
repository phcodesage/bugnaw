import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { About, AreaMarquee, Hero, Navbar, Services, WhyUs } from "@/components/landing/top";
import { BeforeAfter, Faq, FinalCta, Footer, JunLife, Pricing, Process, RecentJobs, Testimonials } from "@/components/landing/bottom";
import { ChatWidget } from "@/components/landing/ChatWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bugnaw Aircon Care — From ‘Pwede ba ugma?’ to You’re Booked" },
      { name: "description", content: "Aircon cleaning in Mandaue & Cebu. Message in Bisaya, Tagalog or English and get real open slots instantly, a ₱200 GCash deposit and automatic reminders." },
      { property: "og:title", content: "Bugnaw Aircon Care — From ‘Pwede ba ugma?’ to You’re Booked" },
      { property: "og:description", content: "Instant replies in your language, real slots in your area, and reminders handled — so Jun can keep working." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden bg-lp-bg font-inter">
        <Navbar />
        <main>
          <Hero />
          <ChatWidget />
          <AreaMarquee />
          <About />
          <Services />
          <WhyUs />
          <RecentJobs />
          <JunLife />
          <Process />
          <BeforeAfter />
          <Testimonials />
          <Pricing />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
