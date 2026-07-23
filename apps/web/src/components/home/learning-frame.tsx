import { BottomModeSwitcher } from "./bottom-mode-switcher";
import { Header } from "./header";
import { RightToolbar } from "./right-toolbar";

export function LearningFrame() {
  return (
    <div className="learning-frame">
      <div className="particle-field" aria-hidden="true">
        {Array.from({ length: 42 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <Header />
      <RightToolbar />
      <div className="learning-mode-dock">
        <BottomModeSwitcher />
      </div>
    </div>
  );
}
