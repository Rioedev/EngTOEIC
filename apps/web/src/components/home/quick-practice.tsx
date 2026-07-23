import Link from "next/link";
import { practiceActions } from "./home-data";

export function QuickPractice() {
  return (
    <section
      className="quick-practice"
      id="quick-practice"
      aria-label="Lựa chọn luyện tập"
    >
      <span className="quick-practice-title">Thêm lựa chọn luyện tập</span>
      <div className="quick-practice-actions">
        {practiceActions.map((action, index) =>
          index === 1 ? (
            <Link className="glass-chip" href="/vocabulary" key={action.label}>
              <action.icon size={16} strokeWidth={2} aria-hidden="true" />
              {action.label}
            </Link>
          ) : (
            <button className="glass-chip" key={action.label} type="button">
              <action.icon size={16} strokeWidth={2} aria-hidden="true" />
              {action.label}
            </button>
          ),
        )}
      </div>
    </section>
  );
}
