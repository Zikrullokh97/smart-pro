import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentPortalService {
  constructor(private prisma: PrismaService) {}

  async getChildren(parentId: string) {
    const studentParents = await this.prisma.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            class: true,
            school: true,
          },
        },
      },
    });

    return studentParents.map(sp => ({
      id: sp.student.id,
      firstName: sp.student.firstName,
      lastName: sp.student.lastName,
      relationship: sp.relationship,
      isPrimary: sp.isPrimary,
      class: sp.student.class,
      school: sp.student.school,
    }));
  }

  async getChildAttendance(studentId: string, parentId: string) {
    await this.verifyParentAccess(studentId, parentId);

    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getChildGrades(studentId: string, parentId: string) {
    await this.verifyParentAccess(studentId, parentId);

    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getChildHomework(studentId: string, parentId: string) {
    await this.verifyParentAccess(studentId, parentId);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
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

  async getChildSchedule(studentId: string, parentId: string) {
    await this.verifyParentAccess(studentId, parentId);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
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

  private async verifyParentAccess(studentId: string, parentId: string) {
    const studentParent = await this.prisma.studentParent.findFirst({
      where: {
        studentId,
        parentId,
      },
    });

    if (!studentParent) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }
}