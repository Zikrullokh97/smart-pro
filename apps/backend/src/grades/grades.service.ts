import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async create(createGradeDto: any, recordedBy: string) {
    return this.prisma.grade.create({
      data: {
        ...createGradeDto,
        recordedBy,
      },
      include: {
        student: true,
        class: true,
        subject: true,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher') || user.roles.includes('class_teacher')) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.userId, isActive: true },
        select: { scope: true },
      });
      
      const classIds = userRoles.flatMap(ur => ur.scope?.classIds || []);
      if (classIds.length > 0) {
        where.classId = { in: classIds };
      }
    }
    
    if (user.roles.includes('parent')) {
      const studentParents = await this.prisma.studentParent.findMany({
        where: { parentId: user.userId },
        select: { studentId: true },
      });
      const studentIds = studentParents.map(sp => sp.studentId);
      where.studentId = { in: studentIds };
    }
    
    if (user.roles.includes('student')) {
      where.studentId = user.scope?.studentId;
    }

    return this.prisma.grade.findMany({
      where,
      include: {
        student: true,
        class: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
        subject: true,
      },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async update(id: string, updateGradeDto: any, user: any) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
      include: {
        student: true,
        class: true,
        subject: true,
      },
    });
  }

  async remove(id: string, user: any) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    await this.prisma.grade.delete({
      where: { id },
    });

    return { message: 'Grade deleted successfully' };
  }

  async getStudentGrades(studentId: string, user: any) {
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

  async getClassGrades(classId: string, subjectId: string, user: any) {
    return this.prisma.grade.findMany({
      where: {
        classId,
        subjectId,
      },
      include: {
        student: true,
        subject: true,
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });
  }
}