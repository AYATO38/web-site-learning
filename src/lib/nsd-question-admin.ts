/**
 * Gate for the question editor: a comma-separated list of account ids, set
 * via env var rather than hardcoded (an id is an opaque UUID, unlike an
 * email, so it's fine to live in Vercel's env settings without exposing
 * anything personal).
 */
export function isQuestionEditor(userId: string | null | undefined): boolean {
  const editorIds = (process.env.NSD_QUESTION_EDITOR_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return Boolean(userId && editorIds.includes(userId));
}
