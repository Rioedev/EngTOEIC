import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile";
import { PreferenceHydrator } from "@/components/profile/preference-hydrator";
import { headerActions } from "./home-data";
import { ThemeCustomizer } from "./theme-customizer";
import { UserMenu } from "./user-menu";

export async function Header() {
  let user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
      name?: string;
    };
  } | null = null;
  let profile = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user = verifiedUser;
    if (verifiedUser && session) {
      profile = await getUserProfile(session.access_token);
    }
  }

  const displayName =
    profile?.displayName ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email;

  return (
    <header className="home-header">
      <PreferenceHydrator profile={profile} />
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
            avatarUrl={
              profile?.avatarUrl ?? user.user_metadata?.avatar_url ?? null
            }
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
