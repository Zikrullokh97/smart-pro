import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  readonly refreshTokenCookieName = 'refreshToken';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const roles = userRoles.map(ur => ur.role.name);
    const permissions = userRoles.flatMap(ur =>
      ur.role.permissions.map(p => p.permission.name)
    );

    const { password: _, ...result } = user;
    return {
      ...result,
      roles,
      permissions,
    };
  }

  async login(user: any) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    await this.prisma.refreshToken.create({
      data: {
        token: this.hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: this.getRefreshExpiresAt(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });
      const tokenHash = this.hashRefreshToken(refreshToken);
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: tokenHash },
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const authUser = await this.getProfile(payload.sub);
      const accessToken = this.signAccessToken(authUser);
      const newRefreshToken = this.signRefreshToken(authUser);

      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      await this.prisma.refreshToken.create({
        data: {
          token: this.hashRefreshToken(newRefreshToken),
          userId: user.id,
          expiresAt: this.getRefreshExpiresAt(),
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: authUser.id,
          email: authUser.email,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          roles: authUser.roles,
          permissions: authUser.permissions,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { token: tokenHash },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    return this.getProfile(userId);
  }

  async getProfile(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, isActive: true },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = userRoles.map(ur => ur.role.name);
    const permissions = userRoles.flatMap(ur =>
      ur.role.permissions.map(p => p.permission.name)
    );

    const { password, ...result } = user;
    return {
      ...result,
      roles,
      permissions,
    };
  }

  getRefreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: this.isProduction() ? 'none' : 'lax',
      path: '/',
      maxAge: this.getRefreshTtlMs(),
    };
  }

  getClearRefreshCookieOptions(): CookieOptions {
    const { maxAge, ...options } = this.getRefreshCookieOptions();
    return options;
  }

  private signAccessToken(user: any): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      },
    );
  }

  private signRefreshToken(user: any): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        tokenId: randomUUID(),
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      },
    );
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET')
    );
  }

  private getRefreshExpiresAt(): Date {
    return new Date(Date.now() + this.getRefreshTtlMs());
  }

  private getRefreshTtlMs(): number {
    const value = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    const match = /^(\d+)(ms|s|m|h|d)?$/.exec(value);

    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2] || 'ms';
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
