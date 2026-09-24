const WORDS_PER_MINUTE_NL = 220;

/** Strips the markdown syntax that would otherwise inflate a naive word count. */
function stripMarkdown(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#-]/g, ' ');
}

export function getReadingMinutes(rawBody: string): number {
  const words = stripMarkdown(rawBody)
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE_NL));
}

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ISO-8601 week number (1–53), Monday-start, week 1 contains the year's first Thursday. */
export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
