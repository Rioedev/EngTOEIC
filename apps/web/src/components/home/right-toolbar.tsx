import { WalletCards } from "lucide-react";
import { rightToolbarActions } from "./home-data";

export function RightToolbar() {
  return (
    <>
      <aside className="right-toolbar" aria-label="Công cụ nhanh">
        {rightToolbarActions.map((action) => (
          <button
            className="glass-icon"
            key={action.label}
            type="button"
            title={action.label}
          >
            <action.icon size={19} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">{action.label}</span>
          </button>
        ))}
      </aside>

      <div className="xp-badge glass-panel">
        <WalletCards size={18} aria-hidden="true" />
        <span>1,240 XP</span>
      </div>
    </>
  );
}
