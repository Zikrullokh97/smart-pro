import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(createClassDto: any, createdBy: string) {
    return this.prisma.class.create({
      data: {
        ...createClassDto,
      },
      include: {
        school: true,
        classTeacher: true,
        students: true,
        subjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
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
        where.id = { in: classIds };
      }
    }

    return this.prisma.class.findMany({
      where,
      include: {
        school: true,
        classTeacher: true,
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        subjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });
  }

  async findOne(id: string, user: any) {
    const classData = await this.prisma.class.findUnique({
      where: { id },
      include: {
        school: true,
        classTeacher: true,
        students: true,
        subjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        schedules: true,
      },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    return classData;
  }

  async update(id: string, updateClassDto: any, user: any) {
    const classData = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        school: true,
        classTeacher: true,
        students: true,
        subjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });
  }

  async remove(id: string, user: any) {
    const classData = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    await this.prisma.class.delete({
      where: { id },
    });

    return { message: 'Class deleted successfully' };
  }

  async getClassStudents(classId: string) {
    return this.prisma.student.findMany({
      where: { classId, isActive: true },
      include: {
        user: true,
      },
    });
  }

  async getClassSubjects(classId: string) {
    return this.prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true,
        teacher: true,
      },
    });
  }
}