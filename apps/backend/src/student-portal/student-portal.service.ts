import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentPortalService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: userId },
      include: {
        class: {
          include: {
            school: true,
          },
        },
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async getAttendance(userId: string) {
    await this.verifyStudentAccess(userId);

    return this.prisma.attendance.findMany({
      where: { studentId: userId },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getGrades(userId: string) {
    await this.verifyStudentAccess(userId);

    return this.prisma.grade.findMany({
      where: { studentId: userId },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getHomework(userId: string) {
    await this.verifyStudentAccess(userId);

    const student = await this.prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.homework.findMany({
      where: { classId: student.classId },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }

  async getSchedule(userId: string) {
    await this.verifyStudentAccess(userId);

    const student = await this.prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.schedule.findMany({
      where: { classId: student.classId, isActive: true },
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
        startTime: 'asc',
      },
    });
  }

  private async verifyStudentAccess(userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: userId },
    });

    if (!student) {
      throw new ForbiddenException('Access denied');
    }
  }
}