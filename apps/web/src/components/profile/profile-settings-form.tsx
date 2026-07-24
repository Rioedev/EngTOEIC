"use client";

import Image from "next/image";
import {
  Accessibility,
  CalendarDays,
  Camera,
  Check,
  Gauge,
  Languages,
  Save,
  Target,
  Trash2,
  UserRound,
  Volume2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/profile";
import { updateUserProfile } from "@/lib/profile-client";
import { applyUserPreferences } from "@/lib/user-preferences";
import {
  NumberStepper,
  ThemedDatePicker,
  ThemedSelect,
} from "@/components/profile/profile-form-controls";

type ProfileSettingsFormProps = {
  initialProfile: UserProfile;
};

type ToggleFieldProps = {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
};

function ToggleField({
  checked,
  description,
  label,
  onChange,
}: ToggleFieldProps) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/9 bg-white/5 px-4 py-3 transition hover:bg-white/8">
      <span>
        <strong className="block text-sm font-semibold text-white/86">
          {label}
        </strong>
        <span className="mt-1 block text-xs leading-5 text-white/48">
          {description}
        </span>
      </span>
      <input
        className="peer sr-only"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="relative h-7 w-12 flex-none rounded-full bg-white/14 transition peer-checked:bg-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-white">
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

function readAvatarFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP."));
      return;
    }
    if (file.size > 768 * 1024) {
      reject(new Error("Ảnh đại diện cần nhỏ hơn 768 KB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Không thể đọc ảnh đã chọn."));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."));
    reader.readAsDataURL(file);
  });
}

