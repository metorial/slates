import { badRequestError, ServiceError } from '@lowerdeck/error';
import type { Context } from 'hono';
import { env } from '../../env';
import { tokenService } from '../../services';

let useExtractToken = async (ctx: Context) => {
  let authHeader = ctx.req.header('Authorization');
  if (!authHeader) return null;

  let parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    throw new ServiceError(
      badRequestError({
        message: 'Invalid Authorization header format'
      })
    );
  }

  let token = parts[1];

  return token;
};

export let useAuth = async (ctx: Context) => {
  let token = await useExtractToken(ctx);
  if (!token && env.access.PUBLIC_ACCESS_PERMITTED === false) {
    throw new ServiceError(
      badRequestError({
        message: 'Missing Authorization header'
      })
    );
  }

  if (!token) return { type: 'public' as const, instance: undefined, user: undefined };

  let auth = await tokenService.authenticateWithToken({ secret: token });

  return {
    type: 'user' as const,
    ...auth
  };
};
