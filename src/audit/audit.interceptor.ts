import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        (request as Request & { auditMetadata?: Record<string, unknown> }).auditMetadata = {
          method: request.method,
          path: request.url,
          durationMs: duration,
          userAgent: request.headers['user-agent'],
        };
      }),
    );
  }
}
