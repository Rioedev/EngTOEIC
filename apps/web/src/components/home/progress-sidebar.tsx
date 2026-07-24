import { CircleDot } from "lucide-react";
import { progressCards, streakIcon as Flame } from "./home-data";
import { BottomModeSwitcher } from "./bottom-mode-switcher";

export function ProgressSidebar() {
  return (
    <aside className="progress-sidebar" aria-label="Tiến độ học hôm nay">
      <div className="progress-task-stack">
        {progressCards.map((card) => (
          <article
            className={`progress-card glass-card progress-card-${card.tone}`}
            key={card.title}
          >
            <span className="progress-card-eyebrow">{card.eyebrow}</span>
            <strong className="progress-card-title">{card.title}</strong>
          </article>
        ))}
      </div>

      <div className="progress-stats">
        <article className="streak-card glass-card">
          <span className="progress-card-eyebrow">Streak</span>
          <strong className="streak-value">
            3 <Flame size={20} aria-hidden="true" />
          </strong>
        </article>

        <article className="challenge-card glass-card">
          <span className="progress-card-eyebrow">Hằng ngày</span>
          <strong className="challenge-title">
            Thử thách <CircleDot size={17} aria-hidden="true" />
          </strong>
          <small className="challenge-time">06:42:36</small>
        </article>
      </div>

      <BottomModeSwitcher />
    </aside>
  );
}
