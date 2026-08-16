const assert = require('assert');
const { UnauthorizedException } = require('@nestjs/common');
const { AuthService } = require('../dist/auth/auth.service');

process.env.NODE_ENV = 'test';
process.env.AUTH_SECRET = 'test-secret-with-at-least-thirty-two-characters';

const auth = new AuthService();
const token = auth.issueAccessToken(42);
assert.equal(auth.verifyAccessToken(token).sub, 42);
assert.throws(() => auth.verifyAccessToken(`${token}x`), UnauthorizedException);
assert.throws(() => auth.verifyAccessToken('invalid'), UnauthorizedException);

console.log('auth tests passed');
