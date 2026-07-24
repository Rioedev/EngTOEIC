"use client";

import { BookCopy, Plus, Search } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import type {
  PersonalVocabularyLibrary,
  VocabularyFolder,
  VocabularySet,
} from "@/lib/vocabulary";
import {
  createPersonalVocabularySet,
  createVocabularyFolder,
  deletePersonalVocabularySet,
  deleteVocabularyFolder,
  type EditableVocabularySet,
  loadPersonalVocabularyLibrary,
  loadPersonalVocabularySet,
  renameVocabularyFolder,
  updatePersonalVocabularySet,
} from "@/lib/vocabulary-management-client";
import {
  DeleteVocabularyDialog,
  RenameFolderDialog,
  VocabularyFolderSidebar,
  VocabularySetCard,
} from "./vocabulary-manager-parts";
import {
  createEmptyVocabularySet,
  downloadVocabularySetCsv,
  toVocabularyEditorState,
  type VocabularyDeleteTarget,
  type VocabularyEditorState,
} from "./vocabulary-manager-model";
import { VocabularySetEditor } from "./vocabulary-set-editor";

type VocabularyManagerProps = {
  initialLibrary: PersonalVocabularyLibrary;
};

export function VocabularyManager({ initialLibrary }: VocabularyManagerProps) {
  const [library, setLibrary] = useState(initialLibrary);
  const [activeFolder, setActiveFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<VocabularyEditorState | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<VocabularyDeleteTarget | null>(null);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<VocabularyFolder | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const visibleSets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi");
    return library.sets.filter((vocabularySet) => {
      const inFolder =
        activeFolder === "all" ||
        (activeFolder === "none"
          ? !vocabularySet.folderId
          : vocabularySet.folderId === activeFolder);
      const matchesSearch =
        !normalizedSearch ||
        [vocabularySet.title, vocabularySet.topic, vocabularySet.description]
          .filter(Boolean)
          .some((value) =>
            value?.toLocaleLowerCase("vi").includes(normalizedSearch),
          );
      return inFolder && matchesSearch;
    });
  }, [activeFolder, library.sets, search]);

  async function refreshLibrary(message?: string) {
    const response = await loadPersonalVocabularyLibrary();
    setLibrary(response);
    if (message) setStatus(message);
  }

  async function openEditor(vocabularySet?: VocabularySet) {
    setStatus("");
    if (!vocabularySet) {
      setEditor({
        id: null,
        values: createEmptyVocabularySet(),
      });
      return;
    }

    setBusy(true);
    try {
      const detail = await loadPersonalVocabularySet(vocabularySet.id);
      setEditor(toVocabularyEditorState(detail));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Không thể mở bộ từ.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEditor(values: EditableVocabularySet) {
    if (!editor) return;
    setBusy(true);
    setStatus("");
    try {
      const normalizedValues = {
        ...values,
        terms: values.terms.filter(
          (term) => term.term.trim() || term.meaningVi.trim(),
        ),
      };
      if (editor.id) {
        await updatePersonalVocabularySet(editor.id, normalizedValues);
      } else {
        await createPersonalVocabularySet(normalizedValues);
      }
      const wasEditing = Boolean(editor.id);
      setEditor(null);
      await refreshLibrary(
        wasEditing ? "Đã cập nhật bộ từ." : "Đã tạo bộ từ mới.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Chưa thể lưu bộ từ.");
    } finally {
      setBusy(false);
    }
  }

  async function createFolder(event: FormEvent) {
    event.preventDefault();
    if (!folderName.trim()) return;
    setBusy(true);
    try {
      await createVocabularyFolder(folderName);
      setFolderName("");
      await refreshLibrary("Đã tạo thư mục.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Chưa thể tạo thư mục.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveFolderRename(event: FormEvent) {
    event.preventDefault();
    if (!editingFolder) return;
    setBusy(true);
    try {
      await renameVocabularyFolder(editingFolder.id, editingFolder.name);
      setEditingFolder(null);
      await refreshLibrary("Đã đổi tên thư mục.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Chưa thể đổi tên thư mục.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      if (deleteTarget.kind === "set") {
        await deletePersonalVocabularySet(deleteTarget.id);
      } else {
        await deleteVocabularyFolder(deleteTarget.id);
        if (activeFolder === deleteTarget.id) setActiveFolder("all");
      }
      const deletedKind = deleteTarget.kind;
      setDeleteTarget(null);
      await refreshLibrary(
        deletedKind === "set" ? "Đã xoá bộ từ." : "Đã xoá thư mục.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Chưa thể xoá dữ liệu.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function shareSet(vocabularySet: VocabularySet) {
    if (vocabularySet.visibility === "PRIVATE") {
      setStatus("Hãy đổi bộ từ sang Công khai hoặc Có URL trước khi chia sẻ.");
      return;
    }
    const url = `${window.location.origin}/vocabulary/${vocabularySet.slug}`;
    await navigator.clipboard.writeText(url);
    setStatus("Đã sao chép URL chia sẻ.");
  }

  async function downloadSet(vocabularySet: VocabularySet) {
    setBusy(true);
    try {
      const detail = await loadPersonalVocabularySet(vocabularySet.id);
      downloadVocabularySetCsv(detail);
      setStatus("Đã xuất bộ từ thành CSV UTF-8.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Chưa thể xuất bộ từ.",
      );
    } finally {
      setBusy(false);
    }
  }

  function requestFolderDelete(folder: VocabularyFolder) {
    setEditingFolder(null);
    setDeleteTarget({
      kind: "folder",
      id: folder.id,
      label: folder.name,
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <VocabularyFolderSidebar
          library={library}
          activeFolder={activeFolder}
          folderName={folderName}
          busy={busy}
          onSelectFolder={setActiveFolder}
          onFolderNameChange={setFolderName}
          onCreateFolder={createFolder}
          onEditFolder={setEditingFolder}
        />

        <section aria-labelledby="personal-sets-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
                Thư viện cá nhân
              </p>
              <h2
                id="personal-sets-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.018em] sm:text-3xl"
              >
                Bộ từ của tôi
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ color: "var(--accent-ink)" }}
              onClick={() => void openEditor()}
            >
              <Plus className="size-4" aria-hidden="true" />
              Tạo bộ từ
            </button>
          </div>

          <label className="relative mt-5 block" htmlFor="personal-set-search">
            <span className="sr-only">Tìm trong bộ từ cá nhân</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/34"
              aria-hidden="true"
            />
            <input
              id="personal-set-search"
              type="search"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/18 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/32 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
              value={search}
              placeholder="Tìm bộ từ của bạn..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <p
            className="mt-3 min-h-5 text-xs text-[var(--accent)]"
            role="status"
            aria-live="polite"
          >
            {busy ? "Đang xử lý…" : status}
          </p>

          {visibleSets.length ? (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {visibleSets.map((vocabularySet) => (
                <VocabularySetCard
                  key={vocabularySet.id}
                  vocabularySet={vocabularySet}
                  onShare={(set) => void shareSet(set)}
                  onDownload={(set) => void downloadSet(set)}
                  onEdit={(set) => void openEditor(set)}
                  onDelete={(set) =>
                    setDeleteTarget({
                      kind: "set",
                      id: set.id,
                      label: set.title,
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="glass-card mt-3 grid min-h-60 place-items-center p-8 text-center">
              <div>
                <BookCopy
                  className="mx-auto size-9 text-white/28"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-lg font-semibold">
                  Chưa có bộ từ trong mục này
                </h3>
                <p className="mt-2 text-sm text-white/45">
                  Tạo mới, import từ Excel/CSV hoặc sao chép từ thư viện công
                  khai.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {editor ? (
        <VocabularySetEditor
          editor={editor}
          folders={library.folders}
          busy={busy}
          status={status}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      ) : null}

      {editingFolder ? (
        <RenameFolderDialog
          folder={editingFolder}
          onChange={setEditingFolder}
          onCancel={() => setEditingFolder(null)}
          onDelete={requestFolderDelete}
          onSubmit={saveFolderRename}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteVocabularyDialog
          target={deleteTarget}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}
