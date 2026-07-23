"use client";

import { Check, Palette, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const THEME_STORAGE_KEY = "engtoeic-theme";
const GLASS_STORAGE_KEY = "engtoeic-glass";

const themes = [
  { id: "mint", label: "Bạc hà", color: "#91dedf" },
  { id: "lime", label: "Chanh", color: "#b8df73" },
  { id: "violet", label: "Tím", color: "#c58be4" },
  { id: "sky", label: "Trời", color: "#69c9f0" },
  { id: "coral", label: "San hô", color: "#ff7d75" },
  { id: "amber", label: "Hổ phách", color: "#f5a54b" },
  { id: "rose", label: "Hồng", color: "#e9a3aa" },
  { id: "slate", label: "Khói", color: "#7d91a3" },
] as const;

const glassLevels = [
  { id: "clear", label: "Trong" },
  { id: "frosted", label: "Nhám" },
  { id: "soft", label: "Êm" },
] as const;

type ThemeId = (typeof themes)[number]["id"];
type GlassId = (typeof glassLevels)[number]["id"];

function isThemeId(value: string | null): value is ThemeId {
  return themes.some((item) => item.id === value);
}

function isGlassId(value: string | null): value is GlassId {
  return glassLevels.some((item) => item.id === value);
}

export function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("mint");
  const [glass, setGlass] = useState<GlassId>("frosted");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPreferences = () => {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const savedGlass = localStorage.getItem(GLASS_STORAGE_KEY);

      if (isThemeId(savedTheme)) {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      }

      if (isGlassId(savedGlass)) {
        setGlass(savedGlass);
        document.documentElement.dataset.glass = savedGlass;
      }
    };

    syncPreferences();
    window.addEventListener("storage", syncPreferences);
    return () => window.removeEventListener("storage", syncPreferences);
  }, []);

  const selectTheme = (value: ThemeId) => {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    localStorage.setItem(THEME_STORAGE_KEY, value);
  };

  const selectGlass = (value: GlassId) => {
    setGlass(value);
    document.documentElement.dataset.glass = value;
    localStorage.setItem(GLASS_STORAGE_KEY, value);
  };

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="theme-customizer" ref={panelRef}>
      <button
        className="glass-icon theme-trigger"
        type="button"
        title="Tùy chỉnh giao diện"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Palette size={19} strokeWidth={2} aria-hidden="true" />
        <span className="sr-only">Tùy chỉnh giao diện</span>
      </button>

      {open && (
        <div
          className="theme-panel glass-panel"
          role="dialog"
          aria-label="Tùy chỉnh giao diện"
        >
          <div className="theme-panel-header">
            <div>
              <span className="theme-panel-kicker">Không gian học</span>
              <h2>Tùy chỉnh giao diện</h2>
            </div>
            <button
              className="theme-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <fieldset className="theme-fieldset">
            <legend>Màu chủ đề</legend>
            <div className="theme-swatches">
              {themes.map((item) => (
                <button
                  className="theme-swatch"
                  data-active={theme === item.id}
                  key={item.id}
                  type="button"
                  style={{ "--swatch": item.color } as CSSProperties}
                  title={item.label}
                  aria-label={`Chủ đề ${item.label}`}
                  aria-pressed={theme === item.id}
                  onClick={() => selectTheme(item.id)}
                >
                  {theme === item.id && (
                    <Check size={15} strokeWidth={3} aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="theme-fieldset">
            <legend>Chất liệu kính</legend>
            <div className="glass-options">
              {glassLevels.map((item) => (
                <button
                  className="glass-option"
                  data-active={glass === item.id}
                  key={item.id}
                  type="button"
                  aria-pressed={glass === item.id}
                  onClick={() => selectGlass(item.id)}
                >
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="theme-hint">
            Lựa chọn được lưu tự động trên thiết bị này.
          </p>
        </div>
      )}
    </div>
  );
}
