import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ACTION } from './audit.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction = this.reflector.get<string>(AUDIT_ACTION, context.getHandler());
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    if (!auditAction || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const resourceId = result?.id || request.params?.id;
        
        this.prisma.auditLog.create({
          data: {
            userId: user.userId,
            action: auditAction,
            module: request.route?.path?.split('/')[1] || 'unknown',
            resourceId,
            newValues: result,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          },
        }).catch(err => console.error('Audit log failed:', err));
      }),
    );
  }
}