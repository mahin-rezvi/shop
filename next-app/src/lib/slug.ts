export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
) {
  const slug = slugify(base) || "item";
  let candidate = slug;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
