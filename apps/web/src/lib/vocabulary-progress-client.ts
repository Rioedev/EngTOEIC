import { createClient } from "@/lib/supabase/client";
import type {
  VocabularyProgressResponse,
  VocabularyProgressStatus,
  VocabularyStudySession,
  VocabularyTermProgress,
} from "@/lib/vocabulary";

let supabaseClient: ReturnType<typeof createClient> | undefined;

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}

function getSupabaseClient() {
  supabaseClient ??= createClient();
  return supabaseClient;
}

async function getAccessToken() {
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Phiên đăng nhập đã hết hạn.");
  }

  return session.access_token;
}

export async function loadVocabularyProgress(setSlug: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${getApiBaseUrl()}/vocabulary-sets/${encodeURIComponent(setSlug)}/progress`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Không thể tải tiến độ (${response.status}).`);
  }

  return (await response.json()) as VocabularyProgressResponse;
}

export async function saveVocabularyTermProgress(
  setSlug: string,
  termId: string,
  status: VocabularyProgressStatus,
) {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${getApiBaseUrl()}/vocabulary-sets/${encodeURIComponent(setSlug)}/terms/${encodeURIComponent(termId)}/progress`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không thể lưu tiến độ (${response.status}).`);
  }

  return (await response.json()) as VocabularyTermProgress;
}

export async function recordVocabularyTermAnswer(
  setSlug: string,
  termId: string,
  correct: boolean,
) {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${getApiBaseUrl()}/vocabulary-sets/${encodeURIComponent(setSlug)}/terms/${encodeURIComponent(termId)}/progress`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ correct }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không thể lưu kết quả học (${response.status}).`);
  }

  return (await response.json()) as VocabularyTermProgress;
}

export async function saveVocabularyStudySession(
  setSlug: string,
  currentTermId: string,
  currentIndex: number,
) {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${getApiBaseUrl()}/vocabulary-sets/${encodeURIComponent(setSlug)}/session`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentTermId, currentIndex }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không thể lưu vị trí thẻ (${response.status}).`);
  }

  return (await response.json()) as VocabularyStudySession;
}
