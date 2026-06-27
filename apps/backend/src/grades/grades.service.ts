import { Injectable } from '@nestjs/common';
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
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};

    if (user.roles.includes('student')) {
      where.studentId = user.scope?.studentId;
    }

    return this.prisma.grade.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    return this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
      },
    });
  }

  async update(id: string, updateGradeDto: any, user: any) {
    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
      include: {
        student: true,
        class: true,
      },
    });
  }

  async remove(id: string, user: any) {
    await this.prisma.grade.delete({
      where: { id },
    });
    return { message: 'Grade deleted successfully' };
  }

  async getStudentGrades(studentId: string) {
    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getClassGrades(classId: string) {
    return this.prisma.grade.findMany({
      where: { classId },
      include: {
        student: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}