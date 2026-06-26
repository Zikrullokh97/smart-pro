import { Injectable, NotFoundException } from '@nestjs/common';
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
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { classId: true },
      });
      const classIds = students.map(s => s.classId);
      where.classId = { in: classIds };
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
        subject: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
      },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    return homework;
  }

  async update(id: string, updateHomeworkDto: any, user: any) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    return this.prisma.homework.update({
      where: { id },
      data: updateHomeworkDto,
      include: {
        class: true,
        subject: true,
      },
    });
  }

  async remove(id: string, user: any) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    await this.prisma.homework.delete({
      where: { id },
    });

    return { message: 'Homework deleted successfully' };
  }

  async getClassHomework(classId: string) {
    return this.prisma.homework.findMany({
      where: { classId },
      include: {
        subject: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }
}