import { normalizeCode } from "@/lib/nsd-grade";

export type DiffLineType = "context" | "fixed" | "wrong" | "missing";

export type DiffLine = {
  type: DiffLineType;
  text: string;
};

function splitLines(code: string): string[] {
  return code.replace(/\r\n/g, "\n").split("\n");
}

/**
 * Classic LCS line diff between `a` and `b`, comparing by a normalized key so
 * trivial formatting differences (quotes, spacing) don't register as changes.
 */
function lcsDiff(
  a: string[],
  b: string[],
): Array<{ type: "same" | "removed" | "added"; line: string }> {
  const n = a.length;
  const m = b.length;
  const ak = a.map(normalizeCode);
  const bk = b.map(normalizeCode);

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = ak[i] === bk[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const ops: Array<{ type: "same" | "removed" | "added"; line: string }> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ak[i] === bk[j]) {
      ops.push({ type: "same", line: a[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      ops.push({ type: "removed", line: a[i]! });
      i++;
    } else {
      ops.push({ type: "added", line: b[j]! });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "removed", line: a[i]! });
    i++;
  }
  while (j < m) {
    ops.push({ type: "added", line: b[j]! });
    j++;
  }
  return ops;
}

/**
 * A 3-way comparison for bugfix questions: starter (the original bug),
 * solution (the model fix), and the student's answer. Only lines that the
 * question's own starter→solution diff actually changed are colored — a
 * line the student left exactly as the (unrelated, never-buggy) starter had
 * it stays neutral, so the highlight stays scoped to what the question is
 * actually about rather than every incidental difference.
 *
 * - "fixed" (green): differs from the starter and matches the solution —
 *   the student changed this and got it right.
 * - "wrong" (red): the student's line doesn't match the solution here.
 * - "missing" (red): the solution has a line the student's answer lacks
 *   entirely.
 * - "context": matches both starter and solution — never part of the bug.
 */
export function diffBugfixAnswer(
  starter: string,
  solution: string,
  answer: string,
): DiffLine[] {
  const starterKeys = new Set(splitLines(starter).map(normalizeCode));
  const ops = lcsDiff(splitLines(answer), splitLines(solution));

  return ops.map((op): DiffLine => {
    if (op.type === "same") {
      const wasAlreadyLikeThis = starterKeys.has(normalizeCode(op.line));
      return { type: wasAlreadyLikeThis ? "context" : "fixed", text: op.line };
    }
    if (op.type === "removed") {
      return { type: "wrong", text: op.line };
    }
    return { type: "missing", text: op.line };
  });
}
