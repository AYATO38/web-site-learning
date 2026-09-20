/** Shared rank coloring for every ranked list in 次サバDAY — the per-question standings and the difficulty/final results all use the same gold/silver/bronze/white scheme. */
export function rankAccent(index: number): string {
  if (index === 0) return "from-[#f6e3a3]/60 to-transparent ring-[#d4af37]";
  if (index === 1) return "from-[#e4e6ea]/60 to-transparent ring-[#b0b4bd]";
  if (index === 2) return "from-[#e9c9a0]/55 to-transparent ring-[#c98a4b]";
  return "from-white to-white ring-border";
}

export function rankIconColor(index: number): string {
  if (index === 0) return "text-[#b8860b]";
  if (index === 1) return "text-[#8a8f99]";
  if (index === 2) return "text-[#a5652e]";
  return "text-muted-foreground";
}
