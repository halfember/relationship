import { randomBytes } from 'crypto';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateSpaceInviteToken(length = 10): string {
  const bytes = randomBytes(length);
  let token = '';
  for (let index = 0; index < length; index += 1) {
    token += TOKEN_ALPHABET[bytes[index] % TOKEN_ALPHABET.length];
  }
  return token;
}

export function getInviteState(status: string, expiresAt: Date, now = new Date()): string {
  if (status !== 'PENDING') return status;
  return expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'PENDING';
}

export function canManageSpace(role: string): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canDeleteSharedContent(role: string, authorId: number, userId: number): boolean {
  return authorId === userId || canManageSpace(role);
}

export function canRemoveSpaceMember(spaceType: string, targetRole: string): boolean {
  return spaceType === 'FAMILY' && targetRole !== 'OWNER';
}
