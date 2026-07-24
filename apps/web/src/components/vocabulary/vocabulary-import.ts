import type { EditableVocabularyTerm } from "@/lib/vocabulary-management-client";

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

export function rowsToVocabularyTerms(
  rows: string[][],
): EditableVocabularyTerm[] {
  const cleanRows = rows.filter((row) => row.some((cell) => cell.trim()));
  if (!cleanRows.length) return [];

  const normalizedFirstRow = cleanRows[0]!.map(normalizeHeader);
  const aliases = Object.values(headerAliases).flat();
  const hasHeader = normalizedFirstRow.some((header) =>
    aliases.includes(header),
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

export function parsePastedVocabularyTerms(value: string) {
  const lines = value.split(/\r?\n/).filter((line) => line.trim());
  const delimiter = lines.some((line) => line.includes("\t"))
    ? "\t"
    : lines.some((line) => line.includes(";"))
      ? ";"
      : ",";
  return rowsToVocabularyTerms(
    lines.map((line) => parseDelimitedLine(line, delimiter)),
  );
}
