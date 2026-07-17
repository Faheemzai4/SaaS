export function validateBulkLeadIds(
  value: unknown,
): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = value
    .filter(
      (id): id is string =>
        typeof id === "string" &&
        id.trim().length > 0,
    )
    .map((id) => id.trim());

  if (ids.length === 0) {
    return null;
  }

  return Array.from(new Set(ids));
}