"use client";

import type { UserProfile } from "@/lib/profile";

export const preferenceStorageKeys = {
  language: "engtoeic-language",
  audioAutoplay: "engtoeic-audio-autoplay",
  audioVolume: "engtoeic-audio-volume",
  audioPlaybackRate: "engtoeic-audio-playback-rate",
  reduceMotion: "engtoeic-reduce-motion",
  highContrast: "engtoeic-high-contrast",
  largeText: "engtoeic-large-text",
} as const;

export type UserPreferenceValues = Pick<
  UserProfile,
  | "language"
  | "audioAutoplay"
  | "audioVolume"
  | "audioPlaybackRate"
  | "reduceMotion"
  | "highContrast"
  | "largeText"
>;

export function applyUserPreferences(preferences: UserPreferenceValues) {
  const root = document.documentElement;
  root.lang = preferences.language;
  root.dataset.language = preferences.language;
  root.dataset.reduceMotion = String(preferences.reduceMotion);
  root.dataset.highContrast = String(preferences.highContrast);
  root.dataset.largeText = String(preferences.largeText);

  localStorage.setItem(preferenceStorageKeys.language, preferences.language);
  localStorage.setItem(
    preferenceStorageKeys.audioAutoplay,
    String(preferences.audioAutoplay),
  );
  localStorage.setItem(
    preferenceStorageKeys.audioVolume,
    String(preferences.audioVolume),
  );
  localStorage.setItem(
    preferenceStorageKeys.audioPlaybackRate,
    String(preferences.audioPlaybackRate),
  );
  localStorage.setItem(
    preferenceStorageKeys.reduceMotion,
    String(preferences.reduceMotion),
  );
  localStorage.setItem(
    preferenceStorageKeys.highContrast,
    String(preferences.highContrast),
  );
  localStorage.setItem(
    preferenceStorageKeys.largeText,
    String(preferences.largeText),
  );
  window.dispatchEvent(new CustomEvent("engtoeic-preferences"));
}

export function getAudioPreferences() {
  const volume = Number(
    localStorage.getItem(preferenceStorageKeys.audioVolume) ?? "100",
  );
  const playbackRate = Number(
    localStorage.getItem(preferenceStorageKeys.audioPlaybackRate) ?? "1",
  );

  return {
    autoplay:
      localStorage.getItem(preferenceStorageKeys.audioAutoplay) !== "false",
    volume: Number.isFinite(volume)
      ? Math.min(1, Math.max(0, volume / 100))
      : 1,
    playbackRate: [0.75, 1, 1.25].includes(playbackRate) ? playbackRate : 1,
  };
}

export async function playVocabularyAudio(audioUrl: string) {
  const audio = new Audio(audioUrl);
  const preferences = getAudioPreferences();
  audio.volume = preferences.volume;
  audio.playbackRate = preferences.playbackRate;
  await audio.play();
}
