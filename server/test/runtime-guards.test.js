const test = require('node:test');
const assert = require('node:assert/strict');
const { firstValueFrom, of } = require('rxjs');
const { RateLimitGuard } = require('../dist/common/rate-limit.guard');
const { ResponseInterceptor } = require('../dist/common/response.interceptor');
const { AllExceptionFilter } = require('../dist/common/all-exception.filter');
const { AppController } = require('../dist/app.controller');
const { BadRequestException } = require('@nestjs/common');

function rateContext(userId) {
  const handler = function protectedRoute() {};
  class TestController {}
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({ userId, ip: '127.0.0.1' }),
      getResponse: () => ({ setHeader: () => {} }),
    }),
  };
}

test('rate limit guard rejects requests after the configured per-user threshold', () => {
  const reflector = { getAllAndOverride: () => ({ limit: 2, windowMs: 60_000 }) };
  const guard = new RateLimitGuard(reflector);
  const context = rateContext(7);

  assert.equal(guard.canActivate(context), true);
  assert.equal(guard.canActivate(context), true);
  assert.throws(() => guard.canActivate(context), (error) => error.getStatus() === 429);
  assert.equal(guard.canActivate(rateContext(8)), true);
});

test('response interceptor preserves an explicit unhealthy HTTP status', async () => {
  let changedStatus = null;
  const response = { statusCode: 503, status: (status) => { changedStatus = status; } };
  const context = { switchToHttp: () => ({ getResponse: () => response }) };
  const interceptor = new ResponseInterceptor();

  const result = await firstValueFrom(interceptor.intercept(context, { handle: () => of({ status: 'degraded' }) }));
  assert.equal(changedStatus, null);
  assert.equal(result.code, 0);
  assert.equal(result.data.status, 'degraded');
});

test('database health failure sets HTTP 503', async () => {
  const controller = new AppController({ $queryRaw: async () => { throw new Error('database secret'); } });
  let statusCode = 200;
  const result = await controller.healthCheck({ status: (status) => { statusCode = status; } });
  assert.equal(statusCode, 503);
  assert.equal(result.status, 'degraded');
  assert.equal(result.checks.database.status, 'error');
});

test('production exception responses do not expose internal error messages', () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let body;
  const response = {
    status: () => response,
    json: (value) => { body = value; },
  };
  const filter = new AllExceptionFilter();
  filter.logger = { error: () => {} };
  filter.catch(new Error('database password leaked'), {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/api/private' }),
    }),
  });
  assert.equal(body.message, '服务器内部错误');
  if (previousEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnv;
});

test('exception responses preserve stable business error codes', () => {
  let body;
  const response = {
    status: () => response,
    json: (value) => { body = value; },
  };
  const filter = new AllExceptionFilter();
  filter.logger = { error: () => {} };
  filter.catch(new BadRequestException({
    message: '请先处理共同空间',
    errorCode: 'ACCOUNT_HAS_OWNED_SPACES',
  }), {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'DELETE', url: '/api/user/me/account' }),
    }),
  });
  assert.equal(body.code, 400);
  assert.equal(body.errorCode, 'ACCOUNT_HAS_OWNED_SPACES');
});
