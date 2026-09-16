/**
 * Gate for the question editor: a single account id, set via env var rather
 * than hardcoded (an id is an opaque UUID, unlike an email, so it's fine to
 * live in Vercel's env settings without exposing anything personal).
 */
export function isQuestionEditor(userId: string | null | undefined): boolean {
  const editorId = process.env.NSD_QUESTION_EDITOR_ID?.trim();
  return Boolean(editorId && userId && userId === editorId);
}
