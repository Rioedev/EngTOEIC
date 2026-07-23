import { BookOpen, Timer } from "lucide-react";

export function BottomModeSwitcher() {
  return (
    <div className="bottom-mode-switcher glass-panel">
      <button className="bottom-mode-button active" type="button">
        <BookOpen size={16} aria-hidden="true" />
        Study
      </button>
      <button className="bottom-mode-button" type="button">
        <Timer size={16} aria-hidden="true" />
        Pomodoro
      </button>
    </div>
  );
}
