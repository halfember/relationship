export type GiftSuggestion = { name: string; reason: string; priceRange: string };

function getPriceBounds(item: any): { min: number; max: number } | null {
  const explicitMin = Number(item?.priceMin);
  const explicitMax = Number(item?.priceMax);
  if (Number.isFinite(explicitMin) && Number.isFinite(explicitMax)) {
    return { min: explicitMin, max: explicitMax };
  }
  const numbers = String(item?.priceRange || '').match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (numbers.length >= 2) return { min: numbers[0], max: numbers[1] };
  if (numbers.length === 1) {
    if (/以内|以下/.test(item.priceRange)) return { min: 0, max: numbers[0] };
    if (/以上|起/.test(item.priceRange)) return { min: numbers[0], max: Number.POSITIVE_INFINITY };
    return { min: numbers[0], max: numbers[0] };
  }
  return null;
}

export function parseGiftSuggestions(
  raw: string,
  budget?: { min: number; max: number },
): { suggestions: GiftSuggestion[]; summary: string } {
  try {
    const normalized = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(normalized);
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
        .slice(0, 5)
        .filter((item: any) => {
          if (!item?.name || !item?.reason || !item?.priceRange) return false;
          if (!budget) return true;
          const price = getPriceBounds(item);
          return Boolean(price && price.min >= budget.min && price.max <= budget.max && price.min <= price.max);
        })
        .map((item: any) => ({
          name: String(item.name).slice(0, 40),
          reason: String(item.reason).slice(0, 160),
          priceRange: String(item.priceRange).slice(0, 30),
        }))
      : [];
    return { suggestions, summary: String(parsed.summary || '') };
  } catch {
    return { suggestions: [], summary: raw };
  }
}
