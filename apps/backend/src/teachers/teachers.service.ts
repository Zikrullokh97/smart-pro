import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacher.findMany({
      include: {
        user: true,
        school: true,
        classes: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        school: true,
        classes: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.teacher.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.teacher.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.teacher.delete({
      where: { id },
    });
  }

  async getTeacherSubjects(teacherId: string) {
    // Simplified - return empty array for now
    return [];
  }

  async getTeacherClasses(teacherId: string) {
    // Simplified - return classes where teacher is class teacher
    return this.prisma.class.findMany({
      where: { classTeacherId: teacherId },
    });
  }
}