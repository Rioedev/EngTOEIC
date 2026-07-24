"use client";

import {
  BookCopy,
  Download,
  Folder,
  FolderPlus,
  Globe2,
  Link2,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect } from "react";
import type {
  PersonalVocabularyLibrary,
  VocabularyFolder,
  VocabularySet,
} from "@/lib/vocabulary";
import type { VocabularyDeleteTarget } from "./vocabulary-manager-model";

type VocabularyFolderSidebarProps = {
  library: PersonalVocabularyLibrary;
  activeFolder: string;
  folderName: string;
  busy: boolean;
  onSelectFolder: (folderId: string) => void;
  onFolderNameChange: (name: string) => void;
  onCreateFolder: (event: FormEvent) => void;
  onEditFolder: (folder: VocabularyFolder) => void;
};

export function VocabularyFolderSidebar({
  library,
  activeFolder,
  folderName,
  busy,
  onSelectFolder,
  onFolderNameChange,
  onCreateFolder,
  onEditFolder,
}: VocabularyFolderSidebarProps) {
  const defaultFolders = [
    { id: "all", name: "Tất cả bộ từ", count: library.sets.length },
    {
      id: "none",
      name: "Chưa phân loại",
      count: library.sets.filter((set) => !set.folderId).length,
    },
  ];

  return (
    <aside className="glass-card h-fit p-4 lg:sticky lg:top-28">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold text-white/82">Thư mục</h2>
        <Folder className="size-4 text-[var(--accent)]" aria-hidden="true" />
      </div>

      <nav className="mt-3 space-y-1" aria-label="Lọc theo thư mục">
        {defaultFolders.map((folder) => (
          <FolderFilterButton
            key={folder.id}
            active={activeFolder === folder.id}
            count={folder.count}
            name={folder.name}
            onClick={() => onSelectFolder(folder.id)}
          />
        ))}
        {library.folders.map((folder) => (
          <div key={folder.id} className="group flex items-center gap-1">
            <FolderFilterButton
              active={activeFolder === folder.id}
              count={folder.setCount}
              name={folder.name}
              onClick={() => onSelectFolder(folder.id)}
            />
            <button
              type="button"
              className="grid size-9 flex-none place-items-center rounded-xl text-white/28 opacity-0 transition hover:bg-white/8 hover:text-white group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label={`Tuỳ chọn thư mục ${folder.name}`}
              onClick={() => onEditFolder(folder)}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </nav>

      <form
        className="mt-4 border-t border-white/8 pt-4"
        onSubmit={onCreateFolder}
      >
        <label className="sr-only" htmlFor="new-folder-name">
          Tên thư mục mới
        </label>
        <div className="flex gap-2">
          <input
            id="new-folder-name"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/18 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--accent)]"
            value={folderName}
            maxLength={60}
            placeholder="Thư mục mới"
            onChange={(event) => onFolderNameChange(event.target.value)}
          />
          <button
            type="submit"
            className="grid size-11 flex-none place-items-center rounded-xl bg-white/8 text-white/65 transition hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Tạo thư mục"
            disabled={busy || !folderName.trim()}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </aside>
  );
}

type FolderFilterButtonProps = {
  active: boolean;
  count: number;
  name: string;
  onClick: () => void;
};

function FolderFilterButton({
  active,
  count,
  name,
  onClick,
}: FolderFilterButtonProps) {
  return (
    <button
      type="button"
      className={`flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-xl px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "text-white/58 hover:bg-white/7 hover:text-white"
      }`}
      onClick={onClick}
    >
      <span className="truncate">{name}</span>
      <span className="text-xs opacity-65">{count}</span>
    </button>
  );
}

type VocabularySetCardProps = {
  vocabularySet: VocabularySet;
  onShare: (vocabularySet: VocabularySet) => void;
  onDownload: (vocabularySet: VocabularySet) => void;
  onEdit: (vocabularySet: VocabularySet) => void;
  onDelete: (vocabularySet: VocabularySet) => void;
};

export function VocabularySetCard({
  vocabularySet,
  onShare,
  onDownload,
  onEdit,
  onDelete,
}: VocabularySetCardProps) {
  const visibility =
    vocabularySet.visibility === "PUBLIC"
      ? {
          label: "Công khai",
          icon: Globe2,
          className: "text-emerald-100",
        }
      : vocabularySet.visibility === "UNLISTED"
        ? { label: "Có URL", icon: Link2, className: "text-sky-100" }
        : {
            label: "Riêng tư",
            icon: LockKeyhole,
            className: "text-white/52",
          };
  const VisibilityIcon = visibility.icon;

  return (
    <article className="glass-card flex min-h-60 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <BookCopy className="size-5" aria-hidden="true" />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-white/7 px-2.5 py-1 text-[0.68rem] ${visibility.className}`}
        >
          <VisibilityIcon className="size-3.5" aria-hidden="true" />
          {visibility.label}
        </span>
      </div>
      <div className="mt-5 flex-1">
        <p className="text-xs text-[var(--accent)]">
          {vocabularySet.folder?.name ??
            vocabularySet.topic ??
            "Chưa phân loại"}
        </p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.012em]">
          {vocabularySet.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/48">
          {vocabularySet.description || "Chưa có mô tả cho bộ từ này."}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
        <span className="text-xs text-white/42">
          {vocabularySet.termCount} từ
        </span>
        <div className="flex gap-1">
          <CardAction
            label={`Chia sẻ ${vocabularySet.title}`}
            onClick={() => onShare(vocabularySet)}
          >
            <Link2 className="size-4" aria-hidden="true" />
          </CardAction>
          <CardAction
            label={`Xuất ${vocabularySet.title}`}
            onClick={() => onDownload(vocabularySet)}
          >
            <Download className="size-4" aria-hidden="true" />
          </CardAction>
          <CardAction
            label={`Chỉnh sửa ${vocabularySet.title}`}
            emphasized
            onClick={() => onEdit(vocabularySet)}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </CardAction>
          <CardAction
            label={`Xoá ${vocabularySet.title}`}
            destructive
            onClick={() => onDelete(vocabularySet)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </CardAction>
        </div>
      </div>
    </article>
  );
}

type CardActionProps = {
  children: ReactNode;
  label: string;
  emphasized?: boolean;
  destructive?: boolean;
  onClick: () => void;
};

function CardAction({
  children,
  label,
  emphasized,
  destructive,
  onClick,
}: CardActionProps) {
  const className = destructive
    ? "text-rose-200/58 hover:bg-rose-300/10 hover:text-rose-100 focus-visible:ring-rose-200"
    : emphasized
      ? "bg-white/7 text-white/70 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:ring-[var(--accent)]"
      : "text-white/48 hover:bg-white/8 hover:text-white focus-visible:ring-[var(--accent)]";

  return (
    <button
      type="button"
      className={`grid size-10 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type RenameFolderDialogProps = {
  folder: VocabularyFolder;
  onChange: (folder: VocabularyFolder) => void;
  onCancel: () => void;
  onDelete: (folder: VocabularyFolder) => void;
  onSubmit: (event: FormEvent) => void;
};

export function RenameFolderDialog({
  folder,
  onChange,
  onCancel,
  onDelete,
  onSubmit,
}: RenameFolderDialogProps) {
  useDialogEscape(onCancel);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-folder-title"
    >
      <form
        className="w-full max-w-sm rounded-3xl border border-white/12 bg-[#11191a]/98 p-6 shadow-2xl"
        onSubmit={onSubmit}
      >
        <h2 id="rename-folder-title" className="text-xl font-semibold">
          Chỉnh sửa thư mục
        </h2>
        <label
          className="mt-5 block text-sm text-white/62"
          htmlFor="rename-folder"
        >
          Tên thư mục
        </label>
        <input
          id="rename-folder"
          autoFocus
          className="mt-2 min-h-12 w-full rounded-2xl border border-white/11 bg-black/20 px-4 text-sm outline-none focus:border-[var(--accent)]"
          value={folder.name}
          onChange={(event) =>
            onChange({ ...folder, name: event.target.value })
          }
        />
        <div className="mt-5 flex justify-between gap-2">
          <button
            type="button"
            className="min-h-11 rounded-full px-4 text-sm text-rose-100 hover:bg-rose-300/10"
            onClick={() => onDelete(folder)}
          >
            Xoá thư mục
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 rounded-full bg-white/7 px-4 text-sm text-white/65"
              onClick={onCancel}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)]"
              style={{ color: "var(--accent-ink)" }}
            >
              Lưu
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

type DeleteVocabularyDialogProps = {
  target: VocabularyDeleteTarget;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteVocabularyDialog({
  target,
  busy,
  onCancel,
  onConfirm,
}: DeleteVocabularyDialogProps) {
  useDialogEscape(onCancel);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/12 bg-[#11191a]/98 p-6 text-center shadow-2xl">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-300/10 text-rose-100">
          <Trash2 className="size-5" aria-hidden="true" />
        </span>
        <h2 id="delete-title" className="mt-4 text-xl font-semibold">
          Xoá {target.kind === "set" ? "bộ từ" : "thư mục"}?
        </h2>
        <p
          id="delete-description"
          className="mt-2 text-sm leading-6 text-white/48"
        >
          “{target.label}” sẽ bị xoá
          {target.kind === "set"
            ? " cùng tiến độ liên quan. Thao tác này không thể hoàn tác."
            : ". Các bộ từ bên trong sẽ chuyển về mục Chưa phân loại."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            className="min-h-11 rounded-full bg-white/7 text-sm text-white/65"
            onClick={onCancel}
          >
            Giữ lại
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full bg-rose-300/16 text-sm font-semibold text-rose-100"
            disabled={busy}
            onClick={onConfirm}
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

function useDialogEscape(onClose: () => void) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
}
