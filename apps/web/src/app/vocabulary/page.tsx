import type { Metadata } from "next";
import Link from "next/link";
import {
  BrainCircuit,
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  CalendarClock,
  Clock3,
  Layers3,
  Search,
  Sparkles,
} from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  getVocabularyReviewSchedule,
  getVocabularySets,
  type VocabularyReviewScheduleResponse,
} from "@/lib/vocabulary";

export const metadata: Metadata = {
  title: "Thư viện từ vựng | EngTOEIC",
  description: "Học từ vựng TOEIC theo chủ đề với bộ thẻ ngắn gọn, dễ ôn tập.",
};

type VocabularyPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    part?: string | string[];
  }>;
};

const partFilters = [
  { value: "", label: "Tất cả" },
  { value: "PART_1", label: "Part 1" },
  { value: "PART_2", label: "Part 2" },
  { value: "PART_3", label: "Part 3" },
  { value: "PART_4", label: "Part 4" },
  { value: "PART_5", label: "Part 5" },
  { value: "PART_6", label: "Part 6" },
  { value: "PART_7", label: "Part 7" },
];

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function partLabel(part: string | null) {
  return part?.replace("PART_", "Part ") ?? "Nhiều Part";
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function VocabularyPage({
  searchParams,
}: VocabularyPageProps) {
  const params = await searchParams;
  const search = firstValue(params.search).trim();
  const requestedPart = firstValue(params.part);
  const part = partFilters.some((filter) => filter.value === requestedPart)
    ? requestedPart
    : "";
  const { response, source } = await getVocabularySets({ search, part });
  let reviewSchedule: VocabularyReviewScheduleResponse | null = null;

  if (source === "api" && isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      reviewSchedule = await getVocabularyReviewSchedule(session.access_token);
    }
  }

  const firstReviewItem = reviewSchedule?.items[0] ?? null;

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#101617] pb-32 text-white">
      <a
        href="#vocabulary-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Đi tới nội dung chính
      </a>
      <TimeAwareBackground />
      <div
        className="vocabulary-background-overlay absolute inset-0 z-[1]"
        aria-hidden="true"
      />

      <LearningFrame />

      <div
        id="vocabulary-content"
        className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8"
      >
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--accent)_78%,white)] backdrop-blur-xl">
            <Sparkles className="size-4" aria-hidden="true" />
            Vocabulary library
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-[-0.022em] text-balance sm:text-5xl lg:text-6xl">
            Mỗi ngày một bộ từ,
            <span className="block text-[var(--accent)]">
              tiến bộ thật đều.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            Học từ theo ngữ cảnh TOEIC, xem ví dụ thực tế và chuẩn bị cho chế độ
            flashcard ở bước tiếp theo.
          </p>
        </section>

        {reviewSchedule ? (
          <section
            className="glass-card mx-auto mt-10 max-w-4xl overflow-hidden p-5 sm:p-6"
            aria-labelledby="review-schedule-title"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <CalendarClock className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
                    Lịch ôn cá nhân
                  </p>
                  <h2
                    id="review-schedule-title"
                    className="mt-1 text-xl font-bold tracking-[-0.012em] sm:text-2xl"
                  >
                    {reviewSchedule.summary.dueNow > 0
                      ? `${reviewSchedule.summary.dueNow} từ đang đến hạn`
                      : reviewSchedule.summary.scheduled > 0
                        ? "Bạn đang học đúng lịch"
                        : "Chưa có từ nào được lên lịch"}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
                    {reviewSchedule.summary.dueNow > 0
                      ? "Mở bộ từ ưu tiên để củng cố những từ cần được nhắc lại ngay."
                      : reviewSchedule.summary.scheduled > 0 &&
                          reviewSchedule.summary.nextReviewAt
                        ? `Lượt ôn gần nhất vào ${formatReviewDate(reviewSchedule.summary.nextReviewAt)}.`
                        : "Hoàn thành một câu trong Learn hoặc Flashcard để EngTOEIC tạo lịch riêng cho từng từ."}
                  </p>
                </div>
              </div>

              {firstReviewItem ? (
                <Link
                  href={
                    reviewSchedule.summary.dueNow > 0
                      ? "/vocabulary/review"
                      : `/vocabulary/${firstReviewItem.setSlug}/learn`
                  }
                  className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101617]"
                  style={{ color: "var(--accent-ink)" }}
                >
                  {reviewSchedule.summary.dueNow > 0 ? "Ôn ngay" : "Mở bộ từ"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            <dl
              className="mt-5 grid grid-cols-2 gap-2 border-t border-white/8 pt-5 sm:grid-cols-3"
              aria-label="Thống kê ghi nhớ"
            >
              <div className="col-span-2 rounded-2xl bg-white/6 p-4 sm:col-span-1">
                <dt className="flex items-center gap-2 text-xs text-white/52">
                  <BrainCircuit
                    className="size-4 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  Retention ước tính
                </dt>
                <dd className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                  {reviewSchedule.summary.retentionRate === null
                    ? "—"
                    : `${reviewSchedule.summary.retentionRate}%`}
                </dd>
                <p className="mt-1 text-xs leading-5 text-white/42">
                  {reviewSchedule.summary.totalReviews > 0
                    ? `${reviewSchedule.summary.totalReviews} lượt ôn · ${reviewSchedule.summary.totalLapses} lần quên`
                    : "Chưa đủ lượt ôn để tính"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/6 p-4">
                <dt className="flex items-center gap-2 text-xs text-white/52">
                  <Clock3
                    className="size-4 text-amber-200"
                    aria-hidden="true"
                  />
                  Đến hạn
                </dt>
                <dd className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                  {reviewSchedule.summary.dueNow}
                </dd>
                <p className="mt-1 text-xs leading-5 text-white/42">
                  từ cần ôn ngay
                </p>
              </div>

              <div className="rounded-2xl bg-white/6 p-4">
                <dt className="flex items-center gap-2 text-xs text-white/52">
                  <CalendarDays
                    className="size-4 text-sky-200"
                    aria-hidden="true"
                  />
                  7 ngày tới
                </dt>
                <dd className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
                  {reviewSchedule.summary.dueNext7Days}
                </dd>
                <p className="mt-1 text-xs leading-5 text-white/42">
                  từ sắp đến lịch
                </p>
              </div>
            </dl>

            {reviewSchedule.items.length ? (
              <ul
                className="mt-5 grid gap-2 sm:grid-cols-2"
                aria-label="Các từ trong lịch ôn gần nhất"
              >
                {reviewSchedule.items.map((item) => {
                  const due =
                    new Date(item.nextReviewAt).getTime() <= Date.now();

                  return (
                    <li
                      key={item.termId}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-white/6 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white/88">
                          {item.term}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/45">
                          {item.meaningVi}
                        </p>
                      </div>
                      <span
                        className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                          due
                            ? "bg-amber-300/14 text-amber-100"
                            : "bg-white/8 text-white/52"
                        }`}
                      >
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {due ? (
                          "Đến hạn"
                        ) : (
                          <time dateTime={item.nextReviewAt}>
                            {formatReviewDate(item.nextReviewAt)}
                          </time>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section
          className="glass-card mx-auto mt-10 max-w-4xl p-3 sm:p-4"
          aria-label="Tìm kiếm và lọc bộ từ"
        >
          <form
            className="flex flex-col gap-3 sm:flex-row"
            action="/vocabulary"
          >
            <label className="relative flex-1" htmlFor="vocabulary-search">
              <span className="sr-only">Tìm bộ từ theo tên hoặc chủ đề</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/45"
                aria-hidden="true"
              />
              <input
                id="vocabulary-search"
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Tìm theo tên hoặc chủ đề..."
                className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-white/38 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
              />
            </label>
            {part ? <input type="hidden" name="part" value={part} /> : null}
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] motion-reduce:transform-none"
              style={{ color: "var(--accent-ink)" }}
            >
              Tìm bộ từ
            </button>
          </form>

          <div
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
            aria-label="Lọc theo Part"
          >
            {partFilters.map((filter) => {
              const query = new URLSearchParams();
              if (search) query.set("search", search);
              if (filter.value) query.set("part", filter.value);
              const href = query.size
                ? `/vocabulary?${query.toString()}`
                : "/vocabulary";
              const active = filter.value === part;

              return (
                <Link
                  key={filter.label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  style={active ? { color: "#132024" } : undefined}
                  className={`flex min-h-10 flex-none items-center rounded-full px-4 text-xs font-extrabold transition ${
                    active
                      ? "bg-white text-[#132024]"
                      : "bg-white/7 text-white/64 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="library-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
                Thư viện của bạn
              </p>
              <h2
                id="library-title"
                className="mt-2 text-2xl font-black tracking-[-0.016em] sm:text-3xl"
              >
                Bộ từ đang có
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white/52">
              <Layers3 className="size-4" aria-hidden="true" />
              {response.meta.total} bộ từ
              {source === "demo" ? (
                <span className="rounded-full bg-amber-300/14 px-2.5 py-1 text-amber-100">
                  Dữ liệu demo
                </span>
              ) : null}
            </div>
          </div>

          {response.data.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {response.data.map((set) => (
                <article
                  key={set.id}
                  className="glass-card group flex min-h-72 flex-col p-6 transition duration-200 hover:-translate-y-1 hover:bg-white/12 hover:shadow-2xl hover:shadow-black/25 motion-reduce:transform-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <BriefcaseBusiness
                        className="size-6"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="rounded-full bg-white/8 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-white/60">
                      {partLabel(set.part)}
                    </span>
                  </div>

                  <div className="mt-6 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                      {set.topic ?? "TOEIC Vocabulary"}
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.016em]">
                      {set.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/58">
                      {set.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/9 pt-5">
                    <span className="flex items-center gap-2 text-sm font-bold text-white/60">
                      <BookOpenText className="size-4" aria-hidden="true" />
                      {set.termCount} từ
                    </span>
                    <Link
                      href={`/vocabulary/${set.slug}`}
                      className="flex min-h-11 items-center gap-2 rounded-full bg-white/9 px-4 text-sm font-black text-white transition group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-ink)]"
                      aria-label={`Mở bộ từ ${set.title}`}
                    >
                      Mở bộ từ
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-card mt-6 grid min-h-64 place-items-center p-8 text-center">
              <div>
                <BookOpenText
                  className="mx-auto size-10 text-white/35"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-xl font-black">
                  Chưa tìm thấy bộ từ phù hợp
                </h3>
                <p className="mt-2 text-sm text-white/55">
                  Hãy thử từ khóa khác hoặc bỏ bộ lọc Part hiện tại.
                </p>
                <Link
                  href="/vocabulary"
                  className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-ink)]"
                  style={{ color: "var(--accent-ink)" }}
                >
                  Xem tất cả bộ từ
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
