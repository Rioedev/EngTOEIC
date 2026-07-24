"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const controlClass =
  "min-h-12 w-full rounded-2xl border border-white/11 bg-black/18 text-sm text-white outline-none transition hover:border-white/20 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-glow)]";

type NumberStepperProps = {
  id: string;
  value: number | null;
  min: number;
  max: number;
  step: number;
  placeholder?: string;
  required?: boolean;
  ariaLabel: string;
  onChange: (value: number | null) => void;
};

export function NumberStepper({
  id,
  value,
  min,
  max,
  step,
  placeholder,
  required,
  ariaLabel,
  onChange,
}: NumberStepperProps) {
  function updateBy(delta: number) {
    const fallback = delta > 0 ? min : max;
    const current = value ?? fallback - delta;
    onChange(Math.min(max, Math.max(min, current + delta)));
  }

  function updateFromText(text: string) {
    if (!text.trim()) {
      onChange(null);
      return;
    }

    const next = Number(text.replace(/\D/g, ""));
    if (Number.isFinite(next)) onChange(next);
  }

  function normalizeValue() {
    if (value === null) return;
    onChange(Math.min(max, Math.max(min, Math.round(value / step) * step)));
  }

  return (
    <div className={`${controlClass} mt-2 flex items-center p-1`}>
      <input
        id={id}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? undefined}
        required={required}
        value={value ?? ""}
        placeholder={placeholder}
        onBlur={normalizeValue}
        onChange={(event) => updateFromText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            updateBy(step);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            updateBy(-step);
          }
        }}
      />
      <span className="flex items-center gap-1 border-l border-white/10 pl-1">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl text-white/56 transition hover:bg-white/9 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Giảm ${ariaLabel.toLocaleLowerCase()}`}
          disabled={value !== null && value <= min}
          onClick={() => updateBy(-step)}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl text-white/56 transition hover:bg-white/9 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-25"
          aria-label={`Tăng ${ariaLabel.toLocaleLowerCase()}`}
          disabled={value !== null && value >= max}
          onClick={() => updateBy(step)}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type ThemedSelectProps = {
  id: string;
  value: string;
  options: SelectOption[];
  ariaLabel: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

export function ThemedSelect({
  id,
  value,
  options,
  ariaLabel,
  onChange,
  compact = false,
}: ThemedSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function openAndFocus(index = selectedIndex) {
    setOpen(true);
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function moveFocus(index: number, direction: number) {
    const next = (index + direction + options.length) % options.length;
    optionRefs.current[next]?.focus();
  }

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        id={id}
        type="button"
        className={`${controlClass} flex items-center justify-between gap-3 px-4 text-left ${
          compact ? "min-h-11 rounded-xl" : ""
        }`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openAndFocus())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openAndFocus(
              event.key === "ArrowDown"
                ? selectedIndex
                : Math.max(0, selectedIndex - 1),
            );
          }
        }}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown
          className={`size-4 text-white/45 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-white/14 bg-[#11191a]/97 p-1.5 shadow-2xl shadow-black/45 backdrop-blur-2xl"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] ${
                  selected
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-white/72 hover:bg-white/7 hover:text-white"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  document.getElementById(id)?.focus();
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveFocus(index, 1);
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveFocus(index, -1);
                  }
                  if (event.key === "Escape" || event.key === "Tab") {
                    setOpen(false);
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    optionRefs.current[0]?.focus();
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    optionRefs.current[options.length - 1]?.focus();
                  }
                }}
              >
                <span>{option.label}</span>
                {selected ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type DatePickerProps = {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

const monthNames = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const weekdayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string | null) {
  const date = parseDate(value);
  if (!date) return "Chọn ngày thi";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function sameDay(first: Date | null, second: Date | null) {
  return Boolean(
    first &&
    second &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate(),
  );
}

export function ThemedDatePicker({ id, value, onChange }: DatePickerProps) {
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => selectedDate ?? new Date(),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  function moveMonth(delta: number) {
    setVisibleMonth(new Date(year, month + delta, 1));
  }

  function selectDate(date: Date) {
    onChange(formatDateValue(date));
    setVisibleMonth(date);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        id={id}
        type="button"
        className={`${controlClass} flex items-center justify-between gap-3 px-4 text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          setVisibleMonth(selectedDate ?? new Date());
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <span className={selectedDate ? "text-white" : "text-white/34"}>
          {formatDateLabel(value)}
        </span>
        <CalendarDays
          className="size-4 text-[var(--accent)]"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-label="Chọn ngày thi dự kiến"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-3rem))] rounded-3xl border border-white/14 bg-[#11191a]/97 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              document.getElementById(id)?.focus();
            }
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {monthNames[month]} <span className="text-white/45">{year}</span>
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Tháng trước"
                onClick={() => moveMonth(-1)}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Tháng sau"
                onClick={() => moveMonth(1)}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1" aria-hidden="true">
            {weekdayNames.map((weekday) => (
              <span
                key={weekday}
                className="grid h-8 place-items-center text-[0.68rem] font-semibold text-white/34"
              >
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, index) => (
              <span
                key={`blank-${index}`}
                className="size-9"
                aria-hidden="true"
              />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = new Date(year, month, index + 1);
              const selected = sameDay(date, selectedDate);
              const isToday = sameDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  aria-label={new Intl.DateTimeFormat("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(date)}
                  aria-pressed={selected}
                  className={`grid size-9 place-items-center rounded-xl text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    selected
                      ? "bg-[var(--accent)] font-semibold text-[var(--accent-ink)]"
                      : isToday
                        ? "border border-[var(--accent)]/55 text-[var(--accent)]"
                        : "text-white/68 hover:bg-white/8 hover:text-white"
                  }`}
                  onClick={() => selectDate(date)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/9 pt-3">
            <button
              type="button"
              className="min-h-9 rounded-xl px-3 text-xs text-white/48 transition hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Xoá ngày
            </button>
            <button
              type="button"
              className="min-h-9 rounded-xl bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent)] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => selectDate(today)}
            >
              Hôm nay
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
