/** Tag rules for habits. Tags are per-user, free-form labels; see lib/habit-schema. */
export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS_PER_HABIT = 10;

/**
 * Parses a comma-separated tag input into a clean, de-duplicated list: trims
 * each entry, drops blanks, and removes case-insensitive duplicates (keeping the
 * first-seen spelling).
 */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(",")) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(name);
  }
  return tags;
}

/** Returns a validation message for a parsed tag list, or null when it is valid. */
export function validateTags(tags: string[]): string | null {
  if (tags.length > MAX_TAGS_PER_HABIT) {
    return `Use at most ${MAX_TAGS_PER_HABIT} tags.`;
  }
  if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    return `Each tag must be ${MAX_TAG_LENGTH} characters or fewer.`;
  }
  return null;
}
