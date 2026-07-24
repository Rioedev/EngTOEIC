import { ArrowRight, Clock3 } from "lucide-react";

export function HeroLesson() {
  return (
    <section className="home-hero">
      <div className="home-hero-inner">
        <div className="hero-meta">
          <p className="hero-eyebrow">Bài học dành riêng cho bạn</p>
          <div className="hero-duration glass-pill">
            <Clock3 size={15} aria-hidden="true" />5 phút
          </div>
        </div>
        <h1 className="home-hero-title">
          Chào mừng trở lại — cùng khởi động nhanh nhé!
        </h1>

        <a className="cta-button" href="#quick-practice">
          Bắt đầu bài học
          <ArrowRight size={20} strokeWidth={2.4} aria-hidden="true" />
        </a>

        <p className="home-hero-copy">
          Từ vựng · Đọc · Nghe
          <span>Dựa trên những gì bạn đã học hôm qua</span>
        </p>
      </div>
    </section>
  );
}
