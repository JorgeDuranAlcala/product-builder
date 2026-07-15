import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserPayload } from '../../auth/auth.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUserPayload }>();
    return request.user;
  },
);
