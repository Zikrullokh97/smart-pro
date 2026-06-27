import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentPortalService {
  constructor(private prisma: PrismaService) {}

  async getChildren(parentId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: parentId },
      include: {
        children: {
          include: {
            student: {
              include: {
                class: true,
                school: true,
              },
            },
          },
        },
      },
    });

    return parent?.children || [];
  }

  async getChildAttendance(studentId: string) {
    const attendance = await this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return attendance;
  }

  async getChildGrades(studentId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return grades;
  }

  async getChildHomework(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) {
      return [];
    }

    const homework = await this.prisma.homework.findMany({
      where: { classId: student.classId },
      include: {
        class: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    return homework;
  }

  async getChildSchedule(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) {
      return [];
    }

    const schedule = await this.prisma.schedule.findMany({
      where: { classId: student.classId },
      include: {
        teacher: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
        startTime: 'asc',
      },
    });

    return schedule;
  }
}