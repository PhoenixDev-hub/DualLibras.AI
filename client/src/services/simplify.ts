export default function simplifyText(text: string): string {
  if (!text) {
    return '';
  }
  return text.trim().replace(/\s+/g, ' ');
}
