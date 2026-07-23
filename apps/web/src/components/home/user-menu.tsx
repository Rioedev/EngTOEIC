"use client";

import { LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type UserMenuProps = {
  displayName: string;
  email?: string;
};

export function UserMenu({ displayName, email }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initial = displayName.charAt(0).toLocaleUpperCase() || "U";

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="home-user-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        className="glass-icon home-user-avatar-button"
        type="button"
        aria-label={`Mở menu tài khoản của ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{initial}</span>
      </button>

      {isOpen ? (
        <div className="home-user-popover" id={menuId} role="menu">
          <div className="home-user-summary">
            <span className="home-user-summary-avatar" aria-hidden="true">
              {initial}
            </span>
            <div>
              <p className="home-user-summary-label">Tài khoản</p>
              <p className="home-user-summary-name">{email ?? displayName}</p>
            </div>
          </div>

          <form action="/auth/signout" method="post">
            <button className="home-user-signout" type="submit" role="menuitem">
              <LogOut size={17} aria-hidden="true" />
              Đăng xuất
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
