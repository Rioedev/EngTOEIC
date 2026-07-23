export default function VocabularyLoading() {
  return (
    <main
      className="min-h-svh bg-[#0d1517] px-4 py-24 text-white sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Đang tải thư viện từ vựng"
    >
      <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none">
        <div className="mx-auto h-12 w-2/3 rounded-2xl bg-white/8" />
        <div className="mx-auto mt-5 h-5 w-1/2 rounded-lg bg-white/6" />
        <div className="mt-12 h-20 rounded-2xl bg-white/7" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl bg-white/7" />
          ))}
        </div>
      </div>
    </main>
  );
}
