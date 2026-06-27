import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: payload.sub, isActive: true },
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

    if (userRoles.length === 0) {
      throw new UnauthorizedException();
    }

    const permissions: string[] = [];
    userRoles.forEach((ur) => {
      if (ur.role.permissions) {
        ur.role.permissions.forEach((rp) => {
          if (rp.permission) {
            permissions.push(rp.permission.name);
          }
        });
      }
    });

    return {
      userId: payload.sub,
      email: payload.email,
      roles: userRoles.map((ur) => ur.role.name),
      permissions,
    };
  }
}