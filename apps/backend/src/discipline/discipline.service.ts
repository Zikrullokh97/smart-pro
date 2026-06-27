import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisciplineService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    return this.prisma.discipline.create({
      data: {
        ...data,
        recordedBy: userId,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};
    
    if (user.roles.includes('student')) {
      where.studentId = user.scope?.studentId;
    } else if (user.roles.includes('parent')) {
      const studentParents = await this.prisma.studentParent.findMany({
        where: { parentId: user.userId },
        select: { studentId: true },
      });
      const studentIds = studentParents.map(sp => sp.studentId);
      where.studentId = { in: studentIds };
    }

    return this.prisma.discipline.findMany({
      where,
      include: {
        student: true,
      },
    });
  }

  async findOne(id: string, user: any) {
    return this.prisma.discipline.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });
  }

  async update(id: string, data: any, user: any) {
    return this.prisma.discipline.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: any) {
    await this.prisma.discipline.delete({
      where: { id },
    });
    return { message: 'Discipline record deleted successfully' };
  }
}