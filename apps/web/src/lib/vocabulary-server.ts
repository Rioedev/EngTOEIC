import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getVocabularySet } from "@/lib/vocabulary";

export async function getVocabularySetForCurrentUser(slug: string) {
  if (!isSupabaseConfigured()) return getVocabularySet(slug);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return getVocabularySet(
    slug,
    user && session ? session.access_token : undefined,
  );
}
