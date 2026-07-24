import type {
  DeletedResourceResponse,
  PersonalVocabularyLibrary,
  PersonalVocabularySet,
  VocabularyFolder,
  VocabularySet,
  VocabularySetMutationInput,
  VocabularyTermMutationInput,
} from "@engtoeic/shared";
import { authenticatedApiRequest } from "@/lib/api/browser-client";

export type EditableVocabularyTerm = VocabularyTermMutationInput;
export type EditableVocabularySet = VocabularySetMutationInput;

export function loadPersonalVocabularyLibrary() {
  return authenticatedApiRequest<PersonalVocabularyLibrary>(
    "/vocabulary-sets/mine",
    { fallbackMessage: "Không thể tải thư viện cá nhân" },
  );
}

export function loadPersonalVocabularySet(id: string) {
  return authenticatedApiRequest<PersonalVocabularySet>(
    `/vocabulary-sets/mine/${encodeURIComponent(id)}`,
    { fallbackMessage: "Không thể tải bộ từ" },
  );
}

export function createPersonalVocabularySet(values: EditableVocabularySet) {
  return authenticatedApiRequest<VocabularySet>("/vocabulary-sets", {
    method: "POST",
    body: JSON.stringify(values),
    fallbackMessage: "Không thể tạo bộ từ",
  });
}

export function updatePersonalVocabularySet(
  id: string,
  values: EditableVocabularySet,
) {
  return authenticatedApiRequest<VocabularySet>(
    `/vocabulary-sets/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
      fallbackMessage: "Không thể cập nhật bộ từ",
    },
  );
}

export function deletePersonalVocabularySet(id: string) {
  return authenticatedApiRequest<DeletedResourceResponse>(
    `/vocabulary-sets/${encodeURIComponent(id)}`,
    { method: "DELETE", fallbackMessage: "Không thể xóa bộ từ" },
  );
}

export function copyPublicVocabularySet(slug: string) {
  return authenticatedApiRequest<VocabularySet>(
    `/vocabulary-sets/${encodeURIComponent(slug)}/copy`,
    { method: "POST", fallbackMessage: "Không thể sao chép bộ từ" },
  );
}

export function createVocabularyFolder(name: string) {
  return authenticatedApiRequest<VocabularyFolder>("/vocabulary-folders", {
    method: "POST",
    body: JSON.stringify({ name }),
    fallbackMessage: "Không thể tạo thư mục",
  });
}

export function renameVocabularyFolder(id: string, name: string) {
  return authenticatedApiRequest<VocabularyFolder>(
    `/vocabulary-folders/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ name }),
      fallbackMessage: "Không thể đổi tên thư mục",
    },
  );
}

export function deleteVocabularyFolder(id: string) {
  return authenticatedApiRequest<DeletedResourceResponse>(
    `/vocabulary-folders/${encodeURIComponent(id)}`,
    { method: "DELETE", fallbackMessage: "Không thể xóa thư mục" },
  );
}
