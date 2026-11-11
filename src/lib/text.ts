/** Remove acentos e normaliza para busca. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function matchesSearch(haystack: string[], query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const text = normalize(haystack.join(" "));
  return q.split(/\s+/).every((term) => text.includes(term));
}
