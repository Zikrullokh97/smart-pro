import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentPortalService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      include: {
        class: true,
        school: true,
      },
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    return student;
  }

  async getAttendance(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      select: { id: true },
    });

    if (!student) {
      return [];
    }

    return this.prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 30,
    });
  }

  async getGrades(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      select: { id: true },
    });

    if (!student) {
      return [];
    }

    return this.prisma.grade.findMany({
      where: { studentId: student.id },
      include: {
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getHomework(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      select: { classId: true },
    });

    if (!student) {
      return [];
    }

    return this.prisma.homework.findMany({
      where: {
        classId: student.classId,
        isActive: true,
      },
      include: {
        class: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: 20,
    });
  }

  async getSchedule(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
      select: { classId: true },
    });

    if (!student) {
      return [];
    }

    return this.prisma.schedule.findMany({
      where: { classId: student.classId },
      include: {
        teacher: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
        startTime: 'asc',
      },
    });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }
}