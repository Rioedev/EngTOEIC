"use client";

import { Check, Copy, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { copyPublicVocabularySet } from "@/lib/vocabulary-management-client";

type CopyVocabularyButtonProps = {
  slug: string;
  title: string;
  isAuthenticated: boolean;
};

export function CopyVocabularyButton({
  slug,
  title,
  isAuthenticated,
}: CopyVocabularyButtonProps) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );

  async function copySet() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent("/vocabulary")}`;
      return;
    }

    setState("copying");
    try {
      await copyPublicVocabularySet(slug);
      setState("copied");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      className="grid size-11 place-items-center rounded-full bg-white/7 text-white/55 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-wait"
      aria-label={
        state === "copied"
          ? `Đã sao chép ${title}`
          : state === "error"
            ? `Sao chép ${title} thất bại, nhấn để thử lại`
            : `Sao chép ${title} vào thư viện cá nhân`
      }
      title={
        state === "copied"
          ? "Đã sao chép vào Bộ từ của tôi"
          : state === "error"
            ? "Chưa thể sao chép, nhấn để thử lại"
            : "Sao chép vào Bộ từ của tôi"
      }
      disabled={state === "copying" || state === "copied"}
      onClick={() => void copySet()}
    >
      {state === "copying" ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : state === "copied" ? (
        <Check className="size-4 text-emerald-200" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
