import type {
  PersonalVocabularySet,
  PersonalVocabularyTerm,
} from "@engtoeic/shared";
import type {
  EditableVocabularySet,
  EditableVocabularyTerm,
} from "@/lib/vocabulary-management-client";

export type VocabularyEditorState = {
  id: string | null;
  values: EditableVocabularySet;
};

export type VocabularyDeleteTarget =
  | { kind: "set"; id: string; label: string }
  | { kind: "folder"; id: string; label: string };

export const createEmptyVocabularyTerm = (): EditableVocabularyTerm => ({
  term: "",
  meaningVi: "",
  ipa: "",
  partOfSpeech: "",
  exampleEn: "",
  exampleVi: "",
});

export const createEmptyVocabularySet = (): EditableVocabularySet => ({
  title: "",
  description: "",
  topic: "",
  part: "",
  difficulty: "",
  visibility: "PRIVATE",
  folderId: "",
  terms: [createEmptyVocabularyTerm()],
});

function toEditableTerm(term: PersonalVocabularyTerm): EditableVocabularyTerm {
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

export function toVocabularyEditorState(
  vocabularySet: PersonalVocabularySet,
): VocabularyEditorState {
  return {
    id: vocabularySet.id,
    values: {
      title: vocabularySet.title,
      description: vocabularySet.description ?? "",
      topic: vocabularySet.topic ?? "",
      part: vocabularySet.part ?? "",
      difficulty: vocabularySet.difficulty ?? "",
      visibility: vocabularySet.visibility,
      folderId: vocabularySet.folderId ?? "",
      terms: vocabularySet.terms?.map(toEditableTerm) ?? [
        createEmptyVocabularyTerm(),
      ],
    },
  };
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function downloadVocabularySetCsv(vocabularySet: PersonalVocabularySet) {
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