export function ProfileSettingsForm({
  initialProfile,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const initial =
    profile.displayName?.charAt(0).toLocaleUpperCase() ??
    profile.email.charAt(0).toLocaleUpperCase() ??
    "U";

  async function selectAvatar(file: File | undefined) {
    if (!file) return;
    try {
      const avatarUrl = await readAvatarFile(file);
      setProfile((current) => ({ ...current, avatarUrl }));
      setMessage("Ảnh mới đã sẵn sàng. Nhấn Lưu thay đổi để cập nhật.");
      setSaveState("idle");
    } catch (error) {
      setSaveState("error");
      setMessage(
        error instanceof Error ? error.message : "Không thể sử dụng ảnh này.",
      );
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setMessage("Đang lưu hồ sơ và cài đặt…");

    try {
      const savedProfile = await updateUserProfile({
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        targetScore: profile.targetScore,
        examDate: profile.examDate ? profile.examDate.slice(0, 10) : null,
        dailyStudyMinutes: profile.dailyStudyMinutes,
        language: profile.language,
        audioAutoplay: profile.audioAutoplay,
        audioVolume: profile.audioVolume,
        audioPlaybackRate: profile.audioPlaybackRate,
        reduceMotion: profile.reduceMotion,
        highContrast: profile.highContrast,
        largeText: profile.largeText,
      });
      setProfile(savedProfile);
      applyUserPreferences(savedProfile);
      setSaveState("saved");
      setMessage("Đã lưu hồ sơ và áp dụng cài đặt trên toàn ứng dụng.");
      router.refresh();
    } catch (error) {
      setSaveState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Chưa thể lưu hồ sơ. Vui lòng thử lại.",
      );
    }
  }

  return (
    <form className="space-y-6" onSubmit={saveProfile}>
      <section
        className="glass-card p-6 sm:p-8"
        aria-labelledby="personal-profile-title"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="personal-profile-title" className="text-xl font-bold">
              Hồ sơ cá nhân
            </h2>
          </div>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="relative mx-auto sm:mx-0">
            <span className="grid size-28 place-items-center overflow-hidden rounded-full border border-white/14 bg-[var(--accent)] text-3xl font-semibold text-[var(--accent-ink)] shadow-xl shadow-black/20">
              {profile.avatarUrl ? (
                <Image
                  className="size-full object-cover"
                  src={profile.avatarUrl}
                  alt={`Ảnh đại diện của ${profile.displayName ?? profile.email}`}
                  width={112}
                  height={112}
                  unoptimized
                />
              ) : (
                initial
              )}
            </span>
            <label
              className="absolute -bottom-1 -right-1 grid size-10 cursor-pointer place-items-center rounded-full border border-white/16 bg-[#172021] text-white shadow-lg transition hover:bg-[#253031] focus-within:ring-2 focus-within:ring-[var(--accent)]"
              title="Chọn ảnh đại diện"
            >
              <Camera className="size-4" aria-hidden="true" />
              <span className="sr-only">Chọn ảnh đại diện</span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  void selectAvatar(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="grid gap-4">
            <div>
              <label
                className="text-sm font-semibold text-white/80"
                htmlFor="display-name"
              >
                Tên hiển thị
              </label>
              <input
                id="display-name"
                className="mt-2 min-h-12 w-full rounded-2xl border border-white/11 bg-black/18 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                value={profile.displayName ?? ""}
                minLength={2}
                maxLength={80}
                required
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-white/80">Email</span>
              <p className="mt-2 min-h-12 rounded-2xl border border-white/7 bg-white/4 px-4 py-3 text-sm text-white/52">
                {profile.email}
              </p>
            </div>
            {profile.avatarUrl ? (
              <button
                type="button"
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-rose-300/10 px-4 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                onClick={() =>
                  setProfile((current) => ({ ...current, avatarUrl: null }))
                }
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Gỡ ảnh đại diện
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="glass-card relative z-30 !overflow-visible p-6 sm:p-8"
        aria-labelledby="study-goals-title"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Target className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="study-goals-title" className="text-xl font-bold">
              Mục tiêu học tập
            </h2>
          </div>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <div>
            <label
              className="flex items-center gap-2 text-sm font-semibold text-white/80"
              htmlFor="target-score"
            >
              <Gauge
                className="size-4 text-[var(--accent)]"
                aria-hidden="true"
              />
              Mục tiêu TOEIC
            </label>
            <NumberStepper
              id="target-score"
              min={10}
              max={990}
              step={5}
              value={profile.targetScore}
              placeholder="Ví dụ: 750"
              ariaLabel="Mục tiêu TOEIC"
              onChange={(targetScore) =>
                setProfile((current) => ({
                  ...current,
                  targetScore,
                }))
              }
            />
            <p className="mt-2 text-xs leading-5 text-white/42">
              Điểm từ 10 đến 990.
            </p>
          </div>

          <div>
            <label
              className="flex items-center gap-2 text-sm font-semibold text-white/80"
              htmlFor="exam-date"
            >
              <CalendarDays
                className="size-4 text-[var(--accent)]"
                aria-hidden="true"
              />
              Ngày thi dự kiến
            </label>
            <ThemedDatePicker
              id="exam-date"
              value={profile.examDate?.slice(0, 10) ?? ""}
              onChange={(examDate) =>
                setProfile((current) => ({
                  ...current,
                  examDate,
                }))
              }
            />
            <p className="mt-2 text-xs leading-5 text-white/42">
              Dùng để tính lộ trình học còn lại.
            </p>
          </div>

          <div>
            <label
              className="text-sm font-semibold text-white/80"
              htmlFor="daily-minutes"
            >
              Phút học mỗi ngày
            </label>
            <NumberStepper
              id="daily-minutes"
              min={5}
              max={480}
              step={5}
              required
              value={profile.dailyStudyMinutes}
              ariaLabel="Phút học mỗi ngày"
              onChange={(dailyStudyMinutes) =>
                setProfile((current) => ({
                  ...current,
                  dailyStudyMinutes: dailyStudyMinutes ?? 5,
                }))
              }
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[15, 30, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`min-h-8 rounded-full px-3 text-[0.7rem] transition ${
                    profile.dailyStudyMinutes === minutes
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-white/6 text-white/48 hover:bg-white/10"
                  }`}
                  onClick={() =>
                    setProfile((current) => ({
                      ...current,
                      dailyStudyMinutes: minutes,
                    }))
                  }
                >
                  {minutes} phút
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="glass-card relative z-10 !overflow-visible p-6 sm:p-8"
        aria-labelledby="preference-settings-title"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Accessibility className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="preference-settings-title" className="text-xl font-bold">
              Ngôn ngữ, audio & accessibility
            </h2>
          </div>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <fieldset className="rounded-2xl border border-white/9 bg-black/10 p-5">
            <legend className="px-2 text-sm font-semibold text-white/82">
              <Languages
                className="mr-2 inline size-4 text-[var(--accent)]"
                aria-hidden="true"
              />
              Ngôn ngữ
            </legend>
            <label
              className="mt-2 block text-xs text-white/48"
              htmlFor="language"
            >
              Ngôn ngữ giao diện ưu tiên
            </label>
            <ThemedSelect
              id="language"
              value={profile.language}
              ariaLabel="Ngôn ngữ giao diện ưu tiên"
              options={[
                { value: "vi", label: "Tiếng Việt" },
                { value: "en", label: "English" },
              ]}
              onChange={(language) =>
                setProfile((current) => ({
                  ...current,
                  language: language as "vi" | "en",
                }))
              }
            />
            <p className="mt-3 text-xs leading-5 text-white/42">
              Lựa chọn được đồng bộ giữa các thiết bị và đặt thuộc tính ngôn ngữ
              cho trình đọc màn hình.
            </p>
          </fieldset>

          <fieldset className="rounded-2xl border border-white/9 bg-black/10 p-5">
            <legend className="px-2 text-sm font-semibold text-white/82">
              <Volume2
                className="mr-2 inline size-4 text-[var(--accent)]"
                aria-hidden="true"
              />
              Audio
            </legend>
            <ToggleField
              checked={profile.audioAutoplay}
              label="Tự động phát"
              description="Tự phát âm khi chuyển sang thẻ hoặc câu nghe mới."
              onChange={(audioAutoplay) =>
                setProfile((current) => ({ ...current, audioAutoplay }))
              }
            />
            <label
              className="mt-4 flex items-center justify-between text-xs text-white/58"
              htmlFor="audio-volume"
            >
              Âm lượng
              <span>{profile.audioVolume}%</span>
            </label>
            <input
              id="audio-volume"
              className="mt-2 w-full accent-[var(--accent)]"
              type="range"
              min={0}
              max={100}
              step={5}
              value={profile.audioVolume}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  audioVolume: Number(event.target.value),
                }))
              }
            />
            <label
              className="mt-4 block text-xs text-white/58"
              htmlFor="playback-rate"
            >
              Tốc độ phát
            </label>
            <ThemedSelect
              id="playback-rate"
              compact
              value={String(profile.audioPlaybackRate)}
              ariaLabel="Tốc độ phát"
              options={[
                { value: "0.75", label: "0.75× — Chậm" },
                { value: "1", label: "1× — Bình thường" },
                { value: "1.25", label: "1.25× — Nhanh" },
              ]}
              onChange={(audioPlaybackRate) =>
                setProfile((current) => ({
                  ...current,
                  audioPlaybackRate: Number(audioPlaybackRate) as
                    0.75 | 1 | 1.25,
                }))
              }
            />
          </fieldset>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-white/82">
            Hỗ trợ hiển thị
          </legend>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <ToggleField
              checked={profile.reduceMotion}
              label="Giảm chuyển động"
              description="Tắt video nền và giảm animation."
              onChange={(reduceMotion) =>
                setProfile((current) => ({ ...current, reduceMotion }))
              }
            />
            <ToggleField
              checked={profile.highContrast}
              label="Tương phản cao"
              description="Tăng độ rõ của chữ, viền và mặt kính."
              onChange={(highContrast) =>
                setProfile((current) => ({ ...current, highContrast }))
              }
            />
            <ToggleField
              checked={profile.largeText}
              label="Chữ lớn"
              description="Tăng kích thước chữ cơ sở trên toàn trang."
              onChange={(largeText) =>
                setProfile((current) => ({ ...current, largeText }))
              }
            />
          </div>
        </fieldset>
      </section>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-white/12 bg-[#11191a]/88 p-3 shadow-2xl backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`min-h-5 px-2 text-xs ${
            saveState === "error"
              ? "text-rose-200"
              : saveState === "saved"
                ? "text-emerald-200"
                : "text-white/52"
          }`}
          role="status"
          aria-live="polite"
        >
          {message || "Thay đổi chỉ được áp dụng sau khi bạn lưu."}
        </p>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] shadow-lg shadow-[var(--accent-glow)] transition hover:bg-[var(--accent-hover)] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ color: "var(--accent-ink)" }}
          disabled={saveState === "saving"}
        >
          {saveState === "saved" ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {saveState === "saving" ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
