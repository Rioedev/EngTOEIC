import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailPasswordAuthForm } from "@/components/auth/email-password-auth-form";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, string> = {
  access_denied: "Bạn đã hủy hoặc chưa cấp quyền đăng nhập Google.",
  callback_failed:
    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
  missing_code: "Google không trả về mã đăng nhập hợp lệ.",
  sync_failed: "Không thể tạo hồ sơ học tập. Hãy kiểm tra API và thử lại.",
};

function safeNextPath(value: string | string[] | undefined) {
  const path = typeof value === "string" ? value : "/";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      redirect(nextPath);
    }
  }

  return (
    <main className="auth-shell">
      <TimeAwareBackground />
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="login-title">
        <Link
          className="auth-brand"
          href="/"
          aria-label="Về trang chủ EngTOEIC"
        >
          <Image
            src="/images/engtoeic-lion-logo-transparent.png"
            alt=""
            width={72}
            height={72}
            priority
          />
          <span>EngTOEIC</span>
        </Link>

        <div className="auth-heading">
          <p className="auth-kicker">Bắt đầu hành trình của bạn</p>
          <h1 id="login-title">Đăng nhập để học tiếp</h1>
          <p>
            Dùng email và mật khẩu để lưu từ vựng, tiến độ luyện tập và kết quả
            TOEIC.
          </p>
        </div>

        {errorCode ? (
          <p className="auth-message auth-message-error" role="alert">
            {errorMessages[errorCode] ??
              "Đăng nhập không thành công. Vui lòng thử lại."}
          </p>
        ) : null}

        {configured ? (
          <EmailPasswordAuthForm nextPath={nextPath} />
        ) : (
          <p className="auth-message auth-message-error" role="alert">
            Supabase Auth chưa được cấu hình trong môi trường chạy web.
          </p>
        )}

        <p className="auth-terms">
          Khi tiếp tục, bạn đồng ý cho EngTOEIC sử dụng thông tin hồ sơ cơ bản
          để tạo tài khoản học tập.
        </p>
      </section>
    </main>
  );
}
