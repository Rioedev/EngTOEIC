import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { headerActions } from "./home-data";
import { ThemeCustomizer } from "./theme-customizer";
import { UserMenu } from "./user-menu";

export async function Header() {
  let user: {
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  } | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const displayName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email;

  return (
    <header className="home-header">
      <Link className="home-brand" href="/" aria-label="Trang chủ EngTOEIC">
        <span className="home-brand-mark" aria-hidden="true">
          <Image
            className="home-brand-logo"
            src="/images/engtoeic-lion-logo-transparent.png"
            alt=""
            width={40}
            height={40}
            priority
          />
        </span>
        <span>EngTOEIC</span>
      </Link>

      <nav className="home-header-actions" aria-label="Chức năng nhanh">
        {headerActions.map((action) => (
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
        <ThemeCustomizer />
        {user ? (
          <UserMenu
            displayName={displayName ?? "Người học"}
            email={user.email}
          />
        ) : (
          <Link className="home-auth-control" href="/login">
            <LogIn size={17} aria-hidden="true" />
            <span className="home-auth-label">Đăng nhập</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
