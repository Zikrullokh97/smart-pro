import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken = this.extractRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: tokenHash },
      });

      if (
        !storedToken ||
        storedToken.userId !== payload.sub ||
        storedToken.isRevoked ||
        storedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      request.user = {
        refreshToken,
        userId: storedToken.userId,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractRefreshToken(request: any): string | undefined {
    if (request.cookies?.refreshToken) {
      return request.cookies.refreshToken;
    }

    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) {
      return request.body?.refreshToken;
    }

    const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie: string) => {
      const [rawName, ...rawValue] = cookie.trim().split('=');
      if (rawName && rawValue.length > 0) {
        acc[rawName] = decodeURIComponent(rawValue.join('='));
      }
      return acc;
    }, {});

    return cookies.refreshToken || request.body?.refreshToken;
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET')
    );
  }
}
