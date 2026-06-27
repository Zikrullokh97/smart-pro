import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async create(createHomeworkDto: any, createdBy: string) {
    return this.prisma.homework.create({
      data: {
        ...createHomeworkDto,
        createdBy,
      },
      include: {
        class: true,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};
    
    if (user.roles.includes('teacher')) {
      where.teacherId = user.userId;
    }

    if (user.roles.includes('student')) {
      const student = await this.prisma.student.findUnique({
        where: { id: user.scope?.studentId },
        select: { classId: true },
      });
      where.classId = student?.classId;
    }

    return this.prisma.homework.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.homework.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });
  }

  async update(id: string, updateHomeworkDto: any) {
    return this.prisma.homework.update({
      where: { id },
      data: updateHomeworkDto,
      include: {
        class: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.homework.delete({
      where: { id },
    });
    return { message: 'Homework deleted successfully' };
  }

  async getClassHomework(classId: string) {
    return this.prisma.homework.findMany({
      where: { classId },
      include: {
        class: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }
}