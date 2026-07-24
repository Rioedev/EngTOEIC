"use client";

import {
  BookCopy,
  Check,
  Download,
  FileSpreadsheet,
  Folder,
  FolderPlus,
  Globe2,
  Link2,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { ThemedSelect } from "@/components/profile/profile-form-controls";
import type {
  PersonalVocabularyLibrary,
  VocabularyFolder,
  VocabularySet,
  VocabularyTerm,
} from "@/lib/vocabulary";
import {
  createPersonalVocabularySet,
  createVocabularyFolder,
  deletePersonalVocabularySet,
  deleteVocabularyFolder,
  type EditableVocabularySet,
  type EditableVocabularyTerm,
  loadPersonalVocabularySet,
  renameVocabularyFolder,
  updatePersonalVocabularySet,
} from "@/lib/vocabulary-management-client";

type VocabularyManagerProps = {
  initialLibrary: PersonalVocabularyLibrary;
};

type EditorState = {
  id: string | null;
  slug: string | null;
  values: EditableVocabularySet;
};

type ConfirmState =
  | { kind: "set"; id: string; label: string }
  | { kind: "folder"; id: string; label: string }
  | null;

const emptyTerm = (): EditableVocabularyTerm => ({
  term: "",
  meaningVi: "",
  ipa: "",
  partOfSpeech: "",
  exampleEn: "",
  exampleVi: "",
});

const emptySet = (): EditableVocabularySet => ({
  title: "",
  description: "",
  topic: "",
  part: "",
  difficulty: "",
  visibility: "PRIVATE",
  folderId: "",
  terms: [emptyTerm()],
});

const visibilityOptions = [
  { value: "PRIVATE", label: "Riêng tư — chỉ mình bạn" },
  { value: "UNLISTED", label: "Không công khai — ai có URL đều xem được" },
  { value: "PUBLIC", label: "Công khai — xuất hiện trong thư viện" },
];

const partOptions = [
  { value: "", label: "Không gắn Part" },
  ...Array.from({ length: 7 }, (_, index) => ({
    value: `PART_${index + 1}`,
    label: `Part ${index + 1}`,
  })),
];

function editableTerm(term: VocabularyTerm): EditableVocabularyTerm {
  return {
    id: term.id,
    term: term.term,
    meaningVi: term.meaningVi,
    ipa: term.ipa ?? "",
    partOfSpeech: term.partOfSpeech ?? "",
    exampleEn: term.exampleEn ?? "",
    exampleVi: term.exampleVi ?? "",
  };
}

function editableSet(vocabularySet: VocabularySet): EditorState {
  return {
    id: vocabularySet.id,
    slug: vocabularySet.slug,
    values: {
      title: vocabularySet.title,
      description: vocabularySet.description ?? "",
      topic: vocabularySet.topic ?? "",
      part: vocabularySet.part ?? "",
      difficulty: vocabularySet.difficulty ?? "",
      visibility: vocabularySet.visibility,
      folderId: vocabularySet.folderId ?? "",
      terms: vocabularySet.terms?.map(editableTerm) ?? [emptyTerm()],
    },
  };
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function exportCsv(vocabularySet: VocabularySet) {
  const header = [
    "term",
    "meaningVi",
    "ipa",
    "partOfSpeech",
    "exampleEn",
    "exampleVi",
  ];
  const rows = (vocabularySet.terms ?? []).map((term) =>
    [
      term.term,
      term.meaningVi,
      term.ipa ?? "",
      term.partOfSpeech ?? "",
      term.exampleEn ?? "",
      term.exampleVi ?? "",
    ]
      .map(escapeCsv)
      .join(","),
  );
  const blob = new Blob([`\uFEFF${header.join(",")}\r\n${rows.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${vocabularySet.slug}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  cells.push(value.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]/g, "");
}

const headerAliases = {
  term: ["term", "word", "tu", "tuvung", "english"],
  meaningVi: ["meaningvi", "meaning", "nghia", "vietnamese", "definition"],
  ipa: ["ipa", "phienam", "pronunciation"],
  partOfSpeech: ["partofspeech", "pos", "tuloai"],
  exampleEn: ["exampleen", "example", "vidutienganh"],
  exampleVi: ["examplevi", "vidutiengviet", "dichvidu"],
};

function rowsToTerms(rows: string[][]) {
  const cleanRows = rows.filter((row) => row.some((cell) => cell.trim()));
  if (!cleanRows.length) return [];

  const normalizedFirstRow = cleanRows[0]!.map(normalizeHeader);
  const hasHeader = normalizedFirstRow.some((header) =>
    Object.values(headerAliases).flat().includes(header),
  );
  const dataRows = hasHeader ? cleanRows.slice(1) : cleanRows;

  function columnIndex(field: keyof typeof headerAliases, fallback: number) {
    if (!hasHeader) return fallback;
    return normalizedFirstRow.findIndex((header) =>
      headerAliases[field].includes(header),
    );
  }

  const indexes = {
    term: columnIndex("term", 0),
    meaningVi: columnIndex("meaningVi", 1),
    ipa: columnIndex("ipa", 2),
    partOfSpeech: columnIndex("partOfSpeech", 3),
    exampleEn: columnIndex("exampleEn", 4),
    exampleVi: columnIndex("exampleVi", 5),
  };

  return dataRows
    .slice(0, 500)
    .map((row) => ({
      term: indexes.term >= 0 ? (row[indexes.term] ?? "").trim() : "",
      meaningVi:
        indexes.meaningVi >= 0 ? (row[indexes.meaningVi] ?? "").trim() : "",
      ipa: indexes.ipa >= 0 ? (row[indexes.ipa] ?? "").trim() : "",
      partOfSpeech:
        indexes.partOfSpeech >= 0
          ? (row[indexes.partOfSpeech] ?? "").trim()
          : "",
      exampleEn:
        indexes.exampleEn >= 0 ? (row[indexes.exampleEn] ?? "").trim() : "",
      exampleVi:
        indexes.exampleVi >= 0 ? (row[indexes.exampleVi] ?? "").trim() : "",
    }))
    .filter((term) => term.term && term.meaningVi);
}

function parsePastedTerms(value: string) {
  const lines = value.split(/\r?\n/).filter((line) => line.trim());
  const delimiter = lines.some((line) => line.includes("\t"))
    ? "\t"
    : lines.some((line) => line.includes(";"))
      ? ";"
      : ",";
  return rowsToTerms(lines.map((line) => parseDelimitedLine(line, delimiter)));
}

function visibilityMeta(visibility: VocabularySet["visibility"]) {
  if (visibility === "PUBLIC") {
    return { label: "Công khai", icon: Globe2, className: "text-emerald-100" };
  }
  if (visibility === "UNLISTED") {
    return { label: "Có URL", icon: Link2, className: "text-sky-100" };
  }
  return { label: "Riêng tư", icon: LockKeyhole, className: "text-white/52" };
}

export function VocabularyManager({ initialLibrary }: VocabularyManagerProps) {
  const [library, setLibrary] = useState(initialLibrary);
  const [activeFolder, setActiveFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<VocabularyFolder | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const visibleSets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi");
    return library.sets.filter((set) => {
      const inFolder =
        activeFolder === "all" ||
        (activeFolder === "none"
          ? !set.folderId
          : set.folderId === activeFolder);
      const matchesSearch =
        !normalizedSearch ||
        [set.title, set.topic, set.description]
          .filter(Boolean)
          .some((value) =>
            value?.toLocaleLowerCase("vi").includes(normalizedSearch),
          );
      return inFolder && matchesSearch;
    });
  }, [activeFolder, library.sets, search]);

  async function refreshLibrary(message?: string) {
    const response = await import("@/lib/vocabulary-management-client").then(
      ({ loadPersonalVocabularyLibrary }) => loadPersonalVocabularyLibrary(),
    );
    setLibrary(response);
    if (message) setStatus(message);
  }

  async function openEditor(vocabularySet?: VocabularySet) {
    setStatus("");
    if (!vocabularySet) {
      setEditor({ id: null, slug: null, values: emptySet() });
      return;
    }

    setBusy(true);
    try {
      const detail = await loadPersonalVocabularySet(vocabularySet.id);
      setEditor(editableSet(detail));
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
      setEditor(null);
      await refreshLibrary(
        editor.id ? "Đã cập nhật bộ từ." : "Đã tạo bộ từ mới.",
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
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === "set") {
        await deletePersonalVocabularySet(confirm.id);
      } else {
        await deleteVocabularyFolder(confirm.id);
        if (activeFolder === confirm.id) setActiveFolder("all");
      }
      const kind = confirm.kind;
      setConfirm(null);
      await refreshLibrary(
        kind === "set" ? "Đã xoá bộ từ." : "Đã xoá thư mục.",
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
      exportCsv(detail);
      setStatus("Đã xuất bộ từ thành CSV UTF-8.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Chưa thể xuất bộ từ.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="glass-card h-fit p-4 lg:sticky lg:top-28">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-white/82">Thư mục</h2>
            <Folder
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
          </div>

          <nav className="mt-3 space-y-1" aria-label="Lọc theo thư mục">
            {[
              { id: "all", name: "Tất cả bộ từ", count: library.sets.length },
              {
                id: "none",
                name: "Chưa phân loại",
                count: library.sets.filter((set) => !set.folderId).length,
              },
            ].map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  activeFolder === folder.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-white/58 hover:bg-white/7 hover:text-white"
                }`}
                onClick={() => setActiveFolder(folder.id)}
              >
                <span>{folder.name}</span>
                <span className="text-xs opacity-65">{folder.count}</span>
              </button>
            ))}
            {library.folders.map((folder) => (
              <div key={folder.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  className={`flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-xl px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    activeFolder === folder.id
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-white/58 hover:bg-white/7 hover:text-white"
                  }`}
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="text-xs opacity-65">{folder.setCount}</span>
                </button>
                <button
                  type="button"
                  className="grid size-9 flex-none place-items-center rounded-xl text-white/28 opacity-0 transition hover:bg-white/8 hover:text-white group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  aria-label={`Tuỳ chọn thư mục ${folder.name}`}
                  onClick={() => setEditingFolder(folder)}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </nav>

          <form
            className="mt-4 border-t border-white/8 pt-4"
            onSubmit={createFolder}
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
                onChange={(event) => setFolderName(event.target.value)}
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
              {visibleSets.map((vocabularySet) => {
                const visibility = visibilityMeta(vocabularySet.visibility);
                const VisibilityIcon = visibility.icon;
                return (
                  <article
                    key={vocabularySet.id}
                    className="glass-card flex min-h-60 flex-col p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <BookCopy className="size-5" aria-hidden="true" />
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full bg-white/7 px-2.5 py-1 text-[0.68rem] ${visibility.className}`}
                      >
                        <VisibilityIcon
                          className="size-3.5"
                          aria-hidden="true"
                        />
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
                        {vocabularySet.description ||
                          "Chưa có mô tả cho bộ từ này."}
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                      <span className="text-xs text-white/42">
                        {vocabularySet.termCount} từ
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="grid size-10 place-items-center rounded-xl text-white/48 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          aria-label={`Chia sẻ ${vocabularySet.title}`}
                          onClick={() => void shareSet(vocabularySet)}
                        >
                          <Link2 className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="grid size-10 place-items-center rounded-xl text-white/48 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          aria-label={`Xuất ${vocabularySet.title}`}
                          onClick={() => void downloadSet(vocabularySet)}
                        >
                          <Download className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="grid size-10 place-items-center rounded-xl bg-white/7 text-white/70 transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          aria-label={`Chỉnh sửa ${vocabularySet.title}`}
                          onClick={() => void openEditor(vocabularySet)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="grid size-10 place-items-center rounded-xl text-rose-200/58 transition hover:bg-rose-300/10 hover:text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                          aria-label={`Xoá ${vocabularySet.title}`}
                          onClick={() =>
                            setConfirm({
                              kind: "set",
                              id: vocabularySet.id,
                              label: vocabularySet.title,
                            })
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
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
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-folder-title"
        >
          <form
            className="w-full max-w-sm rounded-3xl border border-white/12 bg-[#11191a]/98 p-6 shadow-2xl"
            onSubmit={saveFolderRename}
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
              className="mt-2 min-h-12 w-full rounded-2xl border border-white/11 bg-black/20 px-4 text-sm outline-none focus:border-[var(--accent)]"
              value={editingFolder.name}
              onChange={(event) =>
                setEditingFolder({
                  ...editingFolder,
                  name: event.target.value,
                })
              }
            />
            <div className="mt-5 flex justify-between gap-2">
              <button
                type="button"
                className="min-h-11 rounded-full px-4 text-sm text-rose-100 hover:bg-rose-300/10"
                onClick={() => {
                  setEditingFolder(null);
                  setConfirm({
                    kind: "folder",
                    id: editingFolder.id,
                    label: editingFolder.name,
                  });
                }}
              >
                Xoá thư mục
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-full bg-white/7 px-4 text-sm text-white/65"
                  onClick={() => setEditingFolder(null)}
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
      ) : null}

      {confirm ? (
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
              Xoá {confirm.kind === "set" ? "bộ từ" : "thư mục"}?
            </h2>
            <p
              id="delete-description"
              className="mt-2 text-sm leading-6 text-white/48"
            >
              “{confirm.label}” sẽ bị xoá
              {confirm.kind === "set"
                ? " cùng tiến độ liên quan. Thao tác này không thể hoàn tác."
                : ". Các bộ từ bên trong sẽ chuyển về mục Chưa phân loại."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="min-h-11 rounded-full bg-white/7 text-sm text-white/65"
                onClick={() => setConfirm(null)}
              >
                Giữ lại
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full bg-rose-300/16 text-sm font-semibold text-rose-100"
                disabled={busy}
                onClick={() => void confirmDelete()}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type VocabularySetEditorProps = {
  editor: EditorState;
  folders: VocabularyFolder[];
  busy: boolean;
  status: string;
  onClose: () => void;
  onSave: (values: EditableVocabularySet) => Promise<void>;
};

function VocabularySetEditor({
  editor,
  folders,
  busy,
  status,
  onClose,
  onSave,
}: VocabularySetEditorProps) {
  const [values, setValues] = useState(editor.values);
  const [pasteValue, setPasteValue] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function updateTerm(
    index: number,
    field: keyof EditableVocabularyTerm,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      terms: current.terms.map((term, termIndex) =>
        termIndex === index ? { ...term, [field]: value } : term,
      ),
    }));
  }

  function appendTerms(terms: EditableVocabularyTerm[]) {
    if (!terms.length) {
      setImportMessage(
        "Không tìm thấy dòng hợp lệ. Mỗi dòng cần có từ và nghĩa.",
      );
      return;
    }

    setValues((current) => {
      const existing = new Set(
        current.terms
          .filter((term) => term.term.trim())
          .map((term) => term.term.trim().toLocaleLowerCase("en")),
      );
      const imported = terms.filter((term) => {
        const key = term.term.trim().toLocaleLowerCase("en");
        if (!key || existing.has(key)) return false;
        existing.add(key);
        return true;
      });
      const currentTerms =
        current.terms.length === 1 &&
        !current.terms[0]?.term &&
        !current.terms[0]?.meaningVi
          ? []
          : current.terms;
      return {
        ...current,
        terms: [...currentTerms, ...imported].slice(0, 500),
      };
    });
    setImportMessage(`Đã thêm ${terms.length} dòng hợp lệ.`);
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportMessage("File cần nhỏ hơn 2 MB.");
      return;
    }

    try {
      if (file.name.toLocaleLowerCase("en").endsWith(".csv")) {
        appendTerms(parsePastedTerms(await file.text()));
        return;
      }
      if (!file.name.toLocaleLowerCase("en").endsWith(".xlsx")) {
        setImportMessage("Chỉ hỗ trợ file .csv hoặc .xlsx.");
        return;
      }

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer as never);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("File Excel không có sheet dữ liệu.");

      const rows: string[][] = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        if (rows.length >= 501) return;
        const cells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          cells[columnNumber - 1] = cell.text;
        });
        rows.push(cells);
      });
      appendTerms(rowsToTerms(rows));
    } catch {
      setImportMessage(
        "Không thể đọc file. Hãy kiểm tra sheet đầu tiên và các cột term, meaningVi.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-[#081011]/88 p-3 backdrop-blur-xl sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-editor-title"
    >
      <form
        className="mx-auto w-full max-w-6xl rounded-3xl border border-white/12 bg-[#11191a]/97 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(values);
        }}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 rounded-t-3xl border-b border-white/9 bg-[#11191a]/94 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs text-[var(--accent)]">
              {editor.id ? "Chỉnh sửa bộ từ" : "Bộ từ mới"}
            </p>
            <h2 id="set-editor-title" className="mt-1 text-xl font-semibold">
              {values.title || "Bộ từ chưa đặt tên"}
            </h2>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/7 text-white/58 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Đóng trình chỉnh sửa"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-7">
            <section aria-labelledby="set-information-title">
              <h3
                id="set-information-title"
                className="text-sm font-semibold text-white/78"
              >
                Thông tin bộ từ
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-xs text-white/52">Tên bộ từ</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/18 px-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                    value={values.title}
                    minLength={2}
                    maxLength={120}
                    required
                    placeholder="Ví dụ: Từ vựng buổi họp"
                    onChange={(event) =>
                      setValues({ ...values, title: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span className="text-xs text-white/52">Chủ đề</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/18 px-4 text-sm outline-none focus:border-[var(--accent)]"
                    value={values.topic}
                    maxLength={80}
                    placeholder="Office, Travel..."
                    onChange={(event) =>
                      setValues({ ...values, topic: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span className="text-xs text-white/52">Độ khó</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/18 px-4 text-sm outline-none focus:border-[var(--accent)]"
                    value={values.difficulty}
                    maxLength={40}
                    placeholder="Cơ bản, Trung cấp..."
                    onChange={(event) =>
                      setValues({ ...values, difficulty: event.target.value })
                    }
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs text-white/52">Mô tả</span>
                  <textarea
                    className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
                    value={values.description}
                    maxLength={600}
                    placeholder="Bộ từ này dùng cho..."
                    onChange={(event) =>
                      setValues({ ...values, description: event.target.value })
                    }
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="terms-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3
                    id="terms-title"
                    className="text-sm font-semibold text-white/78"
                  >
                    Danh sách từ
                  </h3>
                  <p className="mt-1 text-xs text-white/36">
                    {values.terms.length}/500 từ
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/7 px-4 text-xs text-white/65 hover:bg-white/11"
                  onClick={() =>
                    setValues({
                      ...values,
                      terms: [...values.terms, emptyTerm()],
                    })
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Thêm từ
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {values.terms.map((term, index) => (
                  <fieldset
                    key={term.id ?? `new-${index}`}
                    className="rounded-2xl border border-white/9 bg-white/4 p-4"
                  >
                    <legend className="px-2 text-xs text-white/36">
                      Từ {index + 1}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                      <label className="lg:col-span-2">
                        <span className="text-xs text-white/48">
                          Từ / cụm từ
                        </span>
                        <input
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={term.term}
                          required={index === 0}
                          maxLength={160}
                          onChange={(event) =>
                            updateTerm(index, "term", event.target.value)
                          }
                        />
                      </label>
                      <label className="lg:col-span-2">
                        <span className="text-xs text-white/48">Nghĩa</span>
                        <input
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={term.meaningVi}
                          required={index === 0}
                          maxLength={500}
                          onChange={(event) =>
                            updateTerm(index, "meaningVi", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span className="text-xs text-white/48">IPA</span>
                        <input
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={term.ipa}
                          maxLength={120}
                          onChange={(event) =>
                            updateTerm(index, "ipa", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span className="text-xs text-white/48">Từ loại</span>
                        <input
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={term.partOfSpeech}
                          maxLength={80}
                          onChange={(event) =>
                            updateTerm(
                              index,
                              "partOfSpeech",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="lg:col-span-3">
                        <span className="text-xs text-white/48">
                          Ví dụ tiếng Anh
                        </span>
                        <input
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={term.exampleEn}
                          maxLength={800}
                          onChange={(event) =>
                            updateTerm(index, "exampleEn", event.target.value)
                          }
                        />
                      </label>
                      <label className="lg:col-span-2">
                        <span className="text-xs text-white/48">
                          Dịch ví dụ
                        </span>
                        <input
                          className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={term.exampleVi}
                          maxLength={800}
                          onChange={(event) =>
                            updateTerm(index, "exampleVi", event.target.value)
                          }
                        />
                      </label>
                      <div className="flex items-end justify-end">
                        <button
                          type="button"
                          className="grid size-11 place-items-center rounded-xl text-rose-200/50 hover:bg-rose-300/10 hover:text-rose-100 disabled:opacity-20"
                          aria-label={`Xoá từ ${index + 1}`}
                          disabled={values.terms.length === 1}
                          onClick={() =>
                            setValues({
                              ...values,
                              terms: values.terms.filter(
                                (_, termIndex) => termIndex !== index,
                              ),
                            })
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/9 bg-white/4 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <UsersRound
                  className="size-4 text-[var(--accent)]"
                  aria-hidden="true"
                />
                Hiển thị & phân loại
              </h3>
              <label className="mt-4 block text-xs text-white/48">
                Quyền riêng tư
              </label>
              <ThemedSelect
                id="set-visibility"
                value={values.visibility}
                ariaLabel="Quyền riêng tư"
                options={visibilityOptions}
                onChange={(visibility) =>
                  setValues({
                    ...values,
                    visibility:
                      visibility as EditableVocabularySet["visibility"],
                  })
                }
              />
              <label className="mt-4 block text-xs text-white/48">
                Thư mục
              </label>
              <ThemedSelect
                id="set-folder"
                value={values.folderId}
                ariaLabel="Thư mục"
                options={[
                  { value: "", label: "Chưa phân loại" },
                  ...folders.map((folder) => ({
                    value: folder.id,
                    label: folder.name,
                  })),
                ]}
                onChange={(folderId) => setValues({ ...values, folderId })}
              />
              <label className="mt-4 block text-xs text-white/48">
                TOEIC Part
              </label>
              <ThemedSelect
                id="set-part"
                value={values.part}
                ariaLabel="TOEIC Part"
                options={partOptions}
                onChange={(part) => setValues({ ...values, part })}
              />
            </section>

            <section className="rounded-2xl border border-white/9 bg-white/4 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileSpreadsheet
                  className="size-4 text-[var(--accent)]"
                  aria-hidden="true"
                />
                Import danh sách
              </h3>
              <p className="mt-2 text-xs leading-5 text-white/38">
                Cột: term, meaningVi, ipa, partOfSpeech, exampleEn, exampleVi.
                Tối đa 500 dòng.
              </p>
              <input
                ref={fileRef}
                className="sr-only"
                id="vocabulary-file-import"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => void importFile(event.target.files?.[0])}
              />
              <label
                htmlFor="vocabulary-file-import"
                className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/16 bg-black/15 text-xs text-white/58 transition hover:border-[var(--accent)] hover:text-white focus-within:ring-2 focus-within:ring-[var(--accent)]"
              >
                <Upload className="size-4" aria-hidden="true" />
                Chọn CSV hoặc Excel
              </label>

              <label
                className="mt-4 block text-xs text-white/48"
                htmlFor="paste-terms"
              >
                Hoặc dán danh sách
              </label>
              <textarea
                id="paste-terms"
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/9 bg-black/18 px-3 py-2 text-xs leading-5 outline-none placeholder:text-white/25 focus:border-[var(--accent)]"
                value={pasteValue}
                placeholder={"appointment\tcuộc hẹn\t/əˈpɔɪnt.mənt/\tnoun"}
                onChange={(event) => setPasteValue(event.target.value)}
              />
              <button
                type="button"
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/8 text-xs text-white/68 hover:bg-white/12"
                onClick={() => {
                  appendTerms(parsePastedTerms(pasteValue));
                  setPasteValue("");
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                Thêm vào bộ từ
              </button>
              <p
                className="mt-2 min-h-4 text-xs text-[var(--accent)]"
                role="status"
              >
                {importMessage}
              </p>
            </section>
          </aside>
        </div>

        <footer className="sticky bottom-0 z-20 flex flex-col gap-3 rounded-b-3xl border-t border-white/9 bg-[#11191a]/94 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="min-h-5 text-xs text-rose-100" role="status">
            {status}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 flex-1 rounded-full bg-white/7 px-5 text-sm text-white/62 sm:flex-none"
              onClick={onClose}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] disabled:cursor-wait disabled:opacity-55 sm:flex-none"
              style={{ color: "var(--accent-ink)" }}
              disabled={busy}
            >
              {busy ? (
                <Save className="size-4 animate-pulse" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              {busy ? "Đang lưu…" : "Lưu bộ từ"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
