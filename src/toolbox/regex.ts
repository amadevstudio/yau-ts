export function escapeSpecialCharacters(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
