import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LibraryBig } from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { VocabularyManager } from "@/components/vocabulary/vocabulary-manager";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  getPersonalVocabularyLibrary,
  type PersonalVocabularyLibrary,
} from "@/lib/vocabulary";

export const metadata: Metadata = {
  title: "Bộ từ của tôi | EngTOEIC",
  description:
    "Tạo, chỉnh sửa, phân loại, import, export và chia sẻ bộ từ cá nhân.",
};

const emptyLibrary: PersonalVocabularyLibrary = {
  folders: [],
  sets: [],
};

export default async function VocabularyManagePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/vocabulary/manage");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session) redirect("/login?next=/vocabulary/manage");

  const library =
    (await getPersonalVocabularyLibrary(session.access_token)) ?? emptyLibrary;

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#101617] pb-28 text-white">
      <a
        href="#vocabulary-manager"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Đi tới bộ từ của tôi
      </a>
      <TimeAwareBackground />
      <div
        className="vocabulary-background-overlay fixed inset-0 z-[1]"
        aria-hidden="true"
      />
      <LearningFrame />

      <div
        id="vocabulary-manager"
        className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8"
      >
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/vocabulary"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-sm text-white/68 backdrop-blur-xl transition hover:bg-white/13 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Thư viện từ vựng
            </Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
              Không gian cá nhân
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Quản lý bộ từ
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
              Tự tạo nội dung học, sắp xếp theo thư mục và kiểm soát chính xác
              ai có thể xem từng bộ từ.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-white/48">
            <LibraryBig
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            Đồng bộ theo tài khoản
          </span>
        </header>

        <VocabularyManager initialLibrary={library} />
      </div>
    </main>
  );
}
