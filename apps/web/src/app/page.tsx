import { Header } from "@/components/home/header";
import { HeroLesson } from "@/components/home/hero-lesson";
import { ProgressSidebar } from "@/components/home/progress-sidebar";
import { QuickPractice } from "@/components/home/quick-practice";
import { RightToolbar } from "@/components/home/right-toolbar";
import { TimeAwareBackground } from "@/components/home/time-aware-background";

export default function HomePage() {
  return (
    <main className="home-shell">
      <TimeAwareBackground />
      <div className="particle-field" aria-hidden="true">
        {Array.from({ length: 42 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="home-content-layer">
        <Header />
        <HeroLesson />
        <ProgressSidebar />
        <QuickPractice />
        <RightToolbar />
      </div>
    </main>
  );
}
