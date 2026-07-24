import { createClient } from "@/lib/supabase/client";
import type {
  PersonalVocabularyLibrary,
  VocabularyFolder,
  VocabularySet,
} from "@/lib/vocabulary";

export type EditableVocabularyTerm = {
  id?: string;
  term: string;
  meaningVi: string;
  ipa: string;
  partOfSpeech: string;
  exampleEn: string;
  exampleVi: string;
};

export type EditableVocabularySet = {
  title: string;
  description: string;
  topic: string;
  part: string;
  difficulty: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  folderId: string;
  terms: EditableVocabularyTerm[];
};

let supabaseClient: ReturnType<typeof createClient> | undefined;

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}

async function getAccessToken() {
  supabaseClient ??= createClient();
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();
  if (error || !session) throw new Error("Phiên đăng nhập đã hết hạn.");
  return session.access_token;
}

async function request<T>(
  path: string,
  init?: Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
  },
) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(" ")
      : errorBody?.message;
    throw new Error(message || `Yêu cầu thất bại (${response.status}).`);
  }

  return (await response.json()) as T;
}

export function loadPersonalVocabularyLibrary() {
  return request<PersonalVocabularyLibrary>("/vocabulary-sets/mine");
}

export function loadPersonalVocabularySet(id: string) {
  return request<VocabularySet>(
    `/vocabulary-sets/mine/${encodeURIComponent(id)}`,
  );
}

export function createPersonalVocabularySet(values: EditableVocabularySet) {
  return request<VocabularySet>("/vocabulary-sets", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updatePersonalVocabularySet(
  id: string,
  values: EditableVocabularySet,
) {
  return request<VocabularySet>(
    `/vocabulary-sets/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export function deletePersonalVocabularySet(id: string) {
  return request<{ deleted: boolean; id: string }>(
    `/vocabulary-sets/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function copyPublicVocabularySet(slug: string) {
  return request<VocabularySet>(
    `/vocabulary-sets/${encodeURIComponent(slug)}/copy`,
    { method: "POST" },
  );
}

export function createVocabularyFolder(name: string) {
  return request<VocabularyFolder>("/vocabulary-folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameVocabularyFolder(id: string, name: string) {
  return request<VocabularyFolder>(
    `/vocabulary-folders/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ name }) },
  );
}

export function deleteVocabularyFolder(id: string) {
  return request<{ deleted: boolean; id: string }>(
    `/vocabulary-folders/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
