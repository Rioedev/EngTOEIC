import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";

export default function VocabularyNotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#0d1517] px-4 text-center text-white">
      <div className="glass-card max-w-md p-8 sm:p-10">
        <BookX
          className="mx-auto size-12 text-[var(--accent)]"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-3xl font-black tracking-[-0.018em]">
          Không tìm thấy bộ từ
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          Bộ từ có thể chưa được xuất bản hoặc đường dẫn không còn tồn tại.
        </p>
        <Link
          href="/vocabulary"
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)]"
          style={{ color: "var(--accent-ink)" }}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về thư viện
        </Link>
      </div>
    </main>
  );
}
