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
        teacher: true,
        students: true,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};

    return this.prisma.class.findMany({
      where,
      include: {
        school: true,
        teacher: true,
        students: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
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
        teacher: true,
        students: true,
        schedule: true,
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
        teacher: true,
        students: true,
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
    });
  }

  async getClassSubjects(classId: string) {
    // Subject model not fully integrated yet
    return [];
  }
}