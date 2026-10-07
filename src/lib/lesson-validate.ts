import { isLessonPhase, isWeekInPhase, weekRangeLabel, type Lesson } from "@/lib/lessons";

export type LessonValidation =
  | { ok: true; lesson: Lesson }
  | { ok: false; error: string };

const ID_PATTERN = /^[a-z0-9-]{1,40}$/;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateLessonInput(input: unknown): LessonValidation {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const id = text(data.id);
  if (!ID_PATTERN.test(id)) {
    return { ok: false, error: "id は英小文字・数字・ハイフンだけで、40文字以内にしてください" };
  }

  const title = text(data.title);
  if (!title || title.length > 60) {
    return { ok: false, error: "タイトルは1〜60文字で入力してください" };
  }

  const description = text(data.description);
  if (!description || description.length > 200) {
    return { ok: false, error: "説明は1〜200文字で入力してください" };
  }

  const duration = text(data.duration);
  if (!duration || duration.length > 20) {
    return { ok: false, error: "時間は1〜20文字で入力してください（例: 約12分）" };
  }

  const videoUrl = text(data.videoUrl);
  if (!/^https:\/\/\S+$/.test(videoUrl)) {
    return { ok: false, error: "動画URLは https:// で始まるURLにしてください" };
  }

  const phase = Number(data.phase);
  if (!isLessonPhase(phase)) {
    return { ok: false, error: "フェーズは PH1〜PH4 から選んでください" };
  }

  const week = Number(data.week);
  if (data.week === "" || data.week === null || !isWeekInPhase(phase, week)) {
    return { ok: false, error: `PH${phase} の Week は ${weekRangeLabel(phase)} から選んでください` };
  }

  return {
    ok: true,
    lesson: { id, title, description, duration, videoUrl, phase, week },
  };
}
