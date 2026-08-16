const RELATIONSHIP_TYPES: Record<string, string> = {
  friend: '朋友',
  family: '家人',
  lover: '恋人',
  partner: '恋人',
  colleague: '同事',
  classmate: '同学',
  other: '其他',
};

const CANONICAL_TYPES = new Set(['家人', '朋友', '恋人', '同事', '同学', '其他']);

export function normalizeRelationshipType(value?: string): string {
  const type = value?.trim();
  if (!type) return '朋友';
  if (CANONICAL_TYPES.has(type)) return type;
  return RELATIONSHIP_TYPES[type.toLowerCase()] || '其他';
}
