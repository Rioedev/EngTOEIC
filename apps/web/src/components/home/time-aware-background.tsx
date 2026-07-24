"use client";

import { useEffect, useRef } from "react";

export function TimeAwareBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      const userReducedMotion =
        document.documentElement.dataset.reduceMotion === "true";
      if (reducedMotion.matches || userReducedMotion) {
        video.pause();
        return;
      }

      void video.play().catch(() => undefined);
    };

    syncPlayback();
    reducedMotion.addEventListener("change", syncPlayback);
    window.addEventListener("engtoeic-preferences", syncPlayback);

    return () => {
      reducedMotion.removeEventListener("change", syncPlayback);
      window.removeEventListener("engtoeic-preferences", syncPlayback);
    };
  }, []);

  return (
    <div className="time-background cozy-room-background" aria-hidden="true">
      <video
        ref={videoRef}
        className="cozy-room-video"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/engdaily-inspired-bg.png"
        tabIndex={-1}
      >
        <source src="/videos/cozyroom.mp4" type="video/mp4" />
      </video>
      <div className="home-background-overlay" />
      <div className="home-background-vignette" />
    </div>
  );
}
