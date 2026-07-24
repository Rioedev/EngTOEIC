"use client";

import {
  Check,
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { ThemedSelect } from "@/components/profile/profile-form-controls";
import type { VocabularyFolder } from "@/lib/vocabulary";
import type {
  EditableVocabularySet,
  EditableVocabularyTerm,
} from "@/lib/vocabulary-management-client";
import {
  parsePastedVocabularyTerms,
  rowsToVocabularyTerms,
} from "./vocabulary-import";
import {
  createEmptyVocabularyTerm,
  type VocabularyEditorState,
} from "./vocabulary-manager-model";

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

type VocabularySetEditorProps = {
  editor: VocabularyEditorState;
  folders: VocabularyFolder[];
  busy: boolean;
  status: string;
  onClose: () => void;
  onSave: (values: EditableVocabularySet) => Promise<void>;
};

export function VocabularySetEditor({
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

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  function updateSet<Field extends keyof EditableVocabularySet>(
    field: Field,
    value: EditableVocabularySet[Field],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

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

    const existing = new Set(
      values.terms
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
      values.terms.length === 1 &&
      !values.terms[0]?.term &&
      !values.terms[0]?.meaningVi
        ? []
        : values.terms;
    const importedCount = Math.min(
      imported.length,
      Math.max(0, 500 - currentTerms.length),
    );
    setValues({
      ...values,
      terms: [...currentTerms, ...imported].slice(0, 500),
    });
    setImportMessage(`Đã thêm ${importedCount} dòng mới.`);
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportMessage("File cần nhỏ hơn 2 MB.");
      return;
    }

    try {
      if (file.name.toLocaleLowerCase("en").endsWith(".csv")) {
        appendTerms(parsePastedVocabularyTerms(await file.text()));
        return;
      }
      if (!file.name.toLocaleLowerCase("en").endsWith(".xlsx")) {
        setImportMessage("Chỉ hỗ trợ file .csv hoặc .xlsx.");
        return;
      }

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load((await file.arrayBuffer()) as never);
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
      appendTerms(rowsToVocabularyTerms(rows));
    } catch {
      setImportMessage(
        "Không thể đọc file. Hãy kiểm tra sheet đầu tiên và các cột term, meaningVi.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submitEditor(event: FormEvent) {
    event.preventDefault();
    void onSave(values);
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
        onSubmit={submitEditor}
      >
        <EditorHeader editor={editor} title={values.title} onClose={onClose} />

        <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-7">
            <SetInformation values={values} onChange={updateSet} />
            <TermList
              terms={values.terms}
              onAdd={() =>
                updateSet("terms", [
                  ...values.terms,
                  createEmptyVocabularyTerm(),
                ])
              }
              onChange={updateTerm}
              onRemove={(index) =>
                updateSet(
                  "terms",
                  values.terms.filter((_, termIndex) => termIndex !== index),
                )
              }
            />
          </div>

          <aside className="space-y-5">
            <SetClassification
              values={values}
              folders={folders}
              onChange={updateSet}
            />
            <VocabularyImportPanel
              fileRef={fileRef}
              pasteValue={pasteValue}
              importMessage={importMessage}
              onFileChange={(file) => void importFile(file)}
              onPasteChange={setPasteValue}
              onAppendPaste={() => {
                appendTerms(parsePastedVocabularyTerms(pasteValue));
                setPasteValue("");
              }}
            />
          </aside>
        </div>

        <EditorFooter busy={busy} status={status} onClose={onClose} />
      </form>
    </div>
  );
}

type EditorHeaderProps = {
  editor: VocabularyEditorState;
  title: string;
  onClose: () => void;
};

function EditorHeader({ editor, title, onClose }: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 rounded-t-3xl border-b border-white/9 bg-[#11191a]/94 px-5 py-4 backdrop-blur-xl sm:px-7">
      <div>
        <p className="text-xs text-[var(--accent)]">
          {editor.id ? "Chỉnh sửa bộ từ" : "Bộ từ mới"}
        </p>
        <h2 id="set-editor-title" className="mt-1 text-xl font-semibold">
          {title || "Bộ từ chưa đặt tên"}
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
  );
}

type SetInformationProps = {
  values: EditableVocabularySet;
  onChange: <Field extends keyof EditableVocabularySet>(
    field: Field,
    value: EditableVocabularySet[Field],
  ) => void;
};

function SetInformation({ values, onChange }: SetInformationProps) {
  return (
    <section aria-labelledby="set-information-title">
      <h3
        id="set-information-title"
        className="text-sm font-semibold text-white/78"
      >
        Thông tin bộ từ
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <EditorField
          className="sm:col-span-2"
          label="Tên bộ từ"
          value={values.title}
          minLength={2}
          maxLength={120}
          required
          placeholder="Ví dụ: Từ vựng buổi họp"
          onChange={(value) => onChange("title", value)}
        />
        <EditorField
          label="Chủ đề"
          value={values.topic}
          maxLength={80}
          placeholder="Office, Travel..."
          onChange={(value) => onChange("topic", value)}
        />
        <EditorField
          label="Độ khó"
          value={values.difficulty}
          maxLength={40}
          placeholder="Cơ bản, Trung cấp..."
          onChange={(value) => onChange("difficulty", value)}
        />
        <EditorField
          className="sm:col-span-2"
          label="Mô tả"
          value={values.description}
          maxLength={600}
          multiline
          placeholder="Bộ từ này dùng cho..."
          onChange={(value) => onChange("description", value)}
        />
      </div>
    </section>
  );
}

type EditorFieldProps = {
  className?: string;
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
} & Pick<
  ComponentProps<"input">,
  "maxLength" | "minLength" | "placeholder" | "required"
>;

function EditorField({
  className,
  label,
  value,
  multiline,
  onChange,
  ...inputProps
}: EditorFieldProps) {
  const controlClassName = multiline
    ? "mt-2 min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
    : "mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/18 px-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]";
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => onChange(event.target.value);

  return (
    <label className={className}>
      <span className="text-xs text-white/52">{label}</span>
      {multiline ? (
        <textarea
          className={controlClassName}
          value={value}
          maxLength={inputProps.maxLength}
          placeholder={inputProps.placeholder}
          onChange={handleChange}
        />
      ) : (
        <input
          {...inputProps}
          className={controlClassName}
          value={value}
          onChange={handleChange}
        />
      )}
    </label>
  );
}

type TermListProps = {
  terms: EditableVocabularyTerm[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof EditableVocabularyTerm,
    value: string,
  ) => void;
  onRemove: (index: number) => void;
};

function TermList({ terms, onAdd, onChange, onRemove }: TermListProps) {
  return (
    <section aria-labelledby="terms-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="terms-title" className="text-sm font-semibold text-white/78">
            Danh sách từ
          </h3>
          <p className="mt-1 text-xs text-white/36">{terms.length}/500 từ</p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/7 px-4 text-xs text-white/65 hover:bg-white/11 disabled:opacity-40"
          disabled={terms.length >= 500}
          onClick={onAdd}
        >
          <Plus className="size-4" aria-hidden="true" />
          Thêm từ
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {terms.map((term, index) => (
          <VocabularyTermEditor
            key={term.id ?? `new-${index}`}
            term={term}
            index={index}
            removable={terms.length > 1}
            onChange={onChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

type VocabularyTermEditorProps = {
  term: EditableVocabularyTerm;
  index: number;
  removable: boolean;
  onChange: TermListProps["onChange"];
  onRemove: (index: number) => void;
};

function VocabularyTermEditor({
  term,
  index,
  removable,
  onChange,
  onRemove,
}: VocabularyTermEditorProps) {
  return (
    <fieldset className="rounded-2xl border border-white/9 bg-white/4 p-4">
      <legend className="px-2 text-xs text-white/36">Từ {index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <TermField
          className="lg:col-span-2"
          label="Từ / cụm từ"
          value={term.term}
          required={index === 0}
          maxLength={160}
          onChange={(value) => onChange(index, "term", value)}
        />
        <TermField
          className="lg:col-span-2"
          label="Nghĩa"
          value={term.meaningVi}
          required={index === 0}
          maxLength={500}
          onChange={(value) => onChange(index, "meaningVi", value)}
        />
        <TermField
          label="IPA"
          value={term.ipa}
          maxLength={120}
          onChange={(value) => onChange(index, "ipa", value)}
        />
        <TermField
          label="Từ loại"
          value={term.partOfSpeech}
          maxLength={80}
          onChange={(value) => onChange(index, "partOfSpeech", value)}
        />
        <TermField
          className="lg:col-span-3"
          label="Ví dụ tiếng Anh"
          value={term.exampleEn}
          maxLength={800}
          onChange={(value) => onChange(index, "exampleEn", value)}
        />
        <TermField
          className="lg:col-span-2"
          label="Dịch ví dụ"
          value={term.exampleVi}
          maxLength={800}
          onChange={(value) => onChange(index, "exampleVi", value)}
        />
        <div className="flex items-end justify-end">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-rose-200/50 hover:bg-rose-300/10 hover:text-rose-100 disabled:opacity-20"
            aria-label={`Xoá từ ${index + 1}`}
            disabled={!removable}
            onClick={() => onRemove(index)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </fieldset>
  );
}

type TermFieldProps = {
  className?: string;
  label: string;
  value: string;
  required?: boolean;
  maxLength: number;
  onChange: (value: string) => void;
};

function TermField({
  className,
  label,
  value,
  required,
  maxLength,
  onChange,
}: TermFieldProps) {
  return (
    <label className={className}>
      <span className="text-xs text-white/48">{label}</span>
      <input
        className="mt-1.5 min-h-11 w-full rounded-xl border border-white/9 bg-black/18 px-3 text-sm outline-none focus:border-[var(--accent)]"
        value={value}
        required={required}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type SetClassificationProps = SetInformationProps & {
  folders: VocabularyFolder[];
};

function SetClassification({
  values,
  folders,
  onChange,
}: SetClassificationProps) {
  return (
    <section className="rounded-2xl border border-white/9 bg-white/4 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <UsersRound
          className="size-4 text-[var(--accent)]"
          aria-hidden="true"
        />
        Hiển thị & phân loại
      </h3>
      <SelectLabel>Quyền riêng tư</SelectLabel>
      <ThemedSelect
        id="set-visibility"
        value={values.visibility}
        ariaLabel="Quyền riêng tư"
        options={visibilityOptions}
        onChange={(visibility) =>
          onChange(
            "visibility",
            visibility as EditableVocabularySet["visibility"],
          )
        }
      />
      <SelectLabel>Thư mục</SelectLabel>
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
        onChange={(folderId) => onChange("folderId", folderId)}
      />
      <SelectLabel>TOEIC Part</SelectLabel>
      <ThemedSelect
        id="set-part"
        value={values.part}
        ariaLabel="TOEIC Part"
        options={partOptions}
        onChange={(part) => onChange("part", part)}
      />
    </section>
  );
}

function SelectLabel({ children }: { children: string }) {
  return <span className="mt-4 block text-xs text-white/48">{children}</span>;
}

type VocabularyImportPanelProps = {
  fileRef: RefObject<HTMLInputElement | null>;
  pasteValue: string;
  importMessage: string;
  onFileChange: (file: File | undefined) => void;
  onPasteChange: (value: string) => void;
  onAppendPaste: () => void;
};

function VocabularyImportPanel({
  fileRef,
  pasteValue,
  importMessage,
  onFileChange,
  onPasteChange,
  onAppendPaste,
}: VocabularyImportPanelProps) {
  return (
    <section className="rounded-2xl border border-white/9 bg-white/4 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <FileSpreadsheet
          className="size-4 text-[var(--accent)]"
          aria-hidden="true"
        />
        Import danh sách
      </h3>
      <p className="mt-2 text-xs leading-5 text-white/38">
        Cột: term, meaningVi, ipa, partOfSpeech, exampleEn, exampleVi. Tối đa
        500 dòng.
      </p>
      <input
        ref={fileRef}
        className="sr-only"
        id="vocabulary-file-import"
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />
      <label
        htmlFor="vocabulary-file-import"
        className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/16 bg-black/15 text-xs text-white/58 transition hover:border-[var(--accent)] hover:text-white focus-within:ring-2 focus-within:ring-[var(--accent)]"
      >
        <Upload className="size-4" aria-hidden="true" />
        Chọn CSV hoặc Excel
      </label>

      <label className="mt-4 block text-xs text-white/48" htmlFor="paste-terms">
        Hoặc dán danh sách
      </label>
      <textarea
        id="paste-terms"
        className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/9 bg-black/18 px-3 py-2 text-xs leading-5 outline-none placeholder:text-white/25 focus:border-[var(--accent)]"
        value={pasteValue}
        placeholder={"appointment\tcuộc hẹn\t/əˈpɔɪnt.mənt/\tnoun"}
        onChange={(event) => onPasteChange(event.target.value)}
      />
      <button
        type="button"
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/8 text-xs text-white/68 hover:bg-white/12"
        onClick={onAppendPaste}
      >
        <Plus className="size-4" aria-hidden="true" />
        Thêm vào bộ từ
      </button>
      <p className="mt-2 min-h-4 text-xs text-[var(--accent)]" role="status">
        {importMessage}
      </p>
    </section>
  );
}

type EditorFooterProps = {
  busy: boolean;
  status: string;
  onClose: () => void;
};

function EditorFooter({ busy, status, onClose }: EditorFooterProps) {
  return (
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
  );
}
