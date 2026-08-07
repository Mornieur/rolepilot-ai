const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

function decodeEntity(entity: string) {
  if (entities[entity]) return entities[entity];
  const numeric = entity.match(/^&#(x[\da-f]+|\d+);$/i);
  if (!numeric) return entity;
  const value = numeric[1].toLowerCase().startsWith("x") ? Number.parseInt(numeric[1].slice(1), 16) : Number.parseInt(numeric[1], 10);
  return Number.isNaN(value) ? entity : String.fromCodePoint(value);
}

export function greenhouseHtmlToText(content: string | null | undefined) {
  if (!content) return null;
  const text = content.replace(/<(br\s*\/?|\/?(?:p|div|li|h[1-6]))\s*>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&(?:amp|lt|gt|quot|nbsp);|&#(?:x[\da-f]+|\d+);/gi, decodeEntity).replace(/[\t \r]+/g, " ").replace(/\n\s*\n\s*/g, "\n\n").trim();
  return text || null;
}

export function shortenPreview(text: string | null, maximum = 360) {
  if (!text || text.length <= maximum) return text;
  return `${text.slice(0, maximum).trimEnd()}…`;
}
