import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    return this.prisma.notification.create({
      data: {
        ...data,
        userId,
        isRead: false,
      },
    });
  }

  async findAll(user: any) {
    const where: any = { userId: user.userId };
    
    if (user.roles.includes('student')) {
      where.schoolId = user.scope?.schoolId;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.prisma.notification.delete({
      where: { id },
    });
    return { message: 'Notification deleted successfully' };
  }
}